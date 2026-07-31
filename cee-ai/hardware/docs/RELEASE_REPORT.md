# CEE-AI Hardware Release Report

**Date**: 2026-07-31  
**Version**: 1.0.0-rc1  
**Target Project**: Community Energy Exchange AI (CEE-AI)  
**Status**: Integrated & Validated (All builds, typechecks, and lints passing)

---

## 1. Hardware Architecture

CEE-AI integrates an optional physical hardware layer alongside its existing cloud API fallback. The physical topology is designed as a hierarchical distributed system:

- **Local Bus**: Distributed smart energy meters, solar inverters, and battery BMS systems connect to an on-site edge gateway via a daisy-chained **RS-485 Modbus RTU** bus.
- **Edge Gateway**: A Raspberry Pi 4B Model (4 GB RAM) runs the `cee-edge-agent` daemon, which acts as the local coordinator, Modbus poller, SQLite data-cache, and MQTT client.
- **Cloud Bridge**: The gateway publishes normalized telemetry payloads via **MQTT over TLS** to the cloud-hosted CEE-AI REST API or local MQTT broker.
- **OCPP Integration**: Dedicated EV chargers integrate directly using **OCPP 1.6J** over WebSockets to support Tier-3 emergency load shedding.

---

## 2. Hardware Abstraction Layer (HAL) Architecture

The HAL (`src/lib/hardware/hal.ts`) isolates physical hardware concerns from the application and AI layers. It is exposed as a singleton instance (`hal`) that automatically selects the highest-priority available data source:

```
┌───────────────────────────────────────────────┐
│              HAL Source Hierarchy             │
├───────────────────────────────────────────────┤
│  Priority 1: MQTT_EDGE                        │
│    Sourced from cached edge gateway readings  │
│    (Freshest data, updated every 5-15s)       │
├───────────────────────────────────────────────┤
│  Priority 2: CLOUD_API                        │
│    Sourced from cloud APIs (Enphase/GoodWe)   │
│    (Updated every 5 minutes)                  │
├───────────────────────────────────────────────┤
│  Priority 3: SIMULATED                        │
│    Fallback using mock-store generator        │
│    (Always available)                         │
└───────────────────────────────────────────────┘
```

### Safety Gateways Enforced by HAL

- **Power Checks**: Validates that all dispatch command `power_kw` requests are non-negative.
- **Expiry Protection**: Discards any commands whose `expires_at` timestamp is in the past.
- **Exclusion Filters**: Automatically filters out homes from dispatch operations if the BMS reports non-zero error codes or if communication is stale (>300 seconds).

---

## 3. Supported Communication Protocols

| Protocol | Layer | Usage | Key Specifications |
|---|---|---|---|
| **Modbus RTU** | Physical / Serial | Local device loop | RS-485 (2-wire), 9600 baud, 8N1 |
| **SunSpec** | Device Register Map | Solar inverters | Standard IEC 61724-1 register mappings |
| **MQTT v5** | Transmission | Edge-to-cloud | TLS-secured (port 8883), QoS 1/2 |
| **OCPP 1.6J** | Control | EV charging | JSON over WebSockets, charging profiles |
| **Dallas 1-Wire**| Auxiliary | Enclosure temp | DS18B20 digital probes |

---

## 4. Integration Points

### AI Decision Engine (`src/lib/ai/decision-engine.ts`)

- **Telemetry Source Tagging**: The HAL supplies the active data source (`MQTT_EDGE`, `CLOUD_API`, `SIMULATED`), which is propagated to the ledger and telemetry tables.
- **Direct Voltage Sag Input**: Instantaneous line voltages from physical smart meters (Modbus register `0x000A`) flow directly into `weather-intelligence.ts` to calculate outage probabilities, bypassing the slower, less accurate cloud API default values.
- **Audit Trails**: Dispatch command audit strings are appended with the active data source for forensic transparency.

---

## 5. New Database Models

The schema (`prisma/schema.prisma`) is updated with three new models and a telemetry source enum:

1. **`TelemetrySource`** (Enum): Tracks `MQTT_EDGE`, `CLOUD_API`, `SIMULATED`, and `MANUAL` data origins.
2. **`EnergyTelemetry`** (Modified): Integrates `telemetry_source` (default `SIMULATED`) and nullable `hardware_device_id` fields.
3. **`HardwareDevice`**: A physical device registry mapping edge gateways, smart meters, inverters, and battery BMS systems to their communities/homes, status, and Modbus addresses.
4. **`HardwareHealthLog`**: Time-series log recording heartbeats, offline events, temperature alerts, and tamper flags.

### Database Indexes Configured

- `EnergyTelemetry(hardware_device_id)`
- `EnergyTelemetry(telemetry_source, time DESC)`
- `HardwareDevice(community_id)`, `HardwareDevice(home_id)`, `HardwareDevice(gateway_id)`
- `HardwareHealthLog(hardware_device_id, created_at DESC)`
- `HardwareHealthLog(event_type, created_at DESC)`

---

## 6. New REST APIs

Four REST endpoints are implemented under `src/app/api/v1/hardware/`:

1. **`POST /api/v1/hardware/telemetry`**: Allows edge gateways to push batches of telemetry readings. Enforces token auth, schema validation, and ±5-minute timestamp checks.
2. **`GET /api/v1/hardware/status`**: Serves current HAL mode and connection status. Supports gateway queries and dashboard status indicators.
3. **`POST /api/v1/hardware/heartbeat`**: Accepts 60-second gateway heartbeats and logs system performance metrics.
4. **`POST /api/v1/hardware/dispatch`**: Exposes manual command execution to RWA and platform administrators.

---

## 7. Simulation Support

The simulated adapter (`src/lib/hardware/adapters/simulated-adapter.ts`) enables testing without physical devices:

- **Gaussian Noise**: Adds realistic measurement uncertainty (±2%) to active/reactive power readings.
- **Time-realistic Solar curve**: Simulates generation profiles that scale naturally with the time of day.
- **Voltage sag injection**: Drops line voltages to 195V during simulated outages.
- **Emergency testing**: Enables verification of force-charging, load shedding, and priorities under normal and blackout conditions.

---

## 8. Remaining Implementation Work

1. **Edge Agent Production Implementation**: Convert the node scripts in `hardware/firmware/edge-gateway/` into a compiled Node.js/TypeScript project.
2. **ESP32 Firmware Flash**: Implement the PlatformIO project in `hardware/firmware/smart-meter-reader/` and flash onto physical ESP32 chips for lab testing.
3. **MQTT Broker Cloud Hook**: Establish the cloud-side subscriber to forward incoming MQTT broker payloads directly to the database.
4. **Security Hardening**: Upgrade the API token check in the endpoints to cryptographically verify HMAC-SHA256 JWT signatures.

---

## 9. Risks and Recommendations

### Risks

- **SD Card Wear**: High-frequency logging on edge gateways can wear out SD cards. *Mitigation*: Configure a read-only root filesystem with log rotation in RAM.
- **Modbus Loop Interruption**: Loose wires or termination faults can drop all devices on a block. *Mitigation*: Ensure 120Ω resistors are correctly placed and implement automatic alerts on gateway heartbeats.
- **High-Voltage Hazards**: Dangerous voltages are present in meters and BESS panels. *Mitigation*: Enforce lock-out/tag-out rules and only use licensed electricians.

### Recommendations

1. **Deploy Phase 1**: Run the system in `simulated` mode during the upcoming stakeholder demo.
2. **Start Bench Testing**: Purchase a single Genus smart meter and an ESP32 chip to validate Modbus register parsers in a lab environment.
3. **Cellular Backup**: Deploy a USB LTE modem alongside the main gateway Ethernet connection to ensure critical communications remain online during severe storm blackouts.
