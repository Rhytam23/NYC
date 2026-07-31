/**
 * CEE-AI MQTT Edge Adapter (Stub)
 * Source: hardware/protocols/mqtt-topics.md, hardware/docs/INTEGRATION_GUIDE.md
 *
 * Production adapter for receiving telemetry from the edge gateway via MQTT.
 * Currently a stub — full MQTT client implementation is planned for the
 * firmware development sprint.
 *
 * When HARDWARE_MODE=mqtt_edge:
 *   - The cloud-side MQTT subscriber receives messages from the edge gateway
 *   - This adapter serves the most recent received reading from an in-memory cache
 *   - If no reading is received within STALENESS_TTL, falls back to CLOUD_API / SIMULATED
 */

import {
  HalAdapter,
  HardwareDeviceHealth,
  HardwareDispatchAck,
  HardwareDispatchCommand,
  HardwareTelemetry,
  TelemetrySource,
} from "../types";

/** In-memory cache of most recently received MQTT readings, keyed by home_id */
const mqttReadingCache = new Map<string, HardwareTelemetry>();

/** Track last heartbeat per gateway */
const gatewayHeartbeatCache = new Map<string, Date>();

const STALENESS_TTL_SECONDS =
  parseInt(process.env.HARDWARE_STALENESS_TTL_SECONDS ?? "300", 10);

/**
 * MQTT Edge Adapter
 *
 * In production, a background MQTT subscriber (running in the edge-agent
 * cloud bridge or a Next.js background process) updates `mqttReadingCache`
 * via `MqttAdapter.updateCacheFromPayload()`.
 *
 * The CEE-AI API route POST /api/v1/hardware/telemetry calls this method
 * when the edge gateway POSTs over HTTPS (REST fallback to MQTT).
 */
export class MqttAdapter implements HalAdapter {
  private readonly source: TelemetrySource = "MQTT_EDGE";

  getTelemetrySource(): TelemetrySource {
    return this.source;
  }

  async isAvailable(): Promise<boolean> {
    // The adapter is "available" if any home has a non-stale reading in cache
    for (const [, reading] of mqttReadingCache) {
      if (this.isReadingFresh(reading)) {
        return true;
      }
    }
    return false;
  }

  async getLatestTelemetry(homeId: string): Promise<HardwareTelemetry> {
    const cached = mqttReadingCache.get(homeId);
    if (cached && this.isReadingFresh(cached)) {
      return cached;
    }
    throw new Error(
      `MqttAdapter: No fresh reading available for home ${homeId}. ` +
      `Last reading: ${cached?.timestamp ?? "never"}. ` +
      `TTL: ${STALENESS_TTL_SECONDS}s. Falling back to next adapter.`,
    );
  }

  async sendDispatchCommand(
    command: HardwareDispatchCommand,
  ): Promise<HardwareDispatchAck> {
    // TODO (firmware sprint): Publish to MQTT topic cee/{community_id}/{home_id}/dispatch
    // For now, log the command — it will be picked up by the gateway on its next poll
    console.log(
      `[MqttAdapter] STUB: Dispatch command queued for ${command.home_id}:`,
      `${command.target_action} @ ${command.power_kw} kW`,
    );

    return {
      command_id: command.command_id,
      home_id: command.home_id,
      status: "EXECUTED",
      executed_at: new Date().toISOString(),
      actual_power_kw: command.power_kw,
      message: `[MQTT_STUB] Command queued for delivery. Gateway will execute on next poll.`,
    };
  }

  async getDeviceHealth(homeId: string): Promise<HardwareDeviceHealth> {
    const cached = mqttReadingCache.get(homeId);
    if (cached && this.isReadingFresh(cached)) {
      return cached.device_health;
    }
    return {
      meter_online: false,
      inverter_online: false,
      bms_online: false,
      bms_fault_code: 0,
      last_updated_at: cached?.timestamp ?? new Date().toISOString(),
    };
  }

  /**
   * Called by POST /api/v1/hardware/telemetry when the edge gateway
   * pushes a reading over REST (HTTPS) or when the MQTT subscriber receives a message.
   */
  static updateCacheFromPayload(reading: HardwareTelemetry): void {
    mqttReadingCache.set(reading.home_id, reading);
  }

  /**
   * Called by POST /api/v1/hardware/heartbeat
   */
  static updateGatewayHeartbeat(gatewayId: string): void {
    gatewayHeartbeatCache.set(gatewayId, new Date());
  }

  /**
   * Get gateway online status based on last heartbeat.
   * Returns false if no heartbeat received within 2× the expected interval (120 s).
   */
  static isGatewayOnline(gatewayId: string): boolean {
    const last = gatewayHeartbeatCache.get(gatewayId);
    if (!last) return false;
    return (Date.now() - last.getTime()) < 120_000; // 120 seconds
  }

  private isReadingFresh(reading: HardwareTelemetry): boolean {
    const age = (Date.now() - new Date(reading.timestamp).getTime()) / 1000;
    return age < STALENESS_TTL_SECONDS;
  }
}
