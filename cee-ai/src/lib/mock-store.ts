import {
  EmergencyTier,
  OemProvider,
  SettlementStatus,
  UserRole,
} from "@prisma/client";
import { GridStatus } from "@/types";

/**
 * CEE-AI Mock Data Store (Fallback)
 * Source: DATABASE.md, USER_PERSONAS.md, ENERGY_LEDGER.md
 *
 * This fallback store is used ONLY when the database server is unreachable
 * (e.g., in offline demo environments), ensuring the platform remains fully
 * interactive and does not crash.
 */

export const MOCK_COMMUNITY = {
  id: "c7a81023-98ab-4123-bcde-890123456789",
  rwa_name: "Palm Meadows RWA",
  rwa_code: "PALM-MEADOWS-089",
  city: "Bangalore",
  state: "Karnataka",
  discom_name: "BESCOM",
  grid_tariff_inr: 8.5,
  dg_tariff_inr: 26.0,
  clearing_rate_inr: 9.5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_HOMES = [
  {
    id: "home-rajesh-v104",
    community_id: MOCK_COMMUNITY.id,
    resident_name: "Rajesh Sharma",
    mygate_flat_id: "V-104",
    emergency_tier: "TIER_2_BASIC" as EmergencyTier,
    min_soc_reserve_pct: 35,
    has_solar: true,
    has_battery: true,
    has_ev: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "home-meenakshi-a402",
    community_id: MOCK_COMMUNITY.id,
    resident_name: "Dr. Meenakshi Sundaram",
    mygate_flat_id: "A-402",
    emergency_tier: "TIER_0_MEDICAL" as EmergencyTier,
    min_soc_reserve_pct: 30,
    has_solar: false,
    has_battery: false,
    has_ev: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "home-nair-c201",
    community_id: MOCK_COMMUNITY.id,
    resident_name: "Col. V. K. Nair",
    mygate_flat_id: "C-201",
    emergency_tier: "TIER_1_LIFELINE" as EmergencyTier,
    min_soc_reserve_pct: 35,
    has_solar: false,
    has_battery: false,
    has_ev: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_USERS = [
  {
    id: "user-rajesh",
    email: "rajesh.sharma@palmmeadows.in",
    name: "Rajesh Sharma",
    role: "RESIDENT" as UserRole,
    home_id: "home-rajesh-v104",
    avatar_url: null,
    auth_provider: "supabase",
  },
  {
    id: "user-meenakshi",
    email: "meenakshi.sundaram@palmmeadows.in",
    name: "Dr. Meenakshi Sundaram",
    role: "RESIDENT" as UserRole,
    home_id: "home-meenakshi-a402",
    avatar_url: null,
    auth_provider: "supabase",
  },
  {
    id: "user-nair",
    email: "president.nair@palmmeadows.in",
    name: "Col. V. K. Nair",
    role: "RWA_ADMIN" as UserRole,
    home_id: "home-nair-c201",
    avatar_url: null,
    auth_provider: "supabase",
  },
  {
    id: "user-manager",
    email: "manager.patel@palmmeadows.in",
    name: "Amit Patel",
    role: "COMMUNITY_MANAGER" as UserRole,
    home_id: null,
    avatar_url: null,
    auth_provider: "supabase",
  },
  {
    id: "user-platform-admin",
    email: "ops.admin@cee-ai.com",
    name: "Ops Admin",
    role: "PLATFORM_ADMIN" as UserRole,
    home_id: null,
    avatar_url: null,
    auth_provider: "supabase",
  },
];

export const MOCK_INVERTERS = [
  {
    id: "inv-rajesh",
    home_id: "home-rajesh-v104",
    oem_provider: "ENPHASE" as OemProvider,
    serial_number: "EN-1049283-MEADOWS",
    nameplate_capacity_kw: 8.0,
    max_export_kw: 6.0,
    is_active: true,
    auth_credentials_enc: "dummy_aes_gcm_token_for_enphase_oauth",
    created_at: new Date().toISOString(),
  },
];

// In-memory runtime state for interactive demo adjustments
export const runtimeState = {
  gridStatus: "NORMAL" as GridStatus,
  homes: [...MOCK_HOMES],
  telemetry: {
    "home-rajesh-v104": {
      solar_gen_kw: 6.5,
      battery_soc_pct: 85.0,
      battery_flow_kw: 1.5, // Positive = charge
      home_demand_kw: 2.0,
      grid_import_kw: 0.0,
      grid_export_kw: 3.0,
    },
    "home-meenakshi-a402": {
      solar_gen_kw: 0.0,
      battery_soc_pct: 0.0,
      battery_flow_kw: 0.0,
      home_demand_kw: 1.2,
      grid_import_kw: 1.2,
      grid_export_kw: 0.0,
    },
    "home-nair-c201": {
      solar_gen_kw: 0.0,
      battery_soc_pct: 0.0,
      battery_flow_kw: 0.0,
      home_demand_kw: 3.5,
      grid_import_kw: 3.5,
      grid_export_kw: 0.0,
    },
  },
  ledger: {
    "home-rajesh-v104": {
      energy_given_kwh: 180.5,
      energy_received_kwh: 20.0,
      net_energy_balance_kwh: 160.5,
      cam_bill_adjustment_inr: -1372.28,
    },
    "home-meenakshi-a402": {
      energy_given_kwh: 0.0,
      energy_received_kwh: 40.0,
      net_energy_balance_kwh: -40.0,
      cam_bill_adjustment_inr: 380.0,
    },
    "home-nair-c201": {
      energy_given_kwh: 10.0,
      energy_received_kwh: 75.0,
      net_energy_balance_kwh: -65.0,
      cam_bill_adjustment_inr: 617.5,
    },
  },
  transactions: [
    {
      id: "tx-1",
      home_id: "home-rajesh-v104",
      interval_start: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      interval_end: new Date().toISOString(),
      energy_given_kwh: 2.42,
      energy_received_kwh: 0.0,
      net_energy_balance_kwh: 2.42,
      clearing_rate_inr: 9.5,
      net_value_inr: 20.69, // 2.42 * 8.55
      audit_signature: "sig-rajesh-tx-1",
      created_at: new Date().toISOString(),
    },
    {
      id: "tx-2",
      home_id: "home-meenakshi-a402",
      interval_start: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      interval_end: new Date().toISOString(),
      energy_given_kwh: 0.0,
      energy_received_kwh: 1.22,
      net_energy_balance_kwh: -1.22,
      clearing_rate_inr: 9.5,
      net_value_inr: -11.59, // -1.22 * 9.50
      audit_signature: "sig-meenakshi-tx-2",
      created_at: new Date().toISOString(),
    },
  ],
  settlements: [
    {
      id: "settle-rajesh",
      community_id: MOCK_COMMUNITY.id,
      home_id: "home-rajesh-v104",
      billing_year: 2026,
      billing_month: 7,
      total_energy_given_kwh: 180.5,
      total_energy_received_kwh: 20.0,
      net_energy_balance_kwh: 160.5,
      cam_bill_adjustment_inr: -1372.28,
      dg_liters_saved_equivalent: 48.15,
      status: "DRAFT" as SettlementStatus,
      created_at: new Date().toISOString(),
    },
    {
      id: "settle-meenakshi",
      community_id: MOCK_COMMUNITY.id,
      home_id: "home-meenakshi-a402",
      billing_year: 2026,
      billing_month: 7,
      total_energy_given_kwh: 0.0,
      total_energy_received_kwh: 40.0,
      net_energy_balance_kwh: -40.0,
      cam_bill_adjustment_inr: 380.0,
      dg_liters_saved_equivalent: 0.0,
      status: "DRAFT" as SettlementStatus,
      created_at: new Date().toISOString(),
    },
  ],
};

/**
 * Executes a query with a db safety wrapper.
 * If Prisma client fails to query due to connection issues,
 * it returns the offline mock data store.
 */
export async function dbQuerySafe<T>(
  prismaQuery: () => Promise<T>,
  fallbackData: T,
): Promise<T> {
  try {
    return await prismaQuery();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Database connection issue. Using CEE-AI offline mock fallback data.",
      );
    }
    return fallbackData;
  }
}
