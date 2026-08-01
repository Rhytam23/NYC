import { GridStatus, DispatchInstruction } from "@/types";
import { evaluateForceCharge, WeatherTelemetry } from "./weather-intelligence";
import { calculateEnergyRouting, HomeEnergyTelemetry } from "./energy-routing";
import { checkEmergencyOverride } from "./emergency-prioritization";

/**
 * Decision Engine Service (Master Orchestrator)
 * Source: AI_ENGINE.md §1, prompts.md §2, hardware/docs/INTEGRATION_GUIDE.md
 *
 * Coordinates weather intelligence, triage priority overrides,
 * and supplier-consumer energy routing into a unified dispatch schedule.
 *
 * Hardware Integration:
 * When hardware is online (MQTT_EDGE), `DecisionContext.homes` is populated
 * by the HAL with real-time readings. The optional `gridVoltageSag` field
 * on each home's telemetry is sourced from the smart meter's voltage register
 * (hardware/protocols/modbus-registers.md §1 Input Registers), providing a
 * higher-fidelity P(Outage) signal than the cloud API fallback.
 */

export interface DecisionContext {
  homes: HomeEnergyTelemetry[];
  gridStatus: GridStatus;
  weather: WeatherTelemetry;
  /** Active hardware source — from hal.getTelemetrySource() */
  hardwareSource?: "MQTT_EDGE" | "CLOUD_API" | "SIMULATED";
  /**
   * Grid voltage in volts from physical smart meter (optional).
   * When provided (hardware online), overrides the weather-intelligence
   * voltage sag parameter for higher accuracy P(Outage) calculation.
   * Source: hardware/protocols/modbus-registers.md §1 register 0x000A
   */
  gridVoltageV?: number;
}

export interface DecisionOutput {
  instructions: DispatchInstruction[];
  weatherAlertActive: boolean;
  outageProbability: number;
  reason: string;
  /** Active telemetry source — for audit trail tagging */
  hardwareSource: "MQTT_EDGE" | "CLOUD_API" | "SIMULATED";
}

export function runDecisionEngine(context: DecisionContext): DecisionOutput {
  const { homes, gridStatus, weather, hardwareSource, gridVoltageV } = context;

  // 1. Build the effective WeatherTelemetry.
  //    When hardware is online (MQTT_EDGE), use the measured grid voltage from
  //    the smart meter (hardware/protocols/modbus-registers.md register 0x000A)
  //    for a more accurate P(Outage) estimate.
  const effectiveWeather: WeatherTelemetry = {
    ...weather,
    ...(gridVoltageV !== undefined ? { gridVoltageSag: gridVoltageV } : {}),
  };

  // 2. Run Weather Intelligence P(Outage) check
  const weatherEval = evaluateForceCharge(effectiveWeather);

  // 3. Apply deterministic triage overrides to SOC floors
  const adjustedHomes = homes.map((h) => {
    const triage = checkEmergencyOverride(
      h.emergencyTier,
      gridStatus,
      h.minSocReservePct,
    );
    return {
      ...h,
      minSocReservePct: triage.minimum_soc_floor,
      // If shedded, home load is throttled to base critical appliances
      homeDemandKw: triage.shed_load
        ? Math.min(0.5, h.homeDemandKw)
        : h.homeDemandKw,
    };
  });

  // 4. If Force Charge is active, override standard routing and charge all batteries to 100%
  if (weatherEval.shouldForceCharge) {
    const instructions = adjustedHomes
      .filter((h) => h.batterySocPct < 100)
      .map((h) => ({
        home_id: h.homeId,
        target_action: "CHARGE" as const,
        power_kw: 3.5, // Standard charge speed
        reasoning_audit_string: `Storm preparation Alert! Force charging battery to 100% SOC. Outage risk: ${(weatherEval.outageProbability * 100).toFixed(0)}%. Data source: ${hardwareSource ?? "SIMULATED"}.`,
      }));

    return {
      instructions,
      weatherAlertActive: true,
      outageProbability: weatherEval.outageProbability,
      reason: weatherEval.reason,
      hardwareSource: hardwareSource ?? "SIMULATED",
    };
  }

  // 5. Otherwise, calculate optimal virtual energy routing paths
  const routingInstructions = calculateEnergyRouting(adjustedHomes, gridStatus);

  return {
    instructions: routingInstructions,
    weatherAlertActive: weatherEval.shouldForceCharge,
    outageProbability: weatherEval.outageProbability,
    reason: weatherEval.reason,
    hardwareSource: hardwareSource ?? "SIMULATED",
  };
}

/**
 * Gemini-powered Recommendation Engine (Structured prompts helper)
 * Uses Google Gemini SDK to compile natural text suggestions for residents.
 */
export async function generateGeminiRecommendations(
  residentName: string,
  soc: number,
  solarGen: number,
  demand: number,
  gridStatus: GridStatus,
): Promise<string[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === "your_gemini_api_key") {
    // Return standard structured recommendations if API key is missing
    return [
      `Your battery is at ${soc}% State of Charge. Reserve floor set to 35%.`,
      solarGen > demand
        ? `Surplus clean solar output detected. Exporting ${(solarGen - demand).toFixed(2)} kW to neighbor CPAP medical load.`
        : `Home demand is balanced with battery backup.`,
      gridStatus === "NORMAL"
        ? "Monsoon storm season active. Keep battery reserves above 35% in case of unexpected transformer drops."
        : "Grid outage active. Shed HVAC and EV chargers immediately to preserve community runtime.",
    ];
  }

  // If Gemini API Key is configured, make real API call
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const ai = new GoogleGenerativeAI(geminiKey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are the CEE-AI Core Recommendation Engine. Formulate 3 short, actionable, bulleted recommendations (max 12 words per bullet) for a resident homeowner based on these metrics:
      - Resident name: ${residentName}
      - Current Battery SOC: ${soc}%
      - Current Solar Generation: ${solarGen} kW
      - Current Home Demand: ${demand} kW
      - Grid status: ${gridStatus}
      
      Ensure terms like "CEE Credits", "VPP", "SOC Reserve" are used naturally. Return recommendations as a JSON array of strings.
    `;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleanText) as string[];
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "Gemini recommendation error, using default fallback suggestions.",
      );
    }
    return [
      `Your battery is at ${soc}% State of Charge. Reserve floor set to 35%.`,
      solarGen > demand
        ? `Surplus clean solar output detected. Exporting ${(solarGen - demand).toFixed(2)} kW to neighbor CPAP medical load.`
        : `Home demand is balanced with battery backup.`,
    ];
  }
}
