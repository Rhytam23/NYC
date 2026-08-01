import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MqttAdapter } from "@/lib/hardware/hal";
import {
  buildMeta,
  checkRateLimit,
  isHardwareAuthenticated,
  validateBodySize,
  safeErrorResponse,
  safeValidationError,
} from "@/lib/security";

const heartbeatSchema = z.object({
  gateway_id: z.string().min(1),
  community_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  uptime_seconds: z.number().nonnegative(),
  firmware_version: z.string(),
  modbus_devices_online: z.number().int().nonnegative(),
  modbus_devices_total: z.number().int().nonnegative(),
  mqtt_reconnects: z.number().int().nonnegative(),
  local_buffer_records: z.number().int().nonnegative(),
  temperature_c: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "hardware-heartbeat",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Body Size Validation (max 10KB)
  const sizeResponse = await validateBodySize(request, 10 * 1024, meta);
  if (sizeResponse) return sizeResponse;

  // 3. Authentication
  if (!isHardwareAuthenticated(request)) {
    return safeErrorResponse(
      "HARDWARE_AUTH_INVALID",
      "Hardware JWT required.",
      meta,
      401,
    );
  }

  try {
    const body = await request.json();
    const parsed = heartbeatSchema.safeParse(body);

    if (!parsed.success) {
      return safeValidationError(parsed.error, meta);
    }

    const payload = parsed.data;

    // Update HAL gateway heartbeat cache
    MqttAdapter.updateGatewayHeartbeat(payload.gateway_id);

    // Guard console logs in production
    if (process.env.NODE_ENV !== "production") {
      const healthSummary = {
        gateway_id: payload.gateway_id,
        uptime_hours: (payload.uptime_seconds / 3600).toFixed(1),
        devices: `${payload.modbus_devices_online}/${payload.modbus_devices_total} online`,
        buffer: payload.local_buffer_records > 0 ? `${payload.local_buffer_records} buffered` : "empty",
        temperature: payload.temperature_c ? `${payload.temperature_c.toFixed(1)}°C` : "N/A",
      };
      console.log("[Hardware Heartbeat]", healthSummary);
    }

    return NextResponse.json({
      status: "success",
      data: {
        acknowledged: true,
        server_time: meta.timestamp,
      },
      meta,
    });
  } catch {
    return safeErrorResponse("HEARTBEAT_FAILED", "Failed to process gateway heartbeat.", meta, 500);
  }
}
