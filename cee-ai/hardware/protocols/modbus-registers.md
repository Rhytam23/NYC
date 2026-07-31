# Modbus Register Map — CEE-AI Hardware Layer

This document defines the Modbus RTU register addresses for all devices in the CEE-AI hardware ecosystem. All registers are 16-bit unless noted. Floating-point values use two consecutive 16-bit registers (32-bit IEEE 754, big-endian word order).

---

## Smart Energy Meter — Genus DLMS / L&T EM6400NG

### Connection Parameters

| Parameter | Value |
|---|---|
| Protocol | Modbus RTU |
| Default Baud | 9,600 |
| Parity | None |
| Stop Bits | 1 |
| Default Address | 1 (configurable via front panel) |

### Input Registers (Function Code 04 — Read Only)

| Register | Address (Hex) | Description | Unit | Data Type | Scale |
|---|---|---|---|---|---|
| Active Power (total) | 0x0000 | Total active power (import − export) | W | INT32 | ×1 W |
| Active Power Phase A | 0x0002 | Phase A active power | W | INT32 | ×1 W |
| Active Power Phase B | 0x0004 | Phase B active power | W | INT32 | ×1 W |
| Active Power Phase C | 0x0006 | Phase C active power | W | INT32 | ×1 W |
| Reactive Power (total) | 0x0008 | Total reactive power | VAR | INT32 | ×1 VAR |
| Voltage Phase A | 0x000A | Phase A to neutral voltage | V | UINT16 | ×0.1 V |
| Voltage Phase B | 0x000B | Phase B to neutral voltage | V | UINT16 | ×0.1 V |
| Voltage Phase C | 0x000C | Phase C to neutral voltage | V | UINT16 | ×0.1 V |
| Current Phase A | 0x000D | Phase A current | A | UINT16 | ×0.01 A |
| Current Phase B | 0x000E | Phase B current | A | UINT16 | ×0.01 A |
| Current Phase C | 0x000F | Phase C current | A | UINT16 | ×0.01 A |
| Power Factor (total) | 0x0010 | Total power factor | — | INT16 | ×0.001 |
| Frequency | 0x0011 | Line frequency | Hz | UINT16 | ×0.01 Hz |
| Energy Import (kWh) | 0x0012 | Cumulative import energy | kWh | UINT32 | ×0.01 kWh |
| Energy Export (kWh) | 0x0014 | Cumulative export energy | kWh | UINT32 | ×0.01 kWh |
| Tamper Status | 0x0016 | 0 = OK, 1 = tampered | — | UINT16 | — |
| Meter Time (Unix) | 0x0018 | Epoch seconds | s | UINT32 | ×1 s |

### Derived Values (computed by edge agent, not direct registers)

| Computed Field | Formula | Maps to CEE-AI Field |
|---|---|---|
| `solar_gen_kw` | Solar CT Active Power / 1000 | `EnergyTelemetry.solar_gen_kw` |
| `home_demand_kw` | Load CT Active Power / 1000 | `EnergyTelemetry.home_demand_kw` |
| `grid_import_kw` | Max(0, Energy Import delta / interval) | `EnergyTelemetry.grid_import_kw` |
| `grid_export_kw` | Max(0, Energy Export delta / interval) | `EnergyTelemetry.grid_export_kw` |
| `grid_voltage_v` | Average of Phase A/B/C voltages | `WeatherTelemetry.gridVoltageSag` |

---

## Battery BMS — PYLON US2000 / Generic Modbus BMS

> Note: Register maps vary by BMS vendor. This register map is for PYLON US2000 series. For other vendors, update `hardware/firmware/edge-gateway/bms-register-maps/` accordingly.

### Connection Parameters

| Parameter | Value |
|---|---|
| Default Baud | 9,600 |
| Default Address | 2 (typically; PYLON = 0x02) |
| Protocol | Modbus RTU |

### Input Registers (FC04)

| Register | Address (Hex) | Description | Unit | Data Type | Scale |
|---|---|---|---|---|---|
| SOC | 0x0100 | State of charge | % | UINT16 | ×0.1% |
| SOH | 0x0101 | State of health | % | UINT16 | ×0.1% |
| Voltage | 0x0102 | Battery pack voltage | V | UINT16 | ×0.1 V |
| Current | 0x0103 | Pack current (+charge, −discharge) | A | INT16 | ×0.1 A |
| Temperature (avg) | 0x0104 | Average cell temperature | °C | INT16 | ×0.1 °C |
| Max Cell Temp | 0x0105 | Maximum cell temperature | °C | INT16 | ×0.1 °C |
| Charge Power Limit | 0x0106 | Max allowable charge power | W | UINT16 | ×1 W |
| Discharge Power Limit | 0x0107 | Max allowable discharge power | W | UINT16 | ×1 W |
| Fault Code | 0x0108 | 0 = OK; bitmask of active faults | — | UINT16 | — |
| Cycle Count | 0x0109 | Total charge cycles | — | UINT16 | — |
| Capacity (rated) | 0x010A | Rated capacity | Wh | UINT16 | ×10 Wh |
| Capacity (remaining) | 0x010B | Remaining usable capacity | Wh | UINT16 | ×10 Wh |

### Derived Values

| Computed Field | Formula | Maps to CEE-AI Field |
|---|---|---|
| `battery_soc_pct` | SOC register × 0.1 | `EnergyTelemetry.battery_soc_pct` |
| `battery_flow_kw` | (Voltage × Current) / 1000 | `EnergyTelemetry.battery_flow_kw` |
| `max_charge_kw` | Charge Power Limit / 1000 | HAL dispatch cap |
| `bms_fault_code` | Fault Code register | `HardwareHealthLog.details.bms_fault_code` |

---

## Solar Inverter — SunSpec Standard (Enphase / SolarEdge / GoodWe)

SunSpec is auto-discovered by reading the identifier block at register 40000.

### SunSpec Common Model (Model 1) — Starting at offset 0

| Register Offset | Description | Data Type |
|---|---|---|
| 0 | Manufacturer | String[32] (16 registers) |
| 16 | Model | String[32] (16 registers) |
| 40 | Serial number | String[32] (16 registers) |
| 56 | Device address | UINT16 |

### SunSpec Inverter Model 101 (Single Phase) — Starting at model start

| Register Offset | Description | Unit | Data Type | Scale |
|---|---|---|---|---|
| 0 | AC Total Power | W | INT16 | S_F |
| 1 | AC Frequency | Hz | UINT16 | S_F |
| 2 | AC Energy (total) | Wh | ACC32 | S_F |
| 6 | DC Power | W | INT16 | S_F |
| 8 | Temperature (cabinet) | °C | INT16 | S_F |
| 10 | Operating state | — | UINT16 | — |
| 11 | Vendor event flags | — | UINT16 | — |

**Operating State values**:

| Value | State |
|---|---|
| 1 | Off |
| 2 | Sleeping (auto-shutdown) |
| 3 | Starting |
| 4 | MPPT (normal operation) |
| 5 | Throttled |
| 6 | Shutting down |
| 7 | Fault |
| 8 | Standby |

### Holding Registers — Dispatch Commands (FC06 Write)

| Register | Description | Unit | Range |
|---|---|---|---|
| 0xF001 | Export limit (% of rated power) | % | 0–100 |
| 0xF002 | Active power setpoint | W | 0–nameplate kW × 1000 |

> **Note**: Write permission to dispatch registers requires OEM-specific authorization. SolarEdge requires the SetApp mode to be enabled. GoodWe requires the EcoMode API. Enphase IQ8 supports curtailment via Envoy local API.

---

## Address Assignment Table (Palm Meadows Example)

| Modbus Address | Device Type | Location |
|---|---|---|
| 0x01 | Smart Meter | Flat V-104 (Rajesh) |
| 0x02 | BMS | Flat V-104 (Rajesh) |
| 0x03 | Inverter (SunSpec) | Flat V-104 (Rajesh) |
| 0x04 | Smart Meter | Flat A-402 (Dr. Meenakshi) |
| 0x05 | Smart Meter | Flat C-201 (Col. Nair) |
| … | … | … |
