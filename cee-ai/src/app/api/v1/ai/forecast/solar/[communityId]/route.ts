import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildMeta,
  checkRateLimit,
  requireAuth,
  safeErrorResponse,
} from "@/lib/security";

/**
 * GET /api/v1/ai/forecast/solar/{community_id}
 * Retrieves 24-hour solar generation forecast.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "ai-forecast-solar",
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
    // Generate 24 hourly solar output data points starting from current hour
    const hourlyForecast = Array.from({ length: 24 }).map((_, i) => {
      const hour = (new Date().getHours() + i) % 24;
      // Bell curve representing solar day (6 AM to 6 PM)
      let solarOutput = 0;
      if (hour >= 6 && hour <= 18) {
        const peakHour = 12;
        solarOutput = 350 * Math.exp(-Math.pow(hour - peakHour, 2) / 16);
      }
      return {
        hour: `${hour}:00`,
        solar_forecast_kw: Math.max(0, solarOutput),
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        community_id: communityId,
        forecast_resolution: "1_hour",
        forecast_horizon: "24_hours",
        series: hourlyForecast,
      },
      meta,
    });
  } catch {
    return safeErrorResponse("FORECAST_FAILED", "Failed to retrieve solar forecast.", meta, 500);
  }
}
