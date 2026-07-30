import {
  DispatchInstruction,
  EmergencyTier,
  GridStatus,
  TRIAGE_WEIGHTS,
} from "@/types";

export interface HomeEnergyTelemetry {
  homeId: string;
  residentName: string;
  emergencyTier: EmergencyTier;
  solarGenKw: number;
  batterySocPct: number;
  batteryCapacityKwh: number;
  homeDemandKw: number;
  minSocReservePct: number;
}

/**
 * Energy Routing Engine (Convex Optimization Logic)
 * Source: AI_ENGINE.md §4, product_rules.md §4
 *
 * Implements the mathematical supplier-consumer matching solver.
 * Matches Net Supply Available (surplus homes) to Net Demand Required
 * (deficit homes) while enforcing grid priorities (T0 Medical > T1 > T2 > T3).
 */
export function calculateEnergyRouting(
  homes: HomeEnergyTelemetry[],
  gridStatus: GridStatus,
): DispatchInstruction[] {
  const instructions: DispatchInstruction[] = [];

  // 1. Separate homes into Surplus Providers and Deficit Consumers
  const providers = homes.filter((h) => {
    // A provider must have solar or battery, and their current SOC must exceed their reserve floor
    const hasBatteryReserve = h.batterySocPct > h.minSocReservePct;
    const currentSurplus = h.solarGenKw - h.homeDemandKw;
    return hasBatteryReserve || currentSurplus > 0;
  });

  const consumers = homes.filter((h) => {
    const deficit = h.homeDemandKw - h.solarGenKw;
    return deficit > 0;
  });

  // If there is no blackout, we execute standard economic clearing
  if (gridStatus === "NORMAL") {
    providers.forEach((prov) => {
      const surplusKw = Math.max(0, prov.solarGenKw - prov.homeDemandKw);
      if (surplusKw > 0) {
        instructions.push({
          home_id: prov.homeId,
          target_action: "CURTAIL", // Curtail or export to grid
          power_kw: surplusKw,
          reasoning_audit_string: `Normal grid clearing. Exporting surplus solar ${surplusKw.toFixed(2)} kW to DISCOM secondary line.`,
        });
      } else {
        instructions.push({
          home_id: prov.homeId,
          target_action: "IDLE",
          power_kw: 0,
          reasoning_audit_string:
            "Self-consumption balanced. Inverter is idle.",
        });
      }
    });

    return instructions;
  }

  // 2. Blackout / Emergency Triage active (Grid Status is OUTAGE_DG_ACTIVE)
  // Sort consumers by Triage Priority Weight (T0 Medical first)
  const sortedConsumers = [...consumers].sort(
    (a, b) => TRIAGE_WEIGHTS[b.emergencyTier] - TRIAGE_WEIGHTS[a.emergencyTier],
  );

  // Track remaining net backup capacities
  const availableProviderSurplus = providers.map((p) => {
    // Current export capacity is the battery capacity above reserve floor + current solar surplus
    const batteryCapacityAboveFloor = Math.max(
      0,
      ((p.batterySocPct - p.minSocReservePct) / 100) * p.batteryCapacityKwh,
    );
    const solarSurplus = Math.max(0, p.solarGenKw - p.homeDemandKw);
    return {
      homeId: p.homeId,
      residentName: p.residentName,
      availableKw: batteryCapacityAboveFloor + solarSurplus,
    };
  });

  // Route energy to critical consumers
  sortedConsumers.forEach((cons) => {
    let deficitKw = cons.homeDemandKw - cons.solarGenKw;
    let routedKw = 0;

    // Pull from providers in order of availability
    for (const prov of availableProviderSurplus) {
      if (deficitKw <= 0) break;
      if (prov.availableKw <= 0) continue;

      const transferKw = Math.min(deficitKw, prov.availableKw);
      prov.availableKw -= transferKw;
      deficitKw -= transferKw;
      routedKw += transferKw;

      // Add instruction for provider to discharge
      instructions.push({
        home_id: prov.homeId,
        target_action: "DISCHARGE",
        power_kw: transferKw,
        reasoning_audit_string: `Emergency routing: Dispatching ${transferKw.toFixed(2)} kW to feed consumer Flat ${cons.homeId} (${cons.residentName}).`,
      });
    }

    // Add instruction for consumer to import
    if (routedKw > 0) {
      instructions.push({
        home_id: cons.homeId,
        target_action: "CHARGE",
        power_kw: routedKw,
        reasoning_audit_string: `Importing ${routedKw.toFixed(2)} kW from community VPP battery reserve. Triage Priority: ${cons.emergencyTier}.`,
      });
    }
  });

  return instructions;
}
