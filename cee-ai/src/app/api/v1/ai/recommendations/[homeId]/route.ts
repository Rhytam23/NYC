import { NextRequest, NextResponse } from "next/server";
import { generateGeminiRecommendations } from "@/lib/ai/decision-engine";
import { runtimeState } from "@/lib/mock-store";
import { z } from "zod";
import {
  buildMeta,
  checkRateLimit,
  requireAuth,
  safeErrorResponse,
} from "@/lib/security";

/**
 * GET /api/v1/ai/recommendations/{home_id}
 * Returns structured actionable energy saving tips generated via Gemini.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  const meta = buildMeta();

  // 1. Rate Limiting (30 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "ai-recommendations",
    maxRequests: 30,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Authentication
  const authResponse = requireAuth(request, meta);
  if (authResponse) return authResponse;

  // 3. Input Validation (Safe alphanumeric/hyphen pattern)
  if (!z.string().regex(/^[a-zA-Z0-9\-]+$/).max(64).safeParse(homeId).success) {
    return safeErrorResponse("INVALID_PARAMETER", "homeId must be a valid alphanumeric/hyphen string.", meta, 400);
  }

  try {
    // Determine resident parameters
    const fallbackMap: Record<string, string> = {
      "home-rajesh-v104": "Rajesh Sharma",
      "home-meenakshi-a402": "Dr. Meenakshi Sundaram",
      "home-nair-c201": "Col. V. K. Nair",
    };
    const residentName = fallbackMap[homeId] || "Resident Home";

    const telemetryKey =
      homeId in runtimeState.telemetry
        ? (homeId as keyof typeof runtimeState.telemetry)
        : "home-rajesh-v104";
    const flowData = runtimeState.telemetry[telemetryKey];

    // Call Gemini recommendation builder
    const recommendations = await generateGeminiRecommendations(
      residentName,
      flowData.battery_soc_pct,
      flowData.solar_gen_kw,
      flowData.home_demand_kw,
      runtimeState.gridStatus,
    );

    return NextResponse.json({
      status: "success",
      data: {
        home_id: homeId,
        recommendations,
      },
      meta,
    });
  } catch {
    return safeErrorResponse("AI_RECOMMENDATIONS_FAILED", "Failed to generate AI insights tips.", meta, 500);
  }
}
