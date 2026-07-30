import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbQuerySafe, runtimeState } from "@/lib/mock-store";

/**
 * GET /api/v1/ledger/balance/{home_id}
 * Retrieves ledger balances for a specific home.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  try {
    const dbData = async () => {
      const home = await prisma.home.findUniqueOrThrow({
        where: { id: homeId },
        include: {
          ledger_transactions: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
      });

      const ledger = home.ledger_transactions[0];

      return {
        home_id: home.id,
        energy_given_kwh: Number(ledger?.energy_given_kwh || 0),
        energy_received_kwh: Number(ledger?.energy_received_kwh || 0),
        net_energy_balance_kwh: Number(ledger?.net_energy_balance_kwh || 0),
        cam_bill_adjustment_inr: Number(ledger?.net_value_inr || 0),
      };
    };

    const ledgerKey =
      homeId in runtimeState.ledger
        ? (homeId as keyof typeof runtimeState.ledger)
        : "home-rajesh-v104";
    const ledgerData = runtimeState.ledger[ledgerKey];

    const fallback = {
      home_id: homeId,
      energy_given_kwh: ledgerData.energy_given_kwh,
      energy_received_kwh: ledgerData.energy_received_kwh,
      net_energy_balance_kwh: ledgerData.net_energy_balance_kwh,
      cam_bill_adjustment_inr: ledgerData.cam_bill_adjustment_inr,
    };

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
          code: "LEDGER_BALANCE_FAILED",
          message: "Failed to retrieve ledger balance.",
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
