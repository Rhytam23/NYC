import { PrismaClient, EmergencyTier, OemProvider, SettlementStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Seeding CEE-AI Database...");

  // 1. Clean existing records to avoid duplicates
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.monthlySettlement.deleteMany({});
  await prisma.ledgerTransaction.deleteMany({});
  await prisma.energyTelemetry.deleteMany({});
  await prisma.inverter.deleteMany({});
  await prisma.home.deleteMany({});
  await prisma.community.deleteMany({});

  // 2. Create Community: Palm Meadows RWA (from PRD §7.4, BUSINESS_MODEL.md §3)
  const community = await prisma.community.create({
    data: {
      rwa_name: "Palm Meadows RWA",
      rwa_code: "PALM-MEADOWS-089",
      city: "Bangalore",
      state: "Karnataka",
      discom_name: "BESCOM",
      grid_tariff_inr: 8.50,
      dg_tariff_inr: 26.00,
      clearing_rate_inr: 9.50,
    },
  });

  console.log(`Created community: ${community.rwa_name} (${community.rwa_code})`);

  // 3. Create Homes (from USER_PERSONAS.md)
  // Home 1: Rajesh Sharma (Surplus Provider)
  const homeRajesh = await prisma.home.create({
    data: {
      community_id: community.id,
      resident_name: "Rajesh Sharma",
      mygate_flat_id: "V-104",
      emergency_tier: EmergencyTier.TIER_2_BASIC,
      min_soc_reserve_pct: 35,
      has_solar: true,
      has_battery: true,
      has_ev: true,
    },
  });

  // Home 2: Dr. Meenakshi Sundaram (Deficit Consumer - Tier 0 Medical)
  const homeMeenakshi = await prisma.home.create({
    data: {
      community_id: community.id,
      resident_name: "Dr. Meenakshi Sundaram",
      mygate_flat_id: "A-402",
      emergency_tier: EmergencyTier.TIER_0_MEDICAL,
      min_soc_reserve_pct: 30,
      has_solar: false,
      has_battery: false,
      has_ev: false,
    },
  });

  // Home 3: Col. V. K. Nair (RWA Admin - Tier 1 Lifeline / Common infrastructure)
  const homeNair = await prisma.home.create({
    data: {
      community_id: community.id,
      resident_name: "Col. V. K. Nair",
      mygate_flat_id: "C-201",
      emergency_tier: EmergencyTier.TIER_1_LIFELINE,
      min_soc_reserve_pct: 35,
      has_solar: false,
      has_battery: false,
      has_ev: false,
    },
  });

  console.log("Created Resident Homes (Rajesh, Dr. Meenakshi, Col. Nair).");

  // 4. Create Inverters & Meters (from DATABASE.md §2 Table 3)
  // Rajesh's Enphase Inverter
  await prisma.inverter.create({
    data: {
      home_id: homeRajesh.id,
      oem_provider: OemProvider.ENPHASE,
      serial_number: "EN-1049283-MEADOWS",
      nameplate_capacity_kw: 8.0000,
      max_export_kw: 6.0000,
      is_active: true,
      auth_credentials_enc: "dummy_aes_gcm_token_for_enphase_oauth",
    },
  });

  console.log("Created OEM Inverter credentials.");

  // 5. Seed Users (User profile matching the homes, RBAC role-based auth setup)
  await prisma.user.create({
    data: {
      email: "rajesh.sharma@palmmeadows.in",
      name: "Rajesh Sharma",
      role: UserRole.RESIDENT,
      home_id: homeRajesh.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "meenakshi.sundaram@palmmeadows.in",
      name: "Dr. Meenakshi Sundaram",
      role: UserRole.RESIDENT,
      home_id: homeMeenakshi.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "president.nair@palmmeadows.in",
      name: "Col. V. K. Nair",
      role: UserRole.RWA_ADMIN,
      home_id: homeNair.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "manager.patel@palmmeadows.in",
      name: "Amit Patel",
      role: UserRole.COMMUNITY_MANAGER,
      home_id: null,
    },
  });

  await prisma.user.create({
    data: {
      email: "ops.admin@cee-ai.com",
      name: "Ops Admin",
      role: UserRole.PLATFORM_ADMIN,
      home_id: null,
    },
  });

  console.log("Created user profiles linked to homes and non-resident admin accounts.");

  // 6. Seed Telemetry (Sample 24-hr data)
  const now = new Date();
  const telemetries = [];
  const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0); // Noon

  // Generate a few samples representing different scenarios
  // 12:00 PM: Solar peak, normal grid
  telemetries.push({
    time: new Date(baseTime.getTime()),
    home_id: homeRajesh.id,
    solar_gen_kw: 6.5000,
    battery_soc_pct: 85.00,
    battery_flow_kw: 1.5000, // Charging
    home_demand_kw: 2.0000,
    grid_import_kw: 0.0000,
    grid_export_kw: 3.0000, // Exporting
    grid_status: "NORMAL",
  });

  telemetries.push({
    time: new Date(baseTime.getTime()),
    home_id: homeMeenakshi.id,
    solar_gen_kw: 0.0000,
    battery_soc_pct: 0.00,
    battery_flow_kw: 0.0000,
    home_demand_kw: 1.2000,
    grid_import_kw: 1.2000,
    grid_export_kw: 0.0000,
    grid_status: "NORMAL",
  });

  // 2:15 PM: Outage begins (from USER_JOURNEY.md §2.1)
  const outageTime = new Date(baseTime.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000);
  telemetries.push({
    time: outageTime,
    home_id: homeRajesh.id,
    solar_gen_kw: 4.5000,
    battery_soc_pct: 78.50,
    battery_flow_kw: -1.2000, // Discharging to feed community
    home_demand_kw: 2.1000,
    grid_import_kw: 0.0000,
    grid_export_kw: 1.2000, // Exporting virtual backup power
    grid_status: "OUTAGE_DG_ACTIVE",
  });

  telemetries.push({
    time: outageTime,
    home_id: homeMeenakshi.id,
    solar_gen_kw: 0.0000,
    battery_soc_pct: 0.00,
    battery_flow_kw: 0.0000,
    home_demand_kw: 0.8000, // drawing backup power for medical oxygen
    grid_import_kw: 0.8000, // drawing from community
    grid_export_kw: 0.0000,
    grid_status: "OUTAGE_DG_ACTIVE",
  });

  for (const tele of telemetries) {
    await prisma.energyTelemetry.create({
      data: tele,
    });
  }

  console.log("Created sample energy telemetry.");

  // 7. Seed Ledger Transactions (from ENERGY_LEDGER.md §5 mock data)
  // Rajesh (villa 104): Given 180 kWh, Received 20 kWh -> Net +160
  await prisma.ledgerTransaction.create({
    data: {
      home_id: homeRajesh.id,
      interval_start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      interval_end: now,
      energy_given_kwh: 180.5000,
      energy_received_kwh: 20.0000,
      net_energy_balance_kwh: 160.5000,
      clearing_rate_inr: 9.5000,
      net_value_inr: 1372.28, // 160.50 * 8.55 (90% of clearing rate)
      audit_signature: "hmac_signature_rajesh_villa_104",
    },
  });

  // Dr. Meenakshi (apartment 402): Given 0, Received 40 -> Net -40
  await prisma.ledgerTransaction.create({
    data: {
      home_id: homeMeenakshi.id,
      interval_start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      interval_end: now,
      energy_given_kwh: 0.0000,
      energy_received_kwh: 40.0000,
      net_energy_balance_kwh: -40.0000,
      clearing_rate_inr: 9.5000,
      net_value_inr: -380.00, // -40.00 * 9.50 (clearing rate surcharge)
      audit_signature: "hmac_signature_meenakshi_apt_402",
    },
  });

  console.log("Created sample ledger transactions.");

  // 8. Seed Monthly Settlements (RWA export statement from ENERGY_LEDGER.md §5)
  await prisma.monthlySettlement.create({
    data: {
      community_id: community.id,
      home_id: homeRajesh.id,
      billing_year: now.getFullYear(),
      billing_month: now.getMonth() + 1,
      total_energy_given_kwh: 180.5000,
      total_energy_received_kwh: 20.0000,
      net_energy_balance_kwh: 160.5000,
      cam_bill_adjustment_inr: -1372.28, // Rebate
      dg_liters_saved_equivalent: 48.1500,
      status: SettlementStatus.DRAFT,
    },
  });

  await prisma.monthlySettlement.create({
    data: {
      community_id: community.id,
      home_id: homeMeenakshi.id,
      billing_year: now.getFullYear(),
      billing_month: now.getMonth() + 1,
      total_energy_given_kwh: 0.0000,
      total_energy_received_kwh: 40.0000,
      net_energy_balance_kwh: -40.0000,
      cam_bill_adjustment_inr: 380.00, // Surcharge
      dg_liters_saved_equivalent: 0.0000,
      status: SettlementStatus.DRAFT,
    },
  });

  console.log("Created sample monthly billing statements.");
  console.log("Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
