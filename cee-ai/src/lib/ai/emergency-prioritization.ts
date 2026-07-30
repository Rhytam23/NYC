import {
  EmergencyTier,
  GridStatus,
  TriageAction,
  TRIAGE_WEIGHTS,
} from "@/types";

/**
 * Emergency Prioritization Service
 * Source: AI_ENGINE.md §5, product_rules.md §4
 *
 * Enforces the deterministic safety override state machine
 * before any AI scheduling or power routing is dispatched.
 */
export function checkEmergencyOverride(
  homeTier: EmergencyTier,
  gridStatus: GridStatus,
  userReserveSoc: number,
): TriageAction {
  // If outage is active (Grid dropped or RWA runs on DG backup)
  if (gridStatus === "OUTAGE_DG_ACTIVE") {
    switch (homeTier) {
      case "TIER_0_MEDICAL":
        // Life critical: Never shed, enforce minimum 30% SOC reserve
        return {
          shed_load: false,
          minimum_soc_floor: Math.max(30, userReserveSoc), // Guardrail floor is 30%
          priority_weight: TRIAGE_WEIGHTS.TIER_0_MEDICAL,
        };

      case "TIER_1_LIFELINE":
        // Infrastructure critical: Do not shed, keep on
        return {
          shed_load: false,
          minimum_soc_floor: Math.max(35, userReserveSoc),
          priority_weight: TRIAGE_WEIGHTS.TIER_1_LIFELINE,
        };

      case "TIER_2_BASIC":
        // Basic domestic (lights, fans): Do not shed, standard SOC floor
        return {
          shed_load: false,
          minimum_soc_floor: userReserveSoc,
          priority_weight: TRIAGE_WEIGHTS.TIER_2_BASIC,
        };

      case "TIER_3_DEFERRABLE":
        // Deferrable (HVAC, EV Chargers): Shed load immediately to preserve community bus
        return {
          shed_load: true,
          minimum_soc_floor: 20, // Low floor since load is shed
          priority_weight: TRIAGE_WEIGHTS.TIER_3_DEFERRABLE,
        };
    }
  }

  // Normal grid status: Return default settings
  return {
    shed_load: false,
    minimum_soc_floor: userReserveSoc,
    priority_weight: 10,
  };
}
