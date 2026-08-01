import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbQuerySafe } from "@/lib/mock-store";
import { z } from "zod";
import {
  buildMeta,
  checkRateLimit,
  requireAuth,
  validateBodySize,
  safeErrorResponse,
  safeValidationError,
} from "@/lib/security";

const telemetryIngestSchema = z.object({
  home_id: z.string().regex(/^[a-zA-Z0-9\-]+$/).max(64),
  timestamp: z.string().datetime(),
  solar_gen_kw: z.number().nonnegative(),
  battery_soc_pct: z.number().min(0).max(100),
  battery_flow_kw: z.number(),
  home_demand_kw: z.number().nonnegative(),
  grid_import_kw: z.number().nonnegative(),
  grid_export_kw: z.number().nonnegative(),
  grid_status: z.enum(["NORMAL", "OUTAGE_DG_ACTIVE", "CYCLONE_ALERT"]),
});

/**
 * POST /api/v1/telemetry/ingest
 * Ingest standardized telemetry from smart meter or hybrid inverter.
 * Source: API_SPEC.md §2.1
 */
export async function POST(request: NextRequest) {
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "telemetry-ingest",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Body Size Validation (max 10KB)
  const sizeResponse = await validateBodySize(request, 10 * 1024, meta);
  if (sizeResponse) return sizeResponse;

  // 3. Authentication
  const authResponse = requireAuth(request, meta);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const parsed = telemetryIngestSchema.safeParse(body);

    if (!parsed.success) {
      return safeValidationError(parsed.error, meta);
    }

    const payload = parsed.data;

    // Write to database
    const dbWrite = async () => {
      return await prisma.energyTelemetry.create({
        data: {
          time: new Date(payload.timestamp),
          home_id: payload.home_id,
          solar_gen_kw: payload.solar_gen_kw,
          battery_soc_pct: payload.battery_soc_pct,
          battery_flow_kw: payload.battery_flow_kw,
          home_demand_kw: payload.home_demand_kw,
          grid_import_kw: payload.grid_import_kw,
          grid_export_kw: payload.grid_export_kw,
          grid_status: payload.grid_status,
        },
      });
    };

    await dbQuerySafe(
      dbWrite,
      null as unknown as Awaited<ReturnType<typeof dbWrite>>,
    );

    return NextResponse.json(
      {
        status: "success",
        data: {
          recorded: true,
          ingested_at: meta.timestamp,
        },
        meta,
      },
      { status: 201 },
    );
  } catch {
    return safeErrorResponse("INGEST_FAILED", "Failed to ingest telemetry stream.", meta, 500);
  }
}
