import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildMeta,
  checkRateLimit,
  requireAuth,
  safeErrorResponse,
} from "@/lib/security";

// Sample dispatch logs
const MOCK_DISPATCH_LOGS = [
  {
    id: "dsp-10049",
    timestamp: "2026-08-01T10:15:22Z",
    community: "Palm Meadows RWA",
    type: "VPP Peak Shaving",
    status: "COMPLETED",
    summary: "Optimized community battery pool discharge to offset home demand peaks.",
    energy: 12.8,
  },
  {
    id: "dsp-10048",
    timestamp: "2026-08-01T08:30:00Z",
    community: "Palm Meadows RWA",
    type: "Emergency Triage",
    status: "ACTIVE",
    summary: "Throttled EV charger Nexon in Flat V-104 and redirected battery supply to Tier 0 medical ventilator in Flat A-402.",
    energy: 8.5,
  },
  {
    id: "dsp-10047",
    timestamp: "2026-08-01T05:00:10Z",
    community: "Palm Meadows RWA",
    type: "Solar Self-Consumption",
    status: "COMPLETED",
    summary: "Directed solar surplus to charge home battery storage up to 85% SOC.",
    energy: 15.2,
  },
  {
    id: "dsp-10046",
    timestamp: "2026-07-31T22:15:00Z",
    community: "Palm Meadows RWA",
    type: "Microgrid Islanding",
    status: "COMPLETED",
    summary: "Grid outage detected. Severed utility relay and switched common bus to VPP microgrid battery pool.",
    energy: 24.0,
  },
  {
    id: "dsp-10045",
    timestamp: "2026-07-31T18:45:12Z",
    community: "Palm Meadows RWA",
    type: "VPP Peak Shaving",
    status: "FAILED",
    summary: "Failed to dispatch command to gateway Block-C due to Modbus checksum timeout.",
    energy: 0.0,
  },
  {
    id: "dsp-10044",
    timestamp: "2026-07-31T12:00:00Z",
    community: "Palm Meadows RWA",
    type: "Solar Self-Consumption",
    status: "COMPLETED",
    summary: "Routed excess solar generation from Rajesh's flat to common area lighting circuits.",
    energy: 9.4,
  },
];

export async function GET(request: NextRequest) {
  const meta = buildMeta();

  // 1. Rate Limiting (60 requests per minute)
  const rateLimitResponse = checkRateLimit(request, {
    key: "hardware-dispatch-logs",
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Authentication
  const authResponse = requireAuth(request, meta);
  if (authResponse) return authResponse;

  try {
    const { searchParams } = new URL(request.url);
    const queryRaw = searchParams.get("query") || "";
    const typeRaw = searchParams.get("type") || "ALL";
    const statusRaw = searchParams.get("status") || "ALL";

    // Sanitize and validate inputs
    const query = z.string().max(100).safeParse(queryRaw).success ? queryRaw.toLowerCase() : "";
    const type = z.string().max(50).safeParse(typeRaw).success ? typeRaw : "ALL";
    const status = z.string().max(50).safeParse(statusRaw).success ? statusRaw : "ALL";

    let filtered = MOCK_DISPATCH_LOGS;

    if (query) {
      filtered = filtered.filter(
        (log) =>
          log.id.toLowerCase().includes(query) ||
          log.summary.toLowerCase().includes(query) ||
          log.type.toLowerCase().includes(query)
      );
    }

    if (type !== "ALL") {
      filtered = filtered.filter((log) => log.type === type);
    }

    if (status !== "ALL") {
      filtered = filtered.filter((log) => log.status === status);
    }

    return NextResponse.json({
      status: "success",
      data: filtered,
      meta: {
        total: filtered.length,
        ...meta,
      },
    });
  } catch {
    return safeErrorResponse("LOGS_FETCH_FAILED", "Failed to retrieve dispatch logs.", meta, 500);
  }
}
