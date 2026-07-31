# CEE-AI Hardware Components Specification

This document defines every physical hardware component in the CEE-AI ecosystem. Each component entry includes its purpose, inputs, outputs, communication protocol, power requirements, failure modes, safety considerations, and integration with CEE-AI.

---

## 1. Edge Gateway

### Component: Raspberry Pi 4 Model B (4 GB RAM)

| Field | Value |
|---|---|
| **Purpose** | Protocol bridge between physical devices (meters, inverters, BMS) and the CEE-AI cloud. Hosts the `cee-edge-agent` service, local MQTT broker, and Modbus polling daemon. |
| **Model** | Raspberry Pi 4 Model B — 4 GB RAM variant |
| **OS** | Raspberry Pi OS Lite (64-bit, headless) |
| **Software** | `cee-edge-agent` (Node.js 20 LTS), Mosquitto MQTT v5, `modbus-serial` poller |
| **Inputs** | RS-485 Modbus bus (via USB-RS485 adapter), 5 V USB-C power supply, Ethernet / Wi-Fi for cloud uplink |
| **Outputs** | MQTT telemetry payloads (TLS encrypted) → CEE-AI cloud API |
| **Protocol** | Modbus RTU inbound; MQTT v5 over TLS (port 8883) outbound |
| **Power** | 5 V / 3 A via USB-C (≈ 15 W peak) |
| **Enclosure** | DIN-rail mount industrial enclosure (IP20 minimum); UPS-backed 12 V input via DC-DC |
| **Quantity** | 1 per building block (shared across ≤ 48 flats) |
| **Location** | RWA electrical room or ground-floor DB panel |

#### Failure Modes

| Failure | Symptom | Mitigation |
|---|---|---|
| Network outage (cloud) | MQTT publishes fail | Edge caches up to 10,000 readings locally (SQLite); replays on reconnect |
| Power loss | Gateway offline | UPS-backed power (minimum 30-min backup); watchdog timer restarts service |
| SD card corruption | Boot failure | Read-only root filesystem; data on separate partition; annual SD replacement |
| Modbus bus fault | No device readings | `cee-edge-agent` logs DEVICE_OFFLINE; falls back to last known reading for 5 min |

#### Safety Considerations
- Low-voltage 5 V device — no electrocution risk from the Pi itself
- Must be isolated from high-voltage AC wiring; install in a segregated compartment
- All RS-485 connections must be fused; use opto-isolated USB-RS485 adapters

#### CEE-AI Integration
- Gateway authenticates with CEE-AI using a pre-provisioned `HARDWARE_JWT_SECRET`
- Pushes to `POST /api/v1/hardware/telemetry` every 15 seconds
- Receives dispatch commands via MQTT response topic `cee/{community_id}/dispatch`
- If the cloud is unreachable, continues local logging and alerts the RWA admin

---

## 2. Smart Energy Meter

### Component: Genus DLMS AMI Smart Meter (or L&T EM6400NG)

| Field | Value |
|---|---|
| **Purpose** | Bi-directional revenue-grade measurement of active power (kW), reactive power (kVAR), energy (kWh), voltage (V), current (A), and power factor. Primary source of energy data for each home. |
| **Models** | Genus DLMS / ANSI C12.20 Class 0.2S meter OR L&T EM6400NG Multifunction Meter |
| **Inputs** | 240 V AC (single phase) or 415 V AC (three phase) mains connection; CT clamps for current measurement |
| **Outputs** | Active power (kW), Energy (kWh), Voltage (V), Current (A), Power Factor, Tamper alerts |
| **Protocol** | Modbus RTU over RS-485 (2-wire, 9600 baud, 8N1); also DLMS/COSEM for AMI integration |
| **Power** | Self-powered from measured AC line; aux power: 85–265 V AC |
| **Accuracy Class** | Class 1 (IEC 62053-21) or better; revenue-grade |
| **Modbus Addresses** | See [`../protocols/modbus-registers.md`](../protocols/modbus-registers.md) |
| **Quantity** | 1 per household flat |
| **Location** | DB panel / consumer unit for each flat |

#### Inputs Detail
- **Primary Input**: Live and Neutral (single phase) / R-Y-B-N (three phase) from distribution board
- **CT Input**: 5 A secondary CT clamps on each phase conductor
- **RS-485 A/B**: Two-wire differential data bus connection to edge gateway

#### Outputs Detail
- `solar_gen_kw` — derived from Inverter CT measurement (positive when generating)
- `home_demand_kw` — load measurement from main incomer CT
- `grid_import_kw` — net import from DISCOM grid
- `grid_export_kw` — net export to DISCOM grid
- `battery_flow_kw` — measured from BESS CT (positive = charging)
- `grid_voltage_v` — instantaneous line voltage (fed to weather-intelligence for sag detection)
- `power_factor` — community power quality metric

#### Failure Modes

| Failure | Symptom | Mitigation |
|---|---|---|
| Meter offline (RS-485 bus fault) | `DEVICE_OFFLINE` alert in HAL | Edge falls back to cloud API (Enphase) for 5 minutes; then marks as STALE |
| CT clamp open-circuit | Incorrect high-current reading | Meter firmware detects open CT and raises tamper flag |
| Voltage sag | Low voltage reading (<200 V) | Passed directly to `weather-intelligence.ts` as `gridVoltageSag` for force-charge decision |
| Clock drift | Wrong timestamps on readings | Gateway NTP-syncs meter clock at startup |

#### Safety Considerations
- **HIGH VOLTAGE** — Meter is connected to mains 240/415 V AC. Installation by licensed electrician only.
- CT clamps must never be opened under load (induced voltage hazard)
- RS-485 data lines must be isolated from mains (opto-isolation in USB-RS485 adapter)
- Tamper-evident seal on meter enclosure; alert logged to `AuditLog` on tamper detection

#### CEE-AI Integration
- Readings mapped directly to `EnergyTelemetry` table fields
- `grid_voltage_v` maps to `WeatherTelemetry.gridVoltageSag` in weather intelligence
- `telemetry_source` set to `MQTT_EDGE` when from physical meter
- Emergency tier enforcement: Tier-0 homes' meters never shed load (enforced in software)

---

## 3. Solar Inverter (Local Modbus Channel)

### Component: Enphase IQ8 / SolarEdge HD-Wave / GoodWe DNS (Local SunSpec)

| Field | Value |
|---|---|
| **Purpose** | Convert DC solar energy to AC. Provide real-time generation data locally via SunSpec Modbus and remotely via cloud API. |
| **Models** | Enphase IQ8 microinverter system, SolarEdge HD-Wave, GoodWe DNS hybrid |
| **Inputs** | DC from solar PV panels (open circuit voltage per OEM spec) |
| **Outputs** | AC export to load / grid; Modbus RTU or TCP telemetry |
| **Primary Protocol (existing)** | Cloud API (Enphase Enlighten, SolarEdge Monitoring, GoodWe SEMS) |
| **Secondary Protocol (new)** | SunSpec Modbus over RS-485 (standard IEC 61724-1) |
| **Power** | Self-powered from solar generation |
| **Registers** | SunSpec Model 101 (Single Phase) / 103 (Three Phase) — see modbus-registers.md |
| **Quantity** | 1–3 per solar-equipped home |

#### Failure Modes

| Failure | Symptom | Mitigation |
|---|---|---|
| Cloud API timeout | No data from Enphase/SolarEdge cloud | HAL falls back to local Modbus read |
| Local Modbus unreachable | No local data either | HAL marks source as STALE, uses last known value (15-min TTL) |
| Inverter offline (grid fault) | Generation drops to 0 | Grid fault → `OUTAGE_DG_ACTIVE` state; AI engine activates triage |
| Anti-islanding trip | Inverter shuts down on outage | Expected behavior during grid outage — battery carries load |

#### Safety Considerations
- DC PV strings may be live even when grid is off — **arc flash risk**
- Disconnection sequence: AC disconnect first, then DC isolators
- Anti-islanding protection mandatory (IEC 62116) — inverter must not export during grid outage

#### CEE-AI Integration
- Local Modbus provides lower-latency data than cloud polling (5-second vs 5-minute)
- `solar_gen_kw` from local Modbus is the primary source; cloud API is the fallback
- `max_export_kw` in `Inverter` table limits dispatch commands to safe levels
- HAL routes dispatch `CURTAIL` / `CHARGE` commands to inverter via Modbus write registers

---

## 4. Battery Energy Storage System (BESS)

### Component: BMS with RS-485 / CAN Interface

| Field | Value |
|---|---|
| **Purpose** | Store excess solar energy for use during peak demand, night hours, or grid outages. BMS exposes State of Charge, temperature, charge/discharge power, and fault flags. |
| **BMS Interface** | RS-485 Modbus RTU (vendor-specific register map; common vendors: PYLON, BYD, Growatt, SolarEdge SE-B) |
| **Inputs** | DC charge from inverter / solar; charge commands from CEE-AI dispatch |
| **Outputs** | `battery_soc_pct` (0–100%), `battery_flow_kw` (+ charge / − discharge), `battery_temp_c`, `bms_fault_code` |
| **Protocol** | Modbus RTU RS-485 (primary); CAN bus (PYLON US2000 series) |
| **Typical Capacity** | 5–15 kWh per home |
| **Typical C-rate** | 0.5C charge, 0.5C discharge (standard residential) |
| **Power** | Self-managed; BMS draws <5 W from battery for operation |
| **Safety Rating** | IEC 62619, UL 9540 |

#### Failure Modes

| Failure | Symptom | Mitigation |
|---|---|---|
| BMS over-temperature | Thermal fault flag | CEE-AI emergency prioritization halts charge commands immediately |
| Cell over-voltage | BMS disconnects | Emergency prioritization SOC floors prevent over-charge |
| SOC communication loss | `battery_soc_pct` stale | HAL returns last known SOC; if stale > 5 min, raises `BMS_COMMS_FAULT` alert |
| BMS fault code | Non-zero `bms_fault_code` | Logged to `HardwareHealthLog`; AI engine excludes battery from dispatch |

#### Safety Considerations
- **HIGH ENERGY STORAGE** — Battery packs can deliver thousands of amps short-circuit
- BMS must have hardware-enforced over-current, over-voltage, and over-temperature protection independent of CEE-AI software
- CEE-AI enforces minimum SOC floors (Tier-0: 30%, Tier-1: 35%) to prevent deep discharge
- Never issue charge commands exceeding BMS-rated C-rate — HAL enforces via `max_charge_kw` constraint

#### CEE-AI Integration
- `battery_soc_pct` is the most critical safety input to the AI decision engine
- SOC floor enforcement in `emergency-prioritization.ts` is the first line of defense
- Dispatch commands (`CHARGE` / `DISCHARGE`) are validated against BMS limits in HAL before transmission
- `bms_fault_code != 0` → home excluded from energy routing calculations

---

## 5. EV Charger

### Component: OCPP 1.6J Compatible AC Charger

| Field | Value |
|---|---|
| **Purpose** | Provide controllable EV charging load. As a Tier-3 deferrable load, it is the first to be throttled or shed during grid emergencies. |
| **Standard** | OCPP 1.6J (JSON) over WebSocket |
| **Inputs** | AC mains 240 V, 16–32 A (3.7–7.4 kW) |
| **Outputs** | `charger_state` (AVAILABLE / CHARGING / SUSPENDED), `charge_power_kw`, `session_energy_kwh` |
| **Protocol** | OCPP 1.6J (Central System = CEE-AI cloud or local edge proxy) |
| **Power** | 240 V × 16 A = 3.84 kW (Type 1) or 240 V × 32 A = 7.68 kW (Type 2) |
| **Control** | `ChangeAvailability`, `SetChargingProfile` OCPP commands |
| **Quantity** | 1 per EV-equipped home (flag: `Home.has_ev`) |

#### Failure Modes

| Failure | Symptom | Mitigation |
|---|---|---|
| OCPP connection lost | Charger reverts to default profile | CEE-AI has no shedding control; physical CB must be used |
| Charger hardware fault | Fault state in OCPP status | Alert logged; Tier-3 load shedding proceeds without OCPP confirmation |
| EV not responding | Session does not start | No energy drawn; no dispatch impact |

#### Safety Considerations
- Charger must have ground-fault protection (RCD Type B or equivalent)
- CEE-AI sends `SetChargingProfile` to suspend charging — this is a soft control; physical CB is the hard backup
- Only Tier-3 flats have EV chargers actively managed

#### CEE-AI Integration
- Emergency triage: When `gridStatus === "OUTAGE_DG_ACTIVE"` and tier is TIER_3_DEFERRABLE, send `SetChargingProfile` with `chargingRateUnit = W, limit = 0`
- `home_demand_kw` reading from smart meter naturally reflects charger load shedding
- OCPP integration is future scope; current implementation uses demand reduction via smart meter load control

---

## 6. Temperature / Ambient Sensor

### Component: DS18B20 1-Wire Digital Temperature Sensor

| Field | Value |
|---|---|
| **Purpose** | Monitor ambient temperature in the electrical enclosure (gateway + DB panel). Alert on overheating. Optionally used for thermal correction of battery capacity estimates. |
| **Model** | DS18B20 waterproof probe |
| **Inputs** | 3–5.5 V power from Raspberry Pi GPIO |
| **Outputs** | Temperature in °C (resolution: 0.0625°C) over 1-Wire bus |
| **Protocol** | Dallas 1-Wire (GPIO pin on Raspberry Pi) |
| **Power** | Parasitic power from data line, or 3.3 V GPIO |
| **Accuracy** | ±0.5°C over −10°C to +85°C range |
| **Quantity** | 1 per edge gateway enclosure |

#### Failure Modes

| Failure | Symptom | Mitigation |
|---|---|---|
| Sensor disconnect | CRC error / timeout on 1-Wire | Gateway logs warning; non-critical, operations continue |
| Enclosure overheating (>55°C) | Alert emitted to `HardwareHealthLog` | Automated RWA admin notification to check ventilation |

#### CEE-AI Integration
- Temperature reading stored in `HardwareHealthLog.details` JSON field
- High temperature alert surfaced on Emergency Command Center dashboard

---

## Component Registry Summary

| ID | Component | Protocol | Qty per Home | Priority |
|---|---|---|---|---|
| HW-01 | Edge Gateway (RPi 4B) | MQTT/Modbus bridge | 1 per block | Infrastructure |
| HW-02 | Smart Energy Meter (Genus/L&T) | Modbus RTU RS-485 | 1 | Critical |
| HW-03 | Solar Inverter (Enphase/SolarEdge) | SunSpec Modbus + Cloud | 1–3 | High |
| HW-04 | Battery BMS (PYLON/BYD/Growatt) | Modbus RTU RS-485 | 0–1 | High |
| HW-05 | EV Charger (OCPP 1.6J) | OCPP WebSocket | 0–1 | Medium (deferrable) |
| HW-06 | Temperature Sensor (DS18B20) | 1-Wire GPIO | 1 per gateway | Low |
