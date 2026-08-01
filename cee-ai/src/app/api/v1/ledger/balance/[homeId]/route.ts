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
 * GET /api/v1/ledger/balance/{home_id}
 * Retrieves ledger balances for a specific home.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string }> },
) {
  const { homeId } = await params;
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "ledger-balance",
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
      meta,
    });
  } catch {
    return safeErrorResponse("LEDGER_BALANCE_FAILED", "Failed to retrieve ledger balance.", meta, 500);
  }
}
