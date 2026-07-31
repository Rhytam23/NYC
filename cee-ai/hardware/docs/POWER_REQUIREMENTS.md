# CEE-AI Hardware Power Requirements

This document specifies the power budget for all hardware components in the CEE-AI edge installation.

---

## Per-Gateway Power Budget

The edge gateway is installed in the RWA electrical room. Each installation includes:

| Component | Voltage | Current | Power |
|---|---|---|---|
| Raspberry Pi 4B (active) | 5 V DC | 1.5–2.0 A | 7.5–10 W |
| USB-RS485 Adapter (×2) | 5 V (USB) | 0.1 A each | 1 W total |
| DS18B20 temperature sensor | 3.3 V | 1.5 mA | < 0.01 W |
| Ethernet switch (8-port managed) | 12 V | 0.5 A | 6 W |
| Mosquitto MQTT broker (software) | — | — | included in Pi |
| Industrial DIN enclosure cooling fan | 12 V | 0.1 A | 1.2 W |
| **Total Gateway Subsystem** | | | **≈ 18 W peak** |

### Power Supply Specification

| Parameter | Specification |
|---|---|
| Input | 85–265 V AC, 50/60 Hz |
| Output | 5 V / 4 A + 12 V / 2 A (dual output DIN PSU) |
| Efficiency | ≥ 85% (at 75% load) |
| Form Factor | DIN-rail mount, 60 mm width |
| Recommended | Mean Well DR-60-12 + Separate 5V USB-C supply |

### UPS Backup Requirement

The gateway must remain operational during grid outages (its core purpose).

| Parameter | Specification |
|---|---|
| Battery Type | Sealed Lead Acid (SLA) or LiFePO4 |
| Capacity | 12 V / 7 Ah minimum |
| Backup Duration | ≥ 30 minutes at 18 W load |
| UPS Model | Example: APC Back-UPS ES 700 or equivalent DIN-rail UPS |
| Charging | Float-charged from AC supply; auto-switches to battery on outage |

---

## Per-Home Hardware Power Budget

Each participating home's hardware draws minimal power:

| Component | Power Draw | Source |
|---|---|---|
| Smart Energy Meter (Genus/L&T) | < 5 W | Self-powered from metered AC line |
| RS-485 data line (passive) | Negligible | Bus-powered from gateway adapter |
| Solar Inverter (Enphase IQ8) | Self-powered | Solar DC input (no aux power) |
| Battery BMS (communication module) | 2–5 W | Battery pack (12 V aux supply) |
| EV Charger controller | 3–5 W standby | Mains AC |

---

## Community-Level Power Summary

For a typical 100-flat Palm Meadows RWA deployment:

| Subsystem | Quantity | Unit Power | Total |
|---|---|---|---|
| Edge Gateways (1 per block × 4 blocks) | 4 | 18 W | 72 W |
| Smart Meters (all homes) | 100 | 5 W | 500 W |
| BMS aux supplies (solar homes, ≈60%) | 60 | 4 W | 240 W |
| **Community Hardware Total** | | | **≈ 812 W (< 1 kW)** |

> **Note**: This is the hardware management/communication overhead — not the managed energy flow (which is measured in kW per home).

---

## Power Resilience Requirements

| Requirement | Target |
|---|---|
| Gateway uptime during grid outage | ≥ 30 minutes on UPS |
| Smart meter operation during outage | Continuous (self-powered) |
| BMS communication during outage | Continuous (battery-powered) |
| Edge-to-cloud connectivity during outage | Via cellular fallback (optional) |

### Cellular Fallback (Optional)

For high-reliability deployments, add a USB LTE modem to the Raspberry Pi:

| Parameter | Value |
|---|---|
| Modem | Huawei E3372h or SIM7600 HAT |
| Power | 5 V USB, ≈ 2 W |
| SIM | Community IoT SIM (Airtel/Jio M2M plan) |
| Failover | Auto-switch when Ethernet link drops |
| Data Usage | ≈ 50 MB/day per gateway (telemetry only) |

Configure in `/etc/network/interfaces` using `metric` priority routing:
- Ethernet: metric 100 (preferred)
- LTE USB: metric 200 (fallback)

---

## Safety: Electrical Installation Requirements

1. **Separation**: All low-voltage (5 V / 12 V DC) gateway equipment must be installed in a segregated compartment away from mains AC wiring.
2. **Fusing**: Each DC supply output must be individually fused (1 A for 5 V rail, 2 A for 12 V rail).
3. **Earthing**: Equipment chassis must be bonded to building earth.
4. **IP Rating**: Enclosure must be IP20 minimum; IP54 if installed in outdoor or damp locations.
5. **Compliance**: All electrical installations must comply with IS 732 (Indian Standard for electrical wiring) and local DISCOM regulations.
