# CEE-AI Hardware Electronics

This directory contains electrical schematic references, wiring diagrams, and PCB design notes for the CEE-AI hardware ecosystem.

> **Status**: Schematic references and wiring diagrams are documented here. PCB design files (KiCad / Eagle) will be added when hardware moves from specification to fabrication phase.

---

## Wiring Diagram Overview

### Edge Gateway Connections

```
                                         ┌─────────────────────┐
                                         │  RASPBERRY PI 4B    │
                               USB-C 5V ─┤ PWR                 │
                                         │                     │
USB-RS485 Adapter ────── USB-A ─────────┤ USB 3.0 (×4)        │
(CH340 / FTDI)                           │                     │
  │                                      │                     │
  │ DE/RE + A/B                          │ GPIO 4 ────────────────── DS18B20 (1-Wire)
  │                                      │ GPIO 2 (SDA)            │ 4.7kΩ pullup to 3.3V
  ▼                                      │ GPIO 3 (SCL)            │
RS-485 Bus (2-wire)                      │ ETH ──── RJ45 ──── LAN switch
  ├── Smart Meter (Addr 0x01)            │                     │
  ├── BMS (Addr 0x02)                    │ USB-C (OTG) ────── LTE USB modem (optional)
  └── Inverter Modbus (Addr 0x21)        └─────────────────────┘
```

### RS-485 Bus Wiring

```
Gateway                                                      Last Device
(USB-RS485)                                                  (e.g., Meter 32)
   A+  ────────────────────────────────────────────────────── A+
   B−  ────────────────────────────────────────────────────── B−
   GND ─────────────────────────────────────────────────────  GND (shield)

Termination at Gateway end:    120Ω between A+ and B−
Termination at far end:        120Ω between A+ and B−

Maximum bus length: 1,200 m at 9,600 baud
Maximum devices without repeater: 32
```

### Smart Meter CT Clamp Connections

```
Distribution Board (DB)
    │
    ├── Main Incomer (from DISCOM) ──── CT1 (Load measurement)
    │
    ├── Solar Feed (from Inverter AC) ── CT2 (Solar generation)
    │
    └── BESS Feed (from Battery Inv.) ── CT3 (Battery flow)

CT Clamp specs:
  - Type: Split-core, 5A secondary, rated for conductor size
  - L&T EM6400: 3× CT inputs (5A/5A/5A)
  - Genus DLMS: 3× CT inputs

CT Secondary wiring:
  CT1 S1 ──── Meter IL1+ terminal
  CT1 S2 ──── Meter IL1− terminal
  (NEVER open-circuit a CT secondary under load)
```

---

## Component Sourcing

### India-Specific Sourcing Notes

| Component | Where to Buy | Approx. Cost (2026) |
|---|---|---|
| Raspberry Pi 4B 4GB | Electronics Bazaar, Robu.in | ₹ 6,500 |
| USB-RS485 adapter (CH340) | Amazon IN, Robu.in | ₹ 250 |
| Genus DLMS AMI Smart Meter | Direct from Genus / authorized distributor | ₹ 3,500 |
| L&T EM6400NG Multifunction Meter | L&T Switchgear distributors | ₹ 4,200 |
| DIN-rail PSU 5V/4A | Meanwell (Silicone House, Mumbai) | ₹ 800 |
| DIN-rail UPS | APC / Luminous (electrical wholesale) | ₹ 3,000 |
| Industrial DIN enclosure | Polycase / local electrical supplier | ₹ 500 |
| MAX485 RS-485 transceiver | Robu.in | ₹ 30 |
| DS18B20 waterproof probe | Amazon IN | ₹ 150 |
| SLA battery 12V 7Ah | Local battery shop / Amazon | ₹ 800 |

**Approximate Bill of Materials per Block Gateway: ₹ 15,000–20,000**

---

## IP Rating and Enclosure Requirements

| Environment | Required IP Rating | Notes |
|---|---|---|
| Indoor electrical room (dry) | IP20 | Standard DIN enclosure |
| Basement / semi-outdoor | IP44 | Water-splash protected |
| Outdoor (exposed) | IP65 | Full weatherproof; additional ventilation needed |

All hardware in this project targets **IP20 minimum** for indoor electrical room installation.

---

## PCB Design Notes (Future)

If a custom PCB is developed for the ESP32 Modbus reader:

| Design Rule | Value |
|---|---|
| Copper pour | 2-layer FR4 |
| Trace width (power) | 0.5 mm minimum for 1A |
| Trace width (signal) | 0.2 mm minimum |
| RS-485 traces | Differential pair, matched length |
| RS-485 TVS diode | SMAJ5.0A on A and B lines |
| Isolation gap | ≥ 3 mm between RS-485 and logic sections |
| Conformal coating | Recommended for humidity resistance |

KiCad project files will be placed in `hardware/electronics/kicad/` when created.
