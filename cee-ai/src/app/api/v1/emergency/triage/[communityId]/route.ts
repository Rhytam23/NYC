import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/lib/mock-store";
import { z } from "zod";
import {
  buildMeta,
  checkRateLimit,
  requireAuth,
  safeErrorResponse,
} from "@/lib/security";

/**
 * GET /api/v1/emergency/triage/{community_id}
 * Retrieves active triage queues and remaining survival clocks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "emergency-triage-get",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Authentication
  const authResponse = requireAuth(request, meta);
  if (authResponse) return authResponse;

  // 3. Input Validation (UUID)
  if (!z.string().uuid().safeParse(communityId).success) {
    return safeErrorResponse("INVALID_PARAMETER", "communityId must be a valid UUID.", meta, 400);
  }

  try {
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
      meta,
    });
  } catch {
    return safeErrorResponse("TRIAGE_DATA_FAILED", "Failed to retrieve triage queues.", meta, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "emergency-triage-post",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Authentication
  const authResponse = requireAuth(request, meta);
  if (authResponse) return authResponse;

  // 3. Input Validation (UUID)
  if (!z.string().uuid().safeParse(communityId).success) {
    return safeErrorResponse("INVALID_PARAMETER", "communityId must be a valid UUID.", meta, 400);
  }

  try {
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
      meta,
    });
  } catch {
    return safeErrorResponse("TRIAGE_POST_FAILED", "Failed to update triage queues.", meta, 500);
  }
}
