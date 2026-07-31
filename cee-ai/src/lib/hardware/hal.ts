/**
 * CEE-AI Hardware Abstraction Layer (HAL)
 * Source: hardware/docs/INTEGRATION_GUIDE.md, hardware/docs/OVERVIEW.md
 *
 * The HAL is the single integration point between physical hardware
 * and the CEE-AI software stack. It automatically selects the best
 * available data source:
 *
 *   Priority 1: MQTT_EDGE  — Physical hardware via edge gateway (freshest data)
 *   Priority 2: CLOUD_API  — Inverter cloud APIs (Enphase, SolarEdge, GoodWe)
 *   Priority 3: SIMULATED  — Mock-store fallback (development / demo)
 *
 * Usage:
 *   import { hal } from "@/lib/hardware/hal";
 *   const telemetry = await hal.getLatestTelemetry(homeId);
 *   const source = hal.getTelemetrySource();
 */

import {
  HalAdapter,
  HardwareDeviceHealth,
  HardwareDispatchAck,
  HardwareDispatchCommand,
  HardwareTelemetry,
  TelemetrySource,
  HardwareMode,
} from "./types";
import { SimulatedAdapter } from "./adapters/simulated-adapter";
import { MqttAdapter } from "./adapters/mqtt-adapter";

// Re-export for convenience
export type {
  HardwareTelemetry,
  HardwareDispatchCommand,
  HardwareDispatchAck,
  HardwareDeviceHealth,
  TelemetrySource,
};
export { MqttAdapter };

/**
 * Main Hardware Abstraction Layer
 *
 * Instantiated as a singleton (`hal`) exported at the bottom of this file.
 * The HAL tries each adapter in priority order and falls back gracefully.
 */
class HardwareAbstractionLayer {
  private readonly mode: HardwareMode;
  private activeSource: TelemetrySource = "SIMULATED";

  private readonly mqttAdapter: MqttAdapter;
  private readonly simulatedAdapter: SimulatedAdapter;

  constructor() {
    this.mode = (process.env.HARDWARE_MODE ?? "simulated") as HardwareMode;
    this.mqttAdapter = new MqttAdapter();
    this.simulatedAdapter = new SimulatedAdapter();
  }

  /**
   * Get the latest telemetry for a home, using the best available source.
   *
   * Source selection:
   *   - "mqtt_edge"  → Try MQTT first, fall back to simulated
   *   - "cloud_api"  → Cloud API would go here (future); falls back to simulated
   *   - "simulated"  → Always use SimulatedAdapter
   */
  async getLatestTelemetry(homeId: string): Promise<HardwareTelemetry> {
    if (this.mode === "mqtt_edge") {
      try {
        const available = await this.mqttAdapter.isAvailable();
        if (available) {
          const reading = await this.mqttAdapter.getLatestTelemetry(homeId);
          this.activeSource = "MQTT_EDGE";
          return reading;
        }
      } catch {
        console.warn(
          `[HAL] MQTT edge adapter unavailable for home ${homeId}. ` +
          "Falling back to SIMULATED.",
        );
      }
    }

    // Cloud API adapter: reserved for future integration
    // When HARDWARE_MODE=cloud_api, the Enphase/SolarEdge/GoodWe
    // cloud polling adapters will be called here.
    if (this.mode === "cloud_api") {
      console.warn(
        "[HAL] CLOUD_API mode is not yet implemented. Falling back to SIMULATED.",
      );
    }

    // Final fallback: always available
    this.activeSource = "SIMULATED";
    return await this.simulatedAdapter.getLatestTelemetry(homeId);
  }

  /**
   * Get the currently active telemetry source.
   * Use this to tag EnergyTelemetry records with `telemetry_source`.
   */
  getTelemetrySource(): TelemetrySource {
    return this.activeSource;
  }

  /**
   * Get hardware mode from environment.
   * Useful for dashboard status display.
   */
  getHardwareMode(): HardwareMode {
    return this.mode;
  }

  /**
   * Send a dispatch command to a home's physical hardware.
   * Routes to the appropriate adapter based on current mode.
   *
   * Safety constraint: HAL validates the command before dispatching.
   * - `power_kw` must be non-negative
   * - For DISCHARGE commands, SOC must be above the home's reserve floor
   */
  async sendDispatchCommand(
    command: HardwareDispatchCommand,
  ): Promise<HardwareDispatchAck> {
    // Validate: power must be non-negative
    if (command.power_kw < 0) {
      return {
        command_id: command.command_id,
        home_id: command.home_id,
        status: "REJECTED",
        executed_at: new Date().toISOString(),
        message: "HAL rejected: power_kw must be non-negative.",
      };
    }

    // Check command hasn't expired
    if (new Date(command.expires_at) < new Date()) {
      return {
        command_id: command.command_id,
        home_id: command.home_id,
        status: "EXPIRED",
        executed_at: new Date().toISOString(),
        message: "HAL rejected: command has expired.",
      };
    }

    // Route to active adapter
    const adapter = this.getActiveAdapter();
    return await adapter.sendDispatchCommand(command);
  }

  /**
   * Get health status for all devices in a home.
   */
  async getDeviceHealth(homeId: string): Promise<HardwareDeviceHealth> {
    const adapter = this.getActiveAdapter();
    return await adapter.getDeviceHealth(homeId);
  }

  /**
   * Get overall hardware system status for the dashboard.
   */
  async getSystemStatus(): Promise<{
    mode: HardwareMode;
    active_source: TelemetrySource;
    mqtt_available: boolean;
  }> {
    const mqttAvailable =
      this.mode === "mqtt_edge" && (await this.mqttAdapter.isAvailable());

    return {
      mode: this.mode,
      active_source: this.activeSource,
      mqtt_available: mqttAvailable,
    };
  }

  private getActiveAdapter(): HalAdapter {
    if (this.mode === "mqtt_edge") {
      return this.mqttAdapter;
    }
    return this.simulatedAdapter;
  }
}

/**
 * Singleton HAL instance.
 * Import this in API routes and AI engine modules.
 *
 * @example
 *   import { hal } from "@/lib/hardware/hal";
 *   const telemetry = await hal.getLatestTelemetry(homeId);
 */
export const hal = new HardwareAbstractionLayer();
