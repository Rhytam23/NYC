import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hal } from "@/lib/hardware/hal";
import { HardwareDispatchCommand } from "@/lib/hardware/types";
import {
  buildMeta,
  checkRateLimit,
  requireRole,
  validateBodySize,
  safeErrorResponse,
  safeValidationError,
} from "@/lib/security";

const dispatchSchema = z.object({
  home_id: z.string().regex(/^[a-zA-Z0-9\-]+$/).max(64),
  target_action: z.enum(["CHARGE", "DISCHARGE", "IDLE", "CURTAIL"]),
  power_kw: z.number().nonnegative().max(20), // Hard cap at 20 kW for residential
  reasoning_audit_string: z.string().min(1).max(512),
});

export async function POST(request: NextRequest) {
  const meta = buildMeta();

  // 1. Rate Limiting (20 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "hardware-dispatch",
    maxRequests: 20,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Body Size Validation (max 10KB)
  const sizeResponse = await validateBodySize(request, 10 * 1024, meta);
  if (sizeResponse) return sizeResponse;

  // 3. Authentication & Authorization (RWA_ADMIN or PLATFORM_ADMIN)
  const authResponse = requireRole(request, ["RWA_ADMIN", "PLATFORM_ADMIN"], meta);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const parsed = dispatchSchema.safeParse(body);

    if (!parsed.success) {
      return safeValidationError(parsed.error, meta);
    }

    const payload = parsed.data;

    const command: HardwareDispatchCommand = {
      command_id: `cmd-manual-${meta.request_id}`,
      home_id: payload.home_id,
      issued_at: meta.timestamp,
      expires_at: new Date(Date.now() + 60_000).toISOString(), // 60-second expiry
      target_action: payload.target_action,
      power_kw: payload.power_kw,
      reasoning_audit_string: payload.reasoning_audit_string,
    };

    // Route through HAL (applies safety constraints before dispatching)
    const ack = await hal.sendDispatchCommand(command);

    return NextResponse.json(
      {
        status: "success",
        data: {
          command_id: command.command_id,
          home_id: command.home_id,
          queued_at: meta.timestamp,
          delivery_method: hal.getHardwareMode() === "mqtt_edge" ? "MQTT" : "SIMULATED",
          ack,
        },
        meta,
      },
      { status: 202 },
    );
  } catch {
    return safeErrorResponse("DISPATCH_FAILED", "Failed to send dispatch command.", meta, 500);
  }
}
