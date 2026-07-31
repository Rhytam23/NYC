# CEE-AI Hardware Architecture Overview

This document describes the physical hardware layer of the Community Energy Exchange AI (CEE-AI) platform.

> **Design Principle**: CEE-AI is hardware-optional. The software runs in full simulation mode when no physical hardware is present and automatically upgrades to real hardware data when an edge gateway comes online. The **Hardware Abstraction Layer (HAL)** enforces this modularity.

---

## System Context

CEE-AI operates as a **Virtual Power Plant (VPP)** coordinator for residential gated communities. Each participating home may have any combination of:

- **Rooftop Solar PV** (grid-tied inverter)
- **Battery Energy Storage System (BESS)**
- **Smart Energy Meter** (bi-directional, AMI-grade)
- **EV Charger**
- **Medical Appliances** (Tier-0 protected loads)

The CEE-AI edge gateway is installed at the RWA community level (or per building block) and bridges these distributed devices to the cloud platform.

---

## Hardware Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PALM MEADOWS RWA COMMUNITY                          │
│                                                                             │
│   Flat V-104 (Rajesh)          Flat A-402 (Dr. Meenakshi)                 │
│   ┌───────────────────┐        ┌───────────────────┐                       │
│   │  Solar PV  8 kWp  │        │  No Solar          │                      │
│   │  Enphase IQ8 INV  │        │  Smart Meter Only  │                      │
│   │  BESS: 10 kWh     │        │  Tier-0 Medical    │                      │
│   │  Smart Meter      │        └─────────┬─────────┘                       │
│   └─────────┬─────────┘                  │ RS-485 Modbus                   │
│             │ Modbus + MQTT              │                                  │
│             └──────────────┬─────────────┘                                 │
│                            │                                                │
│                   ┌────────▼────────┐                                      │
│                   │  EDGE GATEWAY   │  Raspberry Pi 4B (4GB RAM)           │
│                   │  (per building) │  Running: cee-edge-agent             │
│                   │                 │  Protocol Bridge:                     │
│                   │  Modbus→MQTT    │   Modbus RTU (RS-485)                │
│                   │  RS-485 Bus     │   SunSpec Protocol                   │
│                   └────────┬────────┘   MQTT Publish (TLS)                │
│                            │                                                │
│                            │ HTTPS/MQTT over TLS (Port 8883)              │
└────────────────────────────┼────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────────────────────────────────┐
                    │         CEE-AI CLOUD PLATFORM               │
                    │         (Next.js on Vercel)                  │
                    │                                              │
                    │  POST /api/v1/hardware/telemetry  ◄─────────│
                    │  POST /api/v1/telemetry/ingest    ◄─────────│
                    │  GET  /api/v1/hardware/status     ─────────►│
                    │  POST /api/v1/hardware/dispatch   ─────────►│
                    └──────────────────────────────────────────────┘
```

---

## Communication Stack

| Layer | Protocol | Purpose |
|---|---|---|
| Physical | RS-485 (2-wire) | Modbus RTU to meters and inverters |
| Device Protocol | Modbus RTU / SunSpec | Reading meter registers, inverter state |
| Edge Internal | MQTT v5 (local broker) | Aggregation bus on the Pi |
| Edge-to-Cloud | MQTT over TLS (port 8883) | Telemetry push to CEE-AI API |
| Cloud REST | HTTPS REST (JSON) | API commands and query responses |
| Cloud Fallback | Inverter Cloud APIs | Enphase/SolarEdge/GoodWe (existing) |

---

## Hardware Data Flow

```
Physical Device Readings
        │
        │ (Modbus RTU poll — every 5 seconds)
        ▼
Edge Gateway (Raspberry Pi 4)
        │
        │ 1. Validate & normalize readings
        │ 2. Compute 15-second rolling averages
        │ 3. Detect fault conditions (offline, voltage sag)
        │ 4. Publish to MQTT topic: cee/+/+/telemetry
        │
        ▼
MQTT Broker (Mosquitto on Pi)
        │
        │ (Subscriber: cee-cloud-bridge service on Pi)
        ▼
CEE-AI Cloud API
  POST /api/v1/hardware/telemetry
        │
        │ 1. Validate JWT from gateway
        │ 2. Write to EnergyTelemetry table (source=MQTT_EDGE)
        │ 3. Trigger decision engine if interval elapsed
        │
        ▼
AI Decision Engine
  (Dispatch commands back via MQTT response topic)
```

---

## Hardware vs Cloud API Fallback Logic

The CEE-AI Hardware Abstraction Layer (HAL) in `src/lib/hardware/hal.ts` automatically selects the data source:

```
Priority 1: MQTT_EDGE (physical hardware online)
Priority 2: CLOUD_API (inverter cloud API, e.g., Enphase)
Priority 3: SIMULATED (mock-store fallback for demos)
```

This ensures the platform always has data and never crashes due to hardware failures.

---

## Components Summary

| Component | Model / Standard | Count per Home | Protocol |
|---|---|---|---|
| Edge Gateway | Raspberry Pi 4B 4GB | 1 per building block | MQTT |
| Smart Energy Meter | Genus DLMS AMI or L&T EM6400 | 1 per home | Modbus RTU (RS-485) |
| Solar Inverter | Enphase IQ8 / SolarEdge / GoodWe | 1–3 per home | SunSpec Modbus + Cloud |
| Battery BMS | BESS (BMS RS-485 interface) | 1 per home (if BESS present) | Modbus RTU |
| EV Charger | OCPP 1.6J compatible | 1 per home (if EV present) | OCPP over WebSocket |
| Temperature Sensor | DS18B20 (1-Wire) | 1 per gateway | 1-Wire |
| Voltage Sensor | Grid voltage tap (on meter) | Built into smart meter | Modbus register |

---

## Related Documents

- [`COMPONENTS.md`](./COMPONENTS.md) — Detailed per-component specifications
- [`COMMUNICATION.md`](./COMMUNICATION.md) — Full protocol specifications
- [`POWER_REQUIREMENTS.md`](./POWER_REQUIREMENTS.md) — Power budgets
- [`SAFETY.md`](./SAFETY.md) — Safety, failure modes, and mitigations
- [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) — Software integration steps
- [`../protocols/mqtt-topics.md`](../protocols/mqtt-topics.md) — MQTT topic schema
- [`../protocols/modbus-registers.md`](../protocols/modbus-registers.md) — Modbus register map
