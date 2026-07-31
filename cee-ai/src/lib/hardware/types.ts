/**
 * CEE-AI Hardware Layer Types
 * Source: hardware/docs/COMPONENTS.md, hardware/protocols/
 *
 * Defines TypeScript interfaces and enums for all physical hardware
 * components. These types are consumed by the HAL and decision engine.
 */

/* =============================================================================
   Hardware Device Types
   ============================================================================= */

export type HardwareDeviceType =
  | "EDGE_GATEWAY"
  | "SMART_METER"
  | "SOLAR_INVERTER"
  | "BATTERY_BMS"
  | "EV_CHARGER"
  | "TEMPERATURE_SENSOR";

export type HardwareDeviceStatus =
  | "ONLINE"
  | "OFFLINE"
  | "STALE"
  | "FAULT"
  | "PROVISIONING"
  | "SIMULATED";

/** Source of a telemetry reading — tagged on every EnergyTelemetry record */
export type TelemetrySource =
  | "MQTT_EDGE"   // Physical hardware via edge gateway
  | "CLOUD_API"   // Inverter cloud API (Enphase, SolarEdge, GoodWe)
  | "SIMULATED"   // Mock-store fallback (development / demo)
  | "MANUAL";     // RWA admin manual override

/** Active hardware mode from environment config */
export type HardwareMode = "simulated" | "mqtt_edge" | "cloud_api";

/* =============================================================================
   Telemetry Payloads
   ============================================================================= */

/**
 * Normalized hardware telemetry reading — output of HAL adapter.
 * All adapters must produce this shape.
 */
export interface HardwareTelemetry {
  home_id: string;
  timestamp: string;             // ISO 8601
  telemetry_source: TelemetrySource;
  hardware_device_id?: string;   // FK to HardwareDevice (if tracked)

  // Energy flows (kW)
  solar_gen_kw: number;
  battery_soc_pct: number;       // 0–100
  battery_flow_kw: number;       // + = charging, − = discharging
  home_demand_kw: number;
  grid_import_kw: number;
  grid_export_kw: number;

  // Grid quality (from smart meter)
  grid_voltage_v?: number;       // Used by weather-intelligence for sag detection
  power_factor?: number;         // 0.0–1.0

  // Grid state
  grid_status: "NORMAL" | "OUTAGE_DG_ACTIVE" | "CYCLONE_ALERT";

  // Device health flags
  device_health: HardwareDeviceHealth;
}

/**
 * Health status for all devices in a home — included in every telemetry payload.
 */
export interface HardwareDeviceHealth {
  meter_online: boolean;
  inverter_online: boolean;
  bms_online: boolean;
  bms_fault_code: number;        // 0 = OK; non-zero = fault (see BMS register map)
  temperature_c?: number;        // Gateway enclosure temperature
  last_updated_at: string;       // ISO 8601
}

/* =============================================================================
   Dispatch Commands
   ============================================================================= */

/**
 * Dispatch command from CEE-AI AI engine → HAL → Edge gateway → Physical device
 */
export interface HardwareDispatchCommand {
  command_id: string;
  home_id: string;
  issued_at: string;             // ISO 8601
  expires_at: string;            // ISO 8601 — command must be executed before this
  target_action: "CHARGE" | "DISCHARGE" | "IDLE" | "CURTAIL";
  power_kw: number;
  reasoning_audit_string: string;
}

/**
 * Acknowledgment from edge gateway after executing a dispatch command
 */
export interface HardwareDispatchAck {
  command_id: string;
  home_id: string;
  status: "EXECUTED" | "FAILED" | "EXPIRED" | "REJECTED";
  executed_at: string;
  actual_power_kw?: number;
  message: string;
}

/* =============================================================================
   Hardware Devices Registry
   ============================================================================= */

/**
 * Represents a registered physical device in the community.
 * Stored in the HardwareDevice DB table.
 */
export interface HardwareDevice {
  id: string;
  device_type: HardwareDeviceType;
  label: string;
  home_id?: string;              // null for gateways (community-level)
  gateway_id: string;
  community_id: string;
  modbus_address?: number;       // 1–247; null for non-Modbus devices
  status: HardwareDeviceStatus;
  firmware_version?: string;
  last_seen_at?: string;
  created_at: string;
}

/* =============================================================================
   Gateway Heartbeat
   ============================================================================= */

/**
 * Health ping sent by edge gateway every 60 seconds.
 * Stored in HardwareHealthLog.
 */
export interface GatewayHeartbeat {
  gateway_id: string;
  community_id: string;
  timestamp: string;
  uptime_seconds: number;
  firmware_version: string;
  modbus_devices_online: number;
  modbus_devices_total: number;
  mqtt_reconnects: number;
  local_buffer_records: number;
  temperature_c?: number;
}

/* =============================================================================
   HAL Adapter Interface
   ============================================================================= */

/**
 * Interface that all HAL adapters must implement.
 * Adapters: SimulatedAdapter, MqttAdapter, CloudApiAdapter (future)
 */
export interface HalAdapter {
  /** Retrieve the latest telemetry for a home */
  getLatestTelemetry(homeId: string): Promise<HardwareTelemetry>;

  /** Retrieve the active data source */
  getTelemetrySource(): TelemetrySource;

  /** Check if this adapter is currently online / available */
  isAvailable(): Promise<boolean>;

  /** Send a dispatch command to the physical device */
  sendDispatchCommand(command: HardwareDispatchCommand): Promise<HardwareDispatchAck>;

  /** Get health status for all devices managed by this adapter */
  getDeviceHealth(homeId: string): Promise<HardwareDeviceHealth>;
}
