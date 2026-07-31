import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MqttAdapter } from "@/lib/hardware/hal";

/**
 * POST /api/v1/hardware/heartbeat
 * Edge gateway health ping — confirms gateway is alive.
 * Source: hardware/protocols/api-contract.md
 *
 * Called by the edge gateway every 60 seconds.
 * Updates the gateway's last-seen timestamp in the HAL.
 */

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
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "HARDWARE_AUTH_INVALID",
          message: "Hardware JWT required.",
        },
        meta: { timestamp, request_id: reqId },
      },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const payload = heartbeatSchema.parse(body);

    // Update HAL gateway heartbeat cache
    MqttAdapter.updateGatewayHeartbeat(payload.gateway_id);

    // Log heartbeat details for monitoring (in production, write to HardwareHealthLog)
    const healthSummary = {
      gateway_id: payload.gateway_id,
      uptime_hours: (payload.uptime_seconds / 3600).toFixed(1),
      devices: `${payload.modbus_devices_online}/${payload.modbus_devices_total} online`,
      buffer: payload.local_buffer_records > 0 ? `${payload.local_buffer_records} buffered` : "empty",
      temperature: payload.temperature_c ? `${payload.temperature_c.toFixed(1)}°C` : "N/A",
    };
    console.log("[Hardware Heartbeat]", healthSummary);

    return NextResponse.json({
      status: "success",
      data: {
        acknowledged: true,
        server_time: timestamp,
      },
      meta: { timestamp, request_id: reqId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "HARDWARE_VALIDATION_FAILED",
            message: "Heartbeat payload validation failed.",
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
          code: "HEARTBEAT_FAILED",
          message: "Failed to process gateway heartbeat.",
        },
        meta: { timestamp, request_id: reqId },
      },
      { status: 500 },
    );
  }
}
