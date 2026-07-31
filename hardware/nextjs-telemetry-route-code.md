# Next.js 16 Telemetry API Route Code (`route.ts`)

To allow your physical ESP32 or Wokwi simulator to talk to your Next.js application, add this route file to your Next.js backend.

### Target Path in Your Project
Place this file exactly at:
`cee-ai/src/app/api/v1/telemetry/ingest/route.ts`

---

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, grid_status, solar_gen_kw, battery_soc } = body;

    // 1. Validate inputs
    if (!device_id || !grid_status) {
      return NextResponse.json({ error: 'Missing device_id or grid_status' }, { status: 400 });
    }

    // 2. Identify the active Home and Community
    // For local hackathon testing, we find or auto-create a fallback community and home
    let home = await prisma.home.findFirst({
      include: { community: true }
    });

    if (!home) {
      // Auto-create a test community
      const testCommunity = await prisma.community.create({
        data: {
          rwa_name: 'Palm Meadows RWA (Mock)',
          rwa_code: 'PALM-MEADOWS-001',
          city: 'Bangalore',
          grid_tariff_inr: 8.50,
          dg_tariff_inr: 26.00,
          clearing_rate_inr: 9.50
        }
      });

      // Auto-create a test home linked to that community
      home = await prisma.home.create({
        data: {
          community_id: testCommunity.id,
          resident_name: 'Hackathon Demo User',
          mygate_flat_id: 'VILLA-101',
          emergency_tier: 'TIER_2_BASIC',
          min_soc_reserve_pct: 20,
          has_solar: true,
          has_battery: true
        },
        include: { community: true }
      });
    }

    // 3. Save telemetry data to energy_telemetry table
    // (Translates incoming payload to database format)
    const solarKw = Number(solar_gen_kw || 0);
    const soc = Number(battery_soc || 0);
    
    await prisma.energyTelemetry.create({
      data: {
        time: new Date(),
        home_id: home.id,
        solar_gen_kw: solarKw,
        battery_soc_pct: soc,
        grid_status: grid_status,
        // Mocking other flows for simulation purposes
        battery_flow_kw: grid_status === 'OUTAGE' ? -2.5 : 1.2,
        home_demand_kw: grid_status === 'OUTAGE' ? 1.5 : 4.2,
        grid_import_kw: grid_status === 'OUTAGE' ? 0.0 : 3.0,
        grid_export_kw: 0.0
      }
    });

    // 4. Decision Engine Logic (Four-Tier Emergency Triage)
    let command_shed_non_essential = false;
    let system_status = "GRID_ONLINE_NORMAL";

    if (grid_status === 'OUTAGE') {
      if (soc > home.min_soc_reserve_pct) {
        // Run essential loads, shed heavy non-essential loads
        command_shed_non_essential = true;
        system_status = "GRID_OUTAGE_LOAD_SHEDDING";
      } else {
        // Critical SOC floor protection
        command_shed_non_essential = true;
        system_status = "BATTERY_CRITICAL_SHUTDOWN";
      }
    }

    // 5. Send back immediate physical relay instructions
    return NextResponse.json({
      success: true,
      home_id: home.id,
      flat_id: home.mygate_flat_id,
      system_status: system_status,
      relay_commands: {
        essential_relay: soc > 15 ? "ON" : "OFF", // Deep discharge threshold
        non_essential_relay: command_shed_non_essential ? "OFF" : "ON"
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Telemetry API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```
