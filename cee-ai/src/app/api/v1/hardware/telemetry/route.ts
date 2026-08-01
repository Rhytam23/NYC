import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MqttAdapter } from "@/lib/hardware/hal";
import { prisma } from "@/lib/prisma";
import { dbQuerySafe } from "@/lib/mock-store";
import {
  buildMeta,
  checkRateLimit,
  isHardwareAuthenticated,
  validateBodySize,
  safeErrorResponse,
  safeValidationError,
} from "@/lib/security";

const deviceHealthSchema = z.object({
  meter_online: z.boolean(),
  inverter_online: z.boolean(),
  bms_online: z.boolean(),
  bms_fault_code: z.number().int().min(0),
  temperature_c: z.number().optional(),
});

const singleReadingSchema = z.object({
  home_id: z.string().regex(/^[a-zA-Z0-9\-]+$/).max(64),
  timestamp: z.string().datetime(),
  telemetry_source: z.enum(["MQTT_EDGE", "CLOUD_API", "SIMULATED", "MANUAL"]),
  solar_gen_kw: z.number().nonnegative(),
  battery_soc_pct: z.number().min(0).max(100),
  battery_flow_kw: z.number(),
  home_demand_kw: z.number().nonnegative(),
  grid_import_kw: z.number().nonnegative(),
  grid_export_kw: z.number().nonnegative(),
  grid_voltage_v: z.number().min(0).max(500).optional(),
  power_factor: z.number().min(0).max(1).optional(),
  grid_status: z.enum(["NORMAL", "OUTAGE_DG_ACTIVE", "CYCLONE_ALERT"]),
  hardware_device_id: z.string().optional(),
  device_health: deviceHealthSchema.optional(),
});

const hardwareTelemetryBatchSchema = z.object({
  gateway_id: z.string(),
  community_id: z.string().uuid(),
  batch_timestamp: z.string().datetime(),
  readings: z.array(singleReadingSchema).min(1).max(100),
});

export async function POST(request: NextRequest) {
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "hardware-telemetry",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Body Size Validation (max 100KB)
  const sizeResponse = await validateBodySize(request, 100 * 1024, meta);
  if (sizeResponse) return sizeResponse;

  // 3. Authentication
  if (!isHardwareAuthenticated(request)) {
    return safeErrorResponse(
      "HARDWARE_AUTH_INVALID",
      "Missing or malformed Authorization header. Hardware JWT required.",
      meta,
      401,
    );
  }

  try {
    const body = await request.json();
    const parsed = hardwareTelemetryBatchSchema.safeParse(body);

    if (!parsed.success) {
      return safeValidationError(parsed.error, meta);
    }

    const payload = parsed.data;

    let accepted = 0;
    let rejected = 0;
    const pendingCommands: unknown[] = [];

    for (const reading of payload.readings) {
      // Validate timestamp is within ±5 minutes of server time (anti-replay)
      const readingAge = Math.abs(
        (Date.now() - new Date(reading.timestamp).getTime()) / 1000,
      );
      if (readingAge > 300) {
        rejected++;
        continue;
      }

      // Update the MQTT adapter cache with this reading
      MqttAdapter.updateCacheFromPayload({
        ...reading,
        device_health: reading.device_health
          ? {
              ...reading.device_health,
              last_updated_at: reading.timestamp,
            }
          : {
              meter_online: true,
              inverter_online: true,
              bms_online: true,
              bms_fault_code: 0,
              last_updated_at: reading.timestamp,
            },
      });

      // Persist to EnergyTelemetry table
      const dbWrite = async () => {
        return await prisma.energyTelemetry.create({
          data: {
            time: new Date(reading.timestamp),
            home_id: reading.home_id,
            solar_gen_kw: reading.solar_gen_kw,
            battery_soc_pct: reading.battery_soc_pct,
            battery_flow_kw: reading.battery_flow_kw,
            home_demand_kw: reading.home_demand_kw,
            grid_import_kw: reading.grid_import_kw,
            grid_export_kw: reading.grid_export_kw,
            grid_status: reading.grid_status,
          },
        });
      };

      await dbQuerySafe(dbWrite, null as unknown as Awaited<ReturnType<typeof dbWrite>>);
      accepted++;
    }

    // Update gateway heartbeat timestamp
    MqttAdapter.updateGatewayHeartbeat(payload.gateway_id);

    return NextResponse.json(
      {
        status: "success",
        data: {
          accepted,
          rejected,
          pending_commands: pendingCommands,
        },
        meta,
      },
      { status: 201 },
    );
  } catch {
    return safeErrorResponse("HARDWARE_INGEST_FAILED", "Failed to process hardware telemetry batch.", meta, 500);
  }
}
