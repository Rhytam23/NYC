import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/lib/mock-store";
import { z } from "zod";

const outageSchema = z.object({
  community_id: z.string().uuid(),
  status: z.enum(["OUTAGE_DG_ACTIVE", "NORMAL"]),
});

/**
 * POST /api/v1/emergency/outage-detected
 * Receives line voltage sag signals or manual RWA push, triggers VPP mode.
 */
export async function POST(request: NextRequest) {
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();
    const payload = outageSchema.parse(body);

    // Update runtimeState mock database variable
    runtimeState.gridStatus = payload.status;

    return NextResponse.json({
      status: "success",
      data: {
        grid_status: runtimeState.gridStatus,
        emergency_triage_locked: runtimeState.gridStatus === "OUTAGE_DG_ACTIVE",
        timestamp,
      },
      meta: {
        timestamp,
        request_id: reqId,
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "OUTAGE_TRIGGER_FAILED",
          message: "Failed to process outage detection webhook.",
        },
        meta: {
          timestamp,
          request_id: reqId,
        },
      },
      { status: 500 },
    );
  }
}
