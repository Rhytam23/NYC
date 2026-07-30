import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbQuerySafe } from "@/lib/mock-store";
import { z } from "zod";

const telemetryIngestSchema = z.object({
  home_id: z.string().uuid(),
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
  const reqId = `req-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();
    const payload = telemetryIngestSchema.parse(body);

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
          ingested_at: timestamp,
        },
        meta: {
          timestamp,
          request_id: reqId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "VALIDATION_FAILED",
            message: "Telemetry schema validation failed.",
            details: error.flatten(),
          },
          meta: {
            timestamp,
            request_id: reqId,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "INGEST_FAILED",
          message: "Failed to ingest telemetry stream.",
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
