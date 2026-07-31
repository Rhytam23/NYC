import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hal } from "@/lib/hardware/hal";
import { HardwareDispatchCommand } from "@/lib/hardware/types";

/**
 * POST /api/v1/hardware/dispatch
 * Manually trigger a hardware dispatch command to a specific home.
 * Source: hardware/protocols/api-contract.md
 *
 * Auth: User session JWT (RWA_ADMIN or PLATFORM_ADMIN role only).
 * In this stub, we trust the session cookie validated by proxy.ts middleware.
 */

const dispatchSchema = z.object({
  home_id: z.string().uuid(),
  target_action: z.enum(["CHARGE", "DISCHARGE", "IDLE", "CURTAIL"]),
  power_kw: z.number().nonnegative().max(20), // Hard cap at 20 kW for residential
  reasoning_audit_string: z.string().min(1).max(512),
});

export async function POST(request: NextRequest) {
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();
    const payload = dispatchSchema.parse(body);

    const command: HardwareDispatchCommand = {
      command_id: `cmd-manual-${reqId}`,
      home_id: payload.home_id,
      issued_at: timestamp,
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
          queued_at: timestamp,
          delivery_method: hal.getHardwareMode() === "mqtt_edge" ? "MQTT" : "SIMULATED",
          ack,
        },
        meta: { timestamp, request_id: reqId },
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "VALIDATION_FAILED",
            message: "Dispatch command validation failed.",
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
          code: "DISPATCH_FAILED",
          message: "Failed to send dispatch command.",
        },
        meta: { timestamp, request_id: reqId },
      },
      { status: 500 },
    );
  }
}
