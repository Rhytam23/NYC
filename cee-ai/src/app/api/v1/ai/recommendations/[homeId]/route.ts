import { NextRequest, NextResponse } from "next/server";
import { generateGeminiRecommendations } from "@/lib/ai/decision-engine";
import { runtimeState } from "@/lib/mock-store";

/**
 * GET /api/v1/ai/recommendations/{home_id}
 * Returns structured actionable energy saving tips generated via Gemini.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

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
          code: "AI_RECOMMENDATIONS_FAILED",
          message: "Failed to generate AI insights tips.",
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
