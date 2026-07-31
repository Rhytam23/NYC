# CEE-AI Communication Protocols

This document specifies all communication protocols used in the CEE-AI hardware layer.

---

## 1. Modbus RTU over RS-485

### Physical Layer

| Parameter | Value |
|---|---|
| Interface | RS-485, 2-wire differential (A+ / B−) |
| Topology | Multi-drop bus, up to 32 devices without repeater |
| Max Cable Length | 1,200 m at 9,600 baud |
| Termination | 120 Ω resistor at each end of bus |
| Isolation | Opto-isolated USB-RS485 adapter on gateway |

### Serial Parameters

| Parameter | Value |
|---|---|
| Baud Rate | 9,600 bps (default) |
| Data Bits | 8 |
| Parity | None |
| Stop Bits | 1 |
| Mode | Modbus RTU |
| Byte Order | Big-Endian (Modbus standard) |

### Device Address Allocation

| Address Range | Device Type |
|---|---|
| 0x01–0x20 (1–32) | Smart Energy Meters (1 per flat) |
| 0x21–0x30 (33–48) | Solar Inverters (SunSpec) |
| 0x31–0x40 (49–64) | Battery BMS interfaces |
| 0xFF (255) | Broadcast (never use for reads) |

### Polling Strategy

The edge gateway polls devices on a configurable schedule:

```
Every 5 seconds:  battery_soc_pct, battery_flow_kw (safety-critical)
Every 10 seconds: solar_gen_kw, home_demand_kw, grid_import_kw, grid_export_kw
Every 60 seconds: grid_voltage_v, power_factor, energy_kwh (cumulative)
Every 5 minutes:  temperature, firmware_version, fault_codes
```

Polling timeout: 500 ms per device. Three consecutive timeouts → `DEVICE_OFFLINE` status.

---

## 2. MQTT (Edge-Internal and Edge-to-Cloud)

### MQTT Broker Configuration (Edge — Mosquitto v2)

```conf
# /etc/mosquitto/mosquitto.conf
listener 1883         # Local only (no TLS, LAN only)
listener 8883         # TLS (for cloud bridge)
cafile   /etc/mosquitto/ca.crt
certfile /etc/mosquitto/server.crt
keyfile  /etc/mosquitto/server.key
allow_anonymous false
password_file /etc/mosquitto/passwd
```

### Authentication

- Each edge gateway has a unique **Client ID**: `cee-gw-{community_id}-{block_id}`
- Authenticated using **username/password** (MQTT level) + **TLS client certificate**
- Cloud API validates the JWT in the MQTT message payload for additional security

### MQTT Topic Schema

Full topic schema is documented in [`../protocols/mqtt-topics.md`](../protocols/mqtt-topics.md).

**Summary:**

```
cee/{community_id}/{home_id}/telemetry       # → Cloud: device publishes readings
cee/{community_id}/{home_id}/dispatch        # ← Cloud: AI dispatch commands
cee/{community_id}/{gateway_id}/heartbeat   # → Cloud: gateway health ping
cee/{community_id}/{gateway_id}/alert        # → Cloud: fault alerts
```

### QoS Levels

| Topic | QoS | Reason |
|---|---|---|
| `.../telemetry` | QoS 1 (at-least-once) | Tolerate duplicates; DB uses `(time, home_id)` PK |
| `.../dispatch` | QoS 2 (exactly-once) | Commands must not be duplicated (safety) |
| `.../heartbeat` | QoS 0 (fire-and-forget) | Frequent; loss acceptable |
| `.../alert` | QoS 1 | Alerts must be delivered at least once |

---

## 3. SunSpec Modbus (Solar Inverters)

SunSpec is an industry standard (IEC 61724-1) layer on top of Modbus that provides a self-describing register map for solar inverters. Most modern inverters (Enphase gateway, SolarEdge, GoodWe) support SunSpec.

### Discovery

The edge gateway reads the SunSpec identifier at register 40000 (0x9C40):
- If registers 40000–40001 = `0x53756e53` ("SunS"), the device is SunSpec-compliant.
- Model blocks follow immediately after.

### Key Models Used

| SunSpec Model | Model Number | Key Registers |
|---|---|---|
| Common | 1 | Manufacturer, model, serial number |
| Inverter (single phase) | 101 | AC power (W), AC energy (Wh), DC power (W) |
| Inverter (three phase) | 103 | Same but 3-phase |
| Storage (battery) | 124 | SOC (%), charge/discharge power (W) |
| Meter (AC) | 201/202/203 | AC power, energy, voltage, current |

### Register Addresses (relative to model start)

See [`../protocols/modbus-registers.md`](../protocols/modbus-registers.md) for the complete register map.

---

## 4. OCPP 1.6J (EV Chargers)

Open Charge Point Protocol v1.6 JSON over WebSocket.

### Architecture

```
EV Charger (Charge Point) ──WebSocket──► CEE-AI OCPP Proxy ──► Cloud
                                         (on Edge Gateway)
```

The edge gateway runs a lightweight OCPP Central System proxy that:
1. Receives status notifications from chargers
2. Relays charge power data to CEE-AI telemetry
3. Forwards `SetChargingProfile` commands from CEE-AI to suspend/resume charging

### Key OCPP Messages Used

| Direction | Message | Purpose |
|---|---|---|
| CP → CS | `StatusNotification` | Charger state (Available / Charging / Faulted) |
| CP → CS | `MeterValues` | Real-time power reading (kW) |
| CS → CP | `SetChargingProfile` | Limit or suspend charging (Tier-3 shedding) |
| CS → CP | `ChangeAvailability` | Take charger offline |

### Tier-3 Emergency Shedding

When CEE-AI triggers Tier-3 shedding:
```json
{
  "chargingProfilePurpose": "TxDefaultProfile",
  "chargingSchedule": {
    "chargingRateUnit": "W",
    "chargingSchedulePeriod": [{ "startPeriod": 0, "limit": 0 }]
  }
}
```

---

## 5. Cloud REST API (Edge → CEE-AI Cloud)

### Authentication

Each edge gateway authenticates using a pre-provisioned JWT:
```
Authorization: Bearer <HARDWARE_EDGE_JWT>
```

The JWT payload contains:
```json
{
  "sub": "gateway-{community_id}-{block_id}",
  "community_id": "c7a81023-...",
  "gateway_id": "gw-block-a",
  "iat": 1722441600,
  "exp": 1722528000
}
```

### Endpoints Used by Edge Gateway

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/hardware/telemetry` | Push multi-home meter readings batch |
| `GET` | `/api/v1/hardware/status` | Receive pending dispatch commands |
| `POST` | `/api/v1/hardware/heartbeat` | Gateway health ping |

See the full contract in [`../protocols/api-contract.md`](../protocols/api-contract.md).

---

## 6. 1-Wire (Temperature Sensors)

| Parameter | Value |
|---|---|
| GPIO Pin | GPIO 4 (BCM) on Raspberry Pi |
| Protocol | Dallas 1-Wire |
| Kernel Module | `w1-gpio`, `w1-therm` |
| Read Path | `/sys/bus/w1/devices/28-*/w1_slave` |
| Polling | Every 60 seconds |
| Data Format | `t=<temperature_in_millidegrees_c>` |

---

## Protocol Priority Hierarchy

```
For energy readings (primary data):
  1. Modbus RTU (RS-485)     — lowest latency, most accurate, 5-10 second updates
  2. SunSpec Modbus          — inverter-specific, same bus
  3. Cloud Inverter API      — Enphase/SolarEdge/GoodWe, 5-minute polling
  4. SIMULATED mock data     — fallback for demos / dev environments

For dispatch commands:
  1. MQTT (QoS 2)            — real-time, bidirectional
  2. Cloud API polling       — fallback if MQTT broker unreachable
```
