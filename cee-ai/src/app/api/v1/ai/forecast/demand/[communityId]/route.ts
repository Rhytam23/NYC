import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/v1/ai/forecast/demand/{community_id}
 * Retrieves 24-hour aggregate household demand load forecast.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Generate 24 hourly data points starting from current hour
  const hourlyForecast = Array.from({ length: 24 }).map((_, i) => {
    const hour = (new Date().getHours() + i) % 24;
    // Simulate typical household double peak (morning 8-10 AM, evening 7-9 PM)
    let baseLoad = 120; // kW base community load
    if (hour >= 8 && hour <= 10) baseLoad = 280;
    if (hour >= 19 && hour <= 21) baseLoad = 340;
    return {
      hour: `${hour}:00`,
      demand_forecast_kw: baseLoad + Math.random() * 30,
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
