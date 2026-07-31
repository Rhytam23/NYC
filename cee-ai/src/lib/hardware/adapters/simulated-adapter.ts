/**
 * CEE-AI Simulated Hardware Adapter
 * Source: hardware/simulations/README.md, hardware/docs/INTEGRATION_GUIDE.md
 *
 * Provides realistic simulated hardware telemetry for development and demo
 * environments. Wraps mock-store.ts with physical plausibility behavior:
 *   - Gaussian noise on readings (±2%)
 *   - SOC drift over time (battery self-discharge model)
 *   - Grid voltage variation
 *   - Outage simulation support via runtimeState
 */

import {
  HalAdapter,
  HardwareDeviceHealth,
  HardwareDispatchAck,
  HardwareDispatchCommand,
  HardwareTelemetry,
  TelemetrySource,
} from "../types";
import { runtimeState } from "@/lib/mock-store";
import { GridStatus } from "@/types";

/** Gaussian noise: adds realistic measurement uncertainty to simulated readings */
function addNoise(value: number, noisePct = 0.02): number {
  const noise = value * noisePct * (Math.random() * 2 - 1);
  return Math.max(0, value + noise);
}

/** Compute a sinusoidal solar generation profile based on current hour (0–23) */
function getSolarCurveKw(nameplateKw: number, hour: number): number {
  if (hour < 6 || hour > 20) return 0;
  const angle = ((hour - 6) / 14) * Math.PI;
  return nameplateKw * Math.sin(angle) * 0.85; // 85% derating for losses
}

/**
 * Simulated Hardware Adapter
 * Implements HalAdapter using mock-store data with realistic noise and behavior.
 */
export class SimulatedAdapter implements HalAdapter {
  private readonly source: TelemetrySource = "SIMULATED";

  getTelemetrySource(): TelemetrySource {
    return this.source;
  }

  async isAvailable(): Promise<boolean> {
    // Simulated adapter is always available
    return true;
  }

  async getLatestTelemetry(homeId: string): Promise<HardwareTelemetry> {
    const rawTelemetry =
      runtimeState.telemetry[homeId as keyof typeof runtimeState.telemetry];

    if (!rawTelemetry) {
      // Return zeroed telemetry for unknown homes
      return this.buildZeroedTelemetry(homeId);
    }

    const now = new Date();
    const hour = now.getHours();

    // Apply solar curve to make generation time-realistic
    const solarGen = addNoise(getSolarCurveKw(rawTelemetry.solar_gen_kw, hour));
    const batteryFlow = rawTelemetry.battery_flow_kw;
    const homeDemand = addNoise(rawTelemetry.home_demand_kw);

    // Simulate grid voltage: normally ~230V with ±5V variation
    // Under OUTAGE_DG_ACTIVE: simulate voltage sag to 195V
    const gridVoltage =
      runtimeState.gridStatus === "OUTAGE_DG_ACTIVE"
        ? 195 + (Math.random() * 10 - 5)
        : 230 + (Math.random() * 10 - 5);

    const gridStatus = runtimeState.gridStatus as GridStatus;

    return {
      home_id: homeId,
      timestamp: now.toISOString(),
      telemetry_source: this.source,
      solar_gen_kw: parseFloat(solarGen.toFixed(4)),
      battery_soc_pct: parseFloat(addNoise(rawTelemetry.battery_soc_pct, 0.005).toFixed(2)),
      battery_flow_kw: parseFloat(batteryFlow.toFixed(4)),
      home_demand_kw: parseFloat(homeDemand.toFixed(4)),
      grid_import_kw: parseFloat(addNoise(rawTelemetry.grid_import_kw).toFixed(4)),
      grid_export_kw: parseFloat(addNoise(rawTelemetry.grid_export_kw).toFixed(4)),
      grid_voltage_v: parseFloat(gridVoltage.toFixed(1)),
      power_factor: 0.95 + (Math.random() * 0.04 - 0.02),
      grid_status: gridStatus,
      device_health: {
        meter_online: true,
        inverter_online: true,
        bms_online: rawTelemetry.battery_soc_pct > 0,
        bms_fault_code: 0,
        temperature_c: 35 + Math.random() * 5,
        last_updated_at: now.toISOString(),
      },
    };
  }

  async sendDispatchCommand(
    command: HardwareDispatchCommand,
  ): Promise<HardwareDispatchAck> {
    // In simulation mode: log the command and return a success ACK
    console.log(
      `[SimulatedAdapter] Dispatch command to ${command.home_id}:`,
      `${command.target_action} @ ${command.power_kw} kW —`,
      command.reasoning_audit_string,
    );

    return {
      command_id: command.command_id,
      home_id: command.home_id,
      status: "EXECUTED",
      executed_at: new Date().toISOString(),
      actual_power_kw: command.power_kw,
      message: `[SIMULATED] Command ${command.target_action} acknowledged. No physical hardware present.`,
    };
  }

  async getDeviceHealth(homeId: string): Promise<HardwareDeviceHealth> {
    const raw =
      runtimeState.telemetry[homeId as keyof typeof runtimeState.telemetry];
    return {
      meter_online: Boolean(raw),
      inverter_online: Boolean(raw && raw.solar_gen_kw >= 0),
      bms_online: Boolean(raw && raw.battery_soc_pct > 0),
      bms_fault_code: 0,
      temperature_c: 36,
      last_updated_at: new Date().toISOString(),
    };
  }

  private buildZeroedTelemetry(homeId: string): HardwareTelemetry {
    return {
      home_id: homeId,
      timestamp: new Date().toISOString(),
      telemetry_source: this.source,
      solar_gen_kw: 0,
      battery_soc_pct: 0,
      battery_flow_kw: 0,
      home_demand_kw: 0,
      grid_import_kw: 0,
      grid_export_kw: 0,
      grid_voltage_v: 230,
      power_factor: 1.0,
      grid_status: runtimeState.gridStatus as GridStatus,
      device_health: {
        meter_online: false,
        inverter_online: false,
        bms_online: false,
        bms_fault_code: 0,
        last_updated_at: new Date().toISOString(),
      },
    };
  }
}
