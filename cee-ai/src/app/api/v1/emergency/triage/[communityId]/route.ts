import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/lib/mock-store";

/**
 * GET /api/v1/emergency/triage/{community_id}
 * Retrieves active triage queues and remaining survival clocks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    status: "success",
    data: {
      community_id: communityId,
      grid_status: runtimeState.gridStatus,
      survival_clock: {
        aggregate_soc_pct:
          runtimeState.gridStatus === "OUTAGE_DG_ACTIVE" ? 78.5 : 95.0,
        autonomous_survival_hours_remaining:
          runtimeState.gridStatus === "OUTAGE_DG_ACTIVE" ? 5.42 : 12.0,
        dg_avoided: runtimeState.gridStatus === "OUTAGE_DG_ACTIVE",
      },
      triage_queues: {
        tier_0_medical_homes_active: 8,
        tier_1_lifeline_homes_active: 12,
        tier_3_shed_loads_count: 45,
      },
    },
    meta: {
      timestamp,
      request_id: reqId,
    },
  });
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    status: "success",
    data: {
      community_id: communityId,
      grid_status: runtimeState.gridStatus,
      triage_queues: {
        tier_0_medical_homes_active: 8,
        tier_1_lifeline_homes_active: 12,
        tier_3_shed_loads_count: 45,
      },
    },
    meta: {
      timestamp,
      request_id: reqId,
    },
  });
}
