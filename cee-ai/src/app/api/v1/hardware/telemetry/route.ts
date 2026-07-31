import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MqttAdapter } from "@/lib/hardware/hal";
import { prisma } from "@/lib/prisma";
import { dbQuerySafe } from "@/lib/mock-store";

/**
 * POST /api/v1/hardware/telemetry
 * Edge gateway pushes a batch of telemetry readings.
 * Source: hardware/protocols/api-contract.md
 *
 * Auth: Hardware JWT (pre-provisioned; validated via HARDWARE_EDGE_JWT_SECRET).
 * In this implementation, we trust the Authorization header format as a stub.
 * Full JWT validation will be implemented in the firmware sprint.
 */

const deviceHealthSchema = z.object({
  meter_online: z.boolean(),
  inverter_online: z.boolean(),
  bms_online: z.boolean(),
  bms_fault_code: z.number().int().min(0),
  temperature_c: z.number().optional(),
});

const singleReadingSchema = z.object({
  home_id: z.string().uuid(),
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
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Stub: verify Authorization header is present (full JWT validation in firmware sprint)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "HARDWARE_AUTH_INVALID",
          message: "Missing or malformed Authorization header. Hardware JWT required.",
        },
        meta: { timestamp, request_id: reqId },
      },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const payload = hardwareTelemetryBatchSchema.parse(body);

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
            // Note: telemetry_source and hardware_device_id will be added
            // to the schema in the next DB migration sprint
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
        meta: { timestamp, request_id: reqId },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "HARDWARE_VALIDATION_FAILED",
            message: "Hardware telemetry batch validation failed.",
            details: error.flatten(),
          },
          meta: { timestamp, request_id: reqId },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "HARDWARE_INGEST_FAILED",
          message: "Failed to process hardware telemetry batch.",
        },
        meta: { timestamp, request_id: reqId },
      },
      { status: 500 },
    );
  }
}
