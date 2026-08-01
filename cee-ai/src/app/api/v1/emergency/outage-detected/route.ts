import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/lib/mock-store";
import { z } from "zod";
import {
  buildMeta,
  checkRateLimit,
  requireRole,
  validateBodySize,
  safeErrorResponse,
  safeValidationError,
} from "@/lib/security";

const outageSchema = z.object({
  community_id: z.string().uuid(),
  status: z.enum(["OUTAGE_DG_ACTIVE", "NORMAL"]),
});

/**
 * POST /api/v1/emergency/outage-detected
 * Receives line voltage sag signals or manual RWA push, triggers VPP mode.
 */
export async function POST(request: NextRequest) {
  const meta = buildMeta();

  // 1. Rate Limiting (10 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "emergency-outage-detected",
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Body Size Validation (max 10KB)
  const sizeResponse = await validateBodySize(request, 10 * 1024, meta);
  if (sizeResponse) return sizeResponse;

  // 3. Authentication & Authorization (RWA_ADMIN, PLATFORM_ADMIN or Hardware token)
  const authResponse = requireRole(request, ["RWA_ADMIN", "PLATFORM_ADMIN"], meta);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const parsed = outageSchema.safeParse(body);

    if (!parsed.success) {
      return safeValidationError(parsed.error, meta);
    }

    const payload = parsed.data;

    // Update runtimeState mock database variable
    runtimeState.gridStatus = payload.status;

    return NextResponse.json({
      status: "success",
      data: {
        grid_status: runtimeState.gridStatus,
        emergency_triage_locked: runtimeState.gridStatus === "OUTAGE_DG_ACTIVE",
        timestamp: meta.timestamp,
      },
      meta,
    });
  } catch {
    return safeErrorResponse("OUTAGE_TRIGGER_FAILED", "Failed to process outage detection webhook.", meta, 500);
  }
}
