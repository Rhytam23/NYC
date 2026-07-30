/**
 * Weather Intelligence Service
 * Source: AI_ENGINE.md §3, prompts.md §2
 *
 * Monitors meteorological feeds and alerts. Calculates outage probability
 * and triggers proactive FORCE_CHARGE overrides for community batteries.
 */
export interface WeatherTelemetry {
  alertLevel: "NONE" | "YELLOW" | "ORANGE" | "RED";
  gridVoltageSag: number; // in volts (e.g. 230 normal, <200 sag)
  transformerMtbfHours: number; // historical reliability parameter
}

export function calculateOutageProbability(
  telemetry: WeatherTelemetry,
): number {
  let score = 0.05; // Base probability

  // Map IMD Alert Level to hazard weights
  switch (telemetry.alertLevel) {
    case "YELLOW":
      score += 0.15;
      break;
    case "ORANGE":
      score += 0.35;
      break;
    case "RED":
      score += 0.65; // Severe alert (cyclone/monsoon storm)
      break;
  }

  // Factor in real-time grid electrical sags
  if (telemetry.gridVoltageSag < 180) {
    score += 0.3;
  } else if (telemetry.gridVoltageSag < 210) {
    score += 0.1;
  }

  // Factor in equipment health parameter
  if (telemetry.transformerMtbfHours < 100) {
    score += 0.1;
  }

  // Cap at 0.99
  return Math.min(0.99, score);
}

/**
 * Evaluates whether storm alert requires pre-charging batteries to 100% SOC.
 * Per AI_ENGINE.md §3: When P(Outage) > 0.65, trigger FORCE_CHARGE.
 */
export function evaluateForceCharge(telemetry: WeatherTelemetry): {
  shouldForceCharge: boolean;
  outageProbability: number;
  reason: string;
} {
  const prob = calculateOutageProbability(telemetry);
  const shouldForceCharge = prob > 0.65;

  let reason =
    "Weather conditions normal. Economic solar self-consumption active.";
  if (shouldForceCharge) {
    reason = `High outage risk (${(prob * 100).toFixed(0)}%) due to IMD ${telemetry.alertLevel} Alert and electrical line sag. Overriding self-consumption to bring community batteries to 100% SOC.`;
  }

  return {
    shouldForceCharge,
    outageProbability: prob,
    reason,
  };
}
