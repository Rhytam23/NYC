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
 * GET /api/v1/telemetry/home/{home_id}
 * Retrieves real-time load, generation, battery SOC, and ledger summary for a home.
 * Source: API_SPEC.md §2.2
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "telemetry-home",
    maxRequests: 60,
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
    const dbData = async () => {
      const home = await prisma.home.findUniqueOrThrow({
        where: { id: homeId },
        include: {
          energy_telemetry: {
            orderBy: { time: "desc" },
            take: 1,
          },
          ledger_transactions: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
      });

      const currentFlow = home.energy_telemetry[0];
      const ledger = home.ledger_transactions[0];

      return {
        home_id: home.id,
        resident_name: home.resident_name,
        emergency_tier: home.emergency_tier,
        current_flows: {
          solar_gen_kw: Number(currentFlow?.solar_gen_kw || 0),
          battery_soc_pct: Number(currentFlow?.battery_soc_pct || 0),
          home_demand_kw: Number(currentFlow?.home_demand_kw || 0),
          net_export_kw:
            Number(currentFlow?.grid_export_kw || 0) -
            Number(currentFlow?.grid_import_kw || 0),
        },
        ledger_summary_month_to_date: {
          energy_given_kwh: Number(ledger?.energy_given_kwh || 0),
          energy_received_kwh: Number(ledger?.energy_received_kwh || 0),
          net_energy_balance_kwh: Number(ledger?.net_energy_balance_kwh || 0),
          projected_cam_rebate_inr: Number(ledger?.net_value_inr || 0),
        },
      };
    };

    // Telemetry fallback mock mapping
    const fallbackMap: Record<string, string> = {
      "home-rajesh-v104": "Rajesh Sharma",
      "home-meenakshi-a402": "Dr. Meenakshi Sundaram",
      "home-nair-c201": "Col. V. K. Nair",
    };

    const fallbackName = fallbackMap[homeId] || "Resident Home";
    const telemetryKey =
      homeId in runtimeState.telemetry
        ? (homeId as keyof typeof runtimeState.telemetry)
        : "home-rajesh-v104";
    const ledgerKey =
      homeId in runtimeState.ledger
        ? (homeId as keyof typeof runtimeState.ledger)
        : "home-rajesh-v104";

    const flowData = runtimeState.telemetry[telemetryKey];
    const ledgerData = runtimeState.ledger[ledgerKey];

    const fallback = {
      home_id: homeId,
      resident_name: fallbackName,
      emergency_tier:
        homeId === "home-meenakshi-a402" ? "TIER_0_MEDICAL" : "TIER_2_BASIC",
      current_flows: {
        solar_gen_kw: flowData.solar_gen_kw,
        battery_soc_pct: flowData.battery_soc_pct,
        home_demand_kw: flowData.home_demand_kw,
        net_export_kw: flowData.grid_export_kw - flowData.grid_import_kw,
      },
      ledger_summary_month_to_date: {
        energy_given_kwh: ledgerData.energy_given_kwh,
        energy_received_kwh: ledgerData.energy_received_kwh,
        net_energy_balance_kwh: ledgerData.net_energy_balance_kwh,
        projected_cam_rebate_inr: Math.abs(ledgerData.cam_bill_adjustment_inr),
      },
    };

    const data = await dbQuerySafe(dbData, fallback);

    return NextResponse.json({
      status: "success",
      data,
      meta,
    });
  } catch {
    return safeErrorResponse("HOME_DATA_FAILED", "Failed to retrieve home telemetry context.", meta, 500);
  }
}
