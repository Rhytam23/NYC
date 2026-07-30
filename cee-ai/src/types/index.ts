/**
 * CEE-AI Core Type Definitions
 * Source: docs/DATABASE.md, docs/API_SPEC.md, docs/AI_ENGINE.md
 *
 * All energy quantities use number (rendered as Decimal in Prisma/DB).
 * Per coding_rules.md §2.1: DECIMAL(10,4) in database, never IEEE 754 for ledger balances.
 * Frontend display uses formatEnergy() for safe rendering.
 */

/* =============================================================================
   Enums — from DATABASE.md
   ============================================================================= */

export type EmergencyTier =
  "TIER_0_MEDICAL" | "TIER_1_LIFELINE" | "TIER_2_BASIC" | "TIER_3_DEFERRABLE";

export type OemProvider =
  "ENPHASE" | "GOODWE" | "SOLAREDGE" | "SUNGROW" | "GENUS_METER" | "LNT_METER";

export type GridStatus = "NORMAL" | "OUTAGE_DG_ACTIVE" | "CYCLONE_ALERT";

export type SettlementStatus = "DRAFT" | "CLOSED_EXPORTED" | "DISPUTED";

export type UserRole =
  "RESIDENT" | "RWA_ADMIN" | "COMMUNITY_MANAGER" | "PLATFORM_ADMIN";

/* =============================================================================
   Database Models — from DATABASE.md §2
   ============================================================================= */

export interface Community {
  id: string;
  rwa_name: string;
  rwa_code: string;
  city: string;
  state: string;
  discom_name: string;
  grid_tariff_inr: number;
  dg_tariff_inr: number;
  clearing_rate_inr: number;
  created_at: string;
  updated_at: string;
}

export interface Home {
  id: string;
  community_id: string;
  resident_name: string;
  mygate_flat_id: string;
  emergency_tier: EmergencyTier;
  min_soc_reserve_pct: number;
  has_solar: boolean;
  has_battery: boolean;
  has_ev: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inverter {
  id: string;
  home_id: string;
  oem_provider: OemProvider;
  serial_number: string;
  nameplate_capacity_kw: number;
  max_export_kw: number;
  is_active: boolean;
  created_at: string;
}

export interface EnergyTelemetry {
  time: string;
  home_id: string;
  solar_gen_kw: number;
  battery_soc_pct: number;
  battery_flow_kw: number;
  home_demand_kw: number;
  grid_import_kw: number;
  grid_export_kw: number;
  grid_status: GridStatus;
}

export interface LedgerTransaction {
  id: string;
  home_id: string;
  interval_start: string;
  interval_end: string;
  energy_given_kwh: number;
  energy_received_kwh: number;
  net_energy_balance_kwh: number;
  clearing_rate_inr: number;
  net_value_inr: number;
  audit_signature: string;
  created_at: string;
}

export interface MonthlySettlement {
  id: string;
  community_id: string;
  home_id: string;
  billing_year: number;
  billing_month: number;
  total_energy_given_kwh: number;
  total_energy_received_kwh: number;
  net_energy_balance_kwh: number;
  cam_bill_adjustment_inr: number;
  dg_liters_saved_equivalent: number;
  status: SettlementStatus;
  created_at: string;
}

/* =============================================================================
   API Response Types — from API_SPEC.md §2
   ============================================================================= */

/** Standardized API response envelope — from api_rules.md §1 */
export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    request_id: string;
  };
}

/** GET /api/v1/telemetry/home/{home_id} — from API_SPEC.md §2.2 */
export interface HomeDashboardData {
  home_id: string;
  resident_name: string;
  emergency_tier: EmergencyTier;
  current_flows: {
    solar_gen_kw: number;
    battery_soc_pct: number;
    home_demand_kw: number;
    net_export_kw: number;
  };
  ledger_summary_month_to_date: {
    energy_given_kwh: number;
    energy_received_kwh: number;
    net_energy_balance_kwh: number;
    projected_cam_rebate_inr: number;
  };
}

/** GET /api/v1/telemetry/community/{community_id} — from API_SPEC.md §2.3 */
export interface CommunityDashboardData {
  community_id: string;
  rwa_name: string;
  grid_status: GridStatus;
  community_vpp_stats: {
    total_active_homes: number;
    total_solar_gen_kw: number;
    total_battery_storage_kwh: number;
    aggregate_soc_pct: number;
    total_community_demand_kw: number;
    dg_liters_avoided_today: number;
    autonomous_survival_hours_remaining: number;
  };
  emergency_triage_summary: {
    tier_0_medical_homes_active: number;
    tier_1_lifeline_homes_active: number;
    tier_3_shed_loads_count: number;
  };
}

/** GET /api/v1/ledger/balance/{home_id} */
export interface LedgerBalance {
  home_id: string;
  energy_given_kwh: number;
  energy_received_kwh: number;
  net_energy_balance_kwh: number;
  cam_bill_adjustment_inr: number;
}

/* =============================================================================
   AI Engine Types — from AI_ENGINE.md §5 and prompts.md §2
   ============================================================================= */

export type DispatchAction = "CHARGE" | "DISCHARGE" | "IDLE" | "CURTAIL";

/** AI dispatch instruction — from prompts.md §2 output format */
export interface DispatchInstruction {
  home_id: string;
  target_action: DispatchAction;
  power_kw: number;
  reasoning_audit_string: string;
}

/** Emergency triage action — from AI_ENGINE.md §5 */
export interface TriageAction {
  shed_load: boolean;
  minimum_soc_floor: number;
  priority_weight: number;
}

/** Triage priority weights — from AI_ENGINE.md §4.1 */
export const TRIAGE_WEIGHTS: Record<EmergencyTier, number> = {
  TIER_0_MEDICAL: 1000,
  TIER_1_LIFELINE: 100,
  TIER_2_BASIC: 10,
  TIER_3_DEFERRABLE: 1,
};

/** Minimum SOC floors — from AI_ENGINE.md §4.2 */
export const SOC_FLOORS: Record<EmergencyTier, number> = {
  TIER_0_MEDICAL: 0.5,
  TIER_1_LIFELINE: 0.35,
  TIER_2_BASIC: 0.35,
  TIER_3_DEFERRABLE: 0.2,
};

/* =============================================================================
   UI Component Props — from ui_rules.md
   ============================================================================= */

/** Energy tier visual configuration */
export const TIER_CONFIG: Record<
  EmergencyTier,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  TIER_0_MEDICAL: {
    label: "Life Critical",
    color: "text-energy-critical",
    bgColor: "bg-red-50 dark:bg-red-950",
    icon: "Heart",
  },
  TIER_1_LIFELINE: {
    label: "Community Lifeline",
    color: "text-energy-warning",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    icon: "Building",
  },
  TIER_2_BASIC: {
    label: "Basic Domestic",
    color: "text-energy-battery",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    icon: "Home",
  },
  TIER_3_DEFERRABLE: {
    label: "Deferrable",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: "Clock",
  },
};
