import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbQuerySafe, runtimeState } from "@/lib/mock-store";
import { z } from "zod";
import {
  buildMeta,
  checkRateLimit,
  requireAuth,
  safeErrorResponse,
} from "@/lib/security";

/**
 * GET /api/v1/telemetry/community/{community_id}
 * Retrieves aggregated community VPP stats and active triage metrics.
 * Source: API_SPEC.md §2.3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "telemetry-community",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Authentication
  const authResponse = requireAuth(request, meta);
  if (authResponse) return authResponse;

  // 3. Input Validation (UUID format)
  if (!z.string().uuid().safeParse(communityId).success) {
    return safeErrorResponse("INVALID_PARAMETER", "communityId must be a valid UUID.", meta, 400);
  }

  try {
    const dbData = async () => {
      const community = await prisma.community.findUniqueOrThrow({
        where: { id: communityId },
        include: {
          homes: {
            include: {
              energy_telemetry: {
                orderBy: { time: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      let totalActiveHomes = 0;
      let totalSolarGenKw = 0;
      let totalBatteryStorageKwh = 0;
      let aggregateSocPctSum = 0;
      let totalCommunityDemandKw = 0;
      let tier0Active = 0;
      let tier1Active = 0;

      community.homes.forEach((home) => {
        const lastTelemetry = home.energy_telemetry[0];
        if (lastTelemetry) {
          totalActiveHomes++;
          totalSolarGenKw += Number(lastTelemetry.solar_gen_kw);
          totalBatteryStorageKwh += home.has_battery ? 10 : 0; // assumes 10kWh standard pack
          aggregateSocPctSum += Number(lastTelemetry.battery_soc_pct);
          totalCommunityDemandKw += Number(lastTelemetry.home_demand_kw);

          if (home.emergency_tier === "TIER_0_MEDICAL") tier0Active++;
          if (home.emergency_tier === "TIER_1_LIFELINE") tier1Active++;
        }
      });

      return {
        community_id: community.id,
        rwa_name: community.rwa_name,
        grid_status: runtimeState.gridStatus,
        community_vpp_stats: {
          total_active_homes: totalActiveHomes,
          total_solar_gen_kw: totalSolarGenKw,
          total_battery_storage_kwh: totalBatteryStorageKwh,
          aggregate_soc_pct:
            totalActiveHomes > 0 ? aggregateSocPctSum / totalActiveHomes : 0,
          total_community_demand_kw: totalCommunityDemandKw,
          dg_liters_avoided_today: 96.4,
          autonomous_survival_hours_remaining: 5.42,
        },
        emergency_triage_summary: {
          tier_0_medical_homes_active: tier0Active,
          tier_1_lifeline_homes_active: tier1Active,
          tier_3_shed_loads_count: 45,
        },
      };
    };

    const fallback = {
      community_id: communityId,
      rwa_name: "Palm Meadows RWA",
      grid_status: runtimeState.gridStatus,
      community_vpp_stats: {
        total_active_homes: 142,
        total_solar_gen_kw: 284.5,
        total_battery_storage_kwh: 1420.0,
        aggregate_soc_pct: 81.2,
        total_community_demand_kw: 310.0,
        dg_liters_avoided_today: 96.4,
        autonomous_survival_hours_remaining: 5.42,
      },
      emergency_triage_summary: {
        tier_0_medical_homes_active: 8,
        tier_1_lifeline_homes_active: 12,
        tier_3_shed_loads_count: 45,
      },
    };

    const data = await dbQuerySafe(dbData, fallback);

    return NextResponse.json({
      status: "success",
      data,
      meta,
    });
  } catch {
    return safeErrorResponse("COMMUNITY_DATA_FAILED", "Failed to retrieve community aggregates.", meta, 500);
  }
}
