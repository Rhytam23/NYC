import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/v1/ai/forecast/solar/{community_id}
 * Retrieves 24-hour solar generation forecast.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

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
    meta: {
      timestamp,
      request_id: reqId,
    },
  });
}
