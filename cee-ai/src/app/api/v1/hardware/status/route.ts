import { NextRequest, NextResponse } from "next/server";
import { hal } from "@/lib/hardware/hal";
import { MqttAdapter } from "@/lib/hardware/hal";
import {
  buildMeta,
  checkRateLimit,
  requireAuth,
  safeErrorResponse,
} from "@/lib/security";

/**
 * GET /api/v1/hardware/status
 * Returns hardware system status and pending dispatch commands.
 * Source: hardware/protocols/api-contract.md
 *
 * Used by:
 *   - Edge gateway (to poll for pending dispatch commands)
 *   - Dashboard (to display hardware connection status)
 */
export async function GET(request: NextRequest) {
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "hardware-status",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Authentication
  const authResponse = requireAuth(request, meta);
  if (authResponse) return authResponse;

  // Check for hardware JWT (gateway) or user session (dashboard)
  const authHeader = request.headers.get("Authorization");
  const isGatewayRequest = authHeader?.startsWith("Bearer hw-") || authHeader?.startsWith("Bearer ");

  try {
    const systemStatus = await hal.getSystemStatus();

    // Gateway-specific response includes config parameters
    if (isGatewayRequest) {
      return NextResponse.json({
        status: "success",
        data: {
          hardware_mode: systemStatus.mode,
          active_source: systemStatus.active_source,
          mqtt_available: systemStatus.mqtt_available,
          server_time: meta.timestamp,
          pending_commands: [], // Commands are delivered via MQTT; REST polling is fallback
          config: {
            staleness_ttl_seconds: parseInt(
              process.env.HARDWARE_STALENESS_TTL_SECONDS ?? "300",
              10,
            ),
            modbus_poll_fast_seconds: 5,
            modbus_poll_slow_seconds: 60,
          },
        },
        meta,
      });
    }

    // Dashboard response: simplified status for display
    return NextResponse.json({
      status: "success",
      data: {
        hardware_mode: systemStatus.mode,
        active_source: systemStatus.active_source,
        hardware_online: systemStatus.active_source === "MQTT_EDGE",
        status_label: getStatusLabel(systemStatus.active_source),
        status_color: getStatusColor(systemStatus.active_source),
        gateway_online: MqttAdapter.isGatewayOnline("gw-block-a"), // TODO: dynamic gateway ID
      },
      meta,
    });
  } catch {
    return safeErrorResponse("HARDWARE_STATUS_FAILED", "Failed to retrieve hardware status.", meta, 500);
  }
}

function getStatusLabel(source: string): string {
  switch (source) {
    case "MQTT_EDGE":
      return "Physical Hardware Online";
    case "CLOUD_API":
      return "Cloud API Active";
    case "SIMULATED":
      return "Simulation Mode";
    default:
      return "Unknown";
  }
}

function getStatusColor(source: string): string {
  switch (source) {
    case "MQTT_EDGE":
      return "green";
    case "CLOUD_API":
      return "blue";
    case "SIMULATED":
      return "amber";
    default:
      return "gray";
  }
}
