import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbQuerySafe } from "@/lib/mock-store";

/**
 * GET /api/v1/ledger/community/{community_id}
 * Retrieves RWA-wide virtual netting statements.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params;
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  try {
    const dbData = async () => {
      const settlements = await prisma.monthlySettlement.findMany({
        where: {
          community_id: communityId,
          status: "DRAFT",
        },
        include: {
          home: true,
        },
      });

      return settlements.map((settle) => ({
        home_id: settle.home_id,
        resident_name: settle.home.resident_name,
        mygate_flat_id: settle.home.mygate_flat_id,
        energy_given_kwh: Number(settle.total_energy_given_kwh),
        energy_received_kwh: Number(settle.total_energy_received_kwh),
        net_energy_balance_kwh: Number(settle.net_energy_balance_kwh),
        cam_bill_adjustment_inr: Number(settle.cam_bill_adjustment_inr),
        adjustment_type:
          Number(settle.net_energy_balance_kwh) >= 0
            ? "CREDIT_REBATE"
            : "DEBIT_SURCHARGE",
        dg_liters_saved_equivalent: Number(settle.dg_liters_saved_equivalent),
      }));
    };

    // Fallback matches ENERGY_LEDGER.md §5 JSON format
    const fallback = [
      {
        home_id: "home-rajesh-v104",
        resident_name: "Rajesh Sharma",
        mygate_flat_id: "V-104",
        energy_given_kwh: 180.5,
        energy_received_kwh: 20.0,
        net_energy_balance_kwh: 160.5,
        cam_bill_adjustment_inr: -1372.28,
        adjustment_type: "CREDIT_REBATE",
        dg_liters_saved_equivalent: 48.15,
      },
      {
        home_id: "home-meenakshi-a402",
        resident_name: "Dr. Meenakshi Sundaram",
        mygate_flat_id: "A-402",
        energy_given_kwh: 0.0,
        energy_received_kwh: 40.0,
        net_energy_balance_kwh: -40.0,
        cam_bill_adjustment_inr: 380.0,
        adjustment_type: "DEBIT_SURCHARGE",
        dg_liters_saved_equivalent: 0.0,
      },
    ];

    const data = await dbQuerySafe(dbData, fallback);

    return NextResponse.json({
      status: "success",
      data,
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
          code: "LEDGER_COMMUNITY_FAILED",
          message: "Failed to retrieve RWA settlements list.",
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
