# CEE-AI Hardware Safety & Failure Modes

This document specifies all known failure modes, safety hazards, and mitigations for the CEE-AI hardware layer. It is mandatory reading before any hardware installation or maintenance work.

---

## ⚠️ Electrical Safety (HIGH VOLTAGE WARNING)

> **DANGER**: Smart energy meters, solar inverters, and battery systems operate at voltages that are LETHAL. Only licensed electricians with appropriate PPE should install or service these components. CEE-AI software personnel must NEVER open meter enclosures or touch inverter terminals without isolation.

### High-Voltage Isolation Protocol

1. **Isolate mains supply** at the main circuit breaker before any work on meters or inverters.
2. **Verify isolation** using a calibrated multimeter before touching any conductors.
3. **Lock-out / Tag-out** the isolation switch.
4. **Solar string isolation**: Solar DC strings may remain live even after AC grid isolation. Use dedicated DC string isolators before any inverter work.
5. **Battery isolation**: Disconnect battery isolator (positive terminal first, then negative) before working on BESS connections.

---

## Failure Mode Analysis

### 1. Edge Gateway (Raspberry Pi 4)

| Failure Mode | Cause | Symptom | Detection | Mitigation |
|---|---|---|---|---|
| OS crash / kernel panic | SD card corruption, power brownout | Gateway offline; no MQTT heartbeat | `HardwareHealthLog` gap > 2 min | Hardware watchdog (`sudo raspi-config` → Enable watchdog); read-only rootfs |
| Network outage (Ethernet) | ISP failure, switch failure | MQTT publish errors | Cloud API logs no heartbeat | LTE USB modem failover (optional); local SQLite buffer |
| RS-485 bus short | Miswired device, damaged cable | All Modbus polls timeout | `DEVICE_OFFLINE` for all meters | Bus fuse; per-device address timeout |
| Memory exhaustion | Log buffer overflow, leak | OOM killer terminates agent | Process monitor alert | Restart policy in systemd unit; log rotation |
| Time drift | No NTP sync | Wrong timestamps on readings | TimescaleDB rejects future timestamps | NTP forced on startup; RTC module (DS3231) on Pi |

### 2. Smart Energy Meter

| Failure Mode | Cause | Symptom | Detection | Mitigation |
|---|---|---|---|---|
| Meter offline | RS-485 cable break, power loss | No readings from home | `DEVICE_OFFLINE` in HAL | Alert to RWA admin; HAL falls back to cloud API |
| Tamper detection | Physical tamper with CT clamp | Tamper flag set in Modbus register 0x14 | HAL checks tamper register | Alert logged to `AuditLog`; notify DISCOM |
| CT clamp open-circuit | Loose CT connection | Erroneously high current reading | Meter firmware tamper flag | Physical CT inspection by electrician |
| Clock drift | Battery drain | Timestamps off by seconds/minutes | DB anomaly detection | Gateway syncs meter clock via Modbus write |
| Communication errors | Line noise, baud rate mismatch | CRC errors in Modbus frames | Frame error counter in gateway | Reduce baud to 4,800; add line filters |

### 3. Solar Inverter

| Failure Mode | Cause | Symptom | Detection | Mitigation |
|---|---|---|---|---|
| Anti-islanding trip | Grid outage (expected behavior) | `solar_gen_kw = 0`, inverter offline | Inverter status register | Expected; AI switches to battery routing |
| Overtemperature shutdown | High ambient, blocked vents | Inverter offline alarm | Inverter fault register | Physical ventilation check; shadow analysis |
| DC arc fault | Degraded PV string wiring | AFCI trip alarm | AFCI alarm in inverter | Urgent — fire risk; inspect PV strings |
| Cloud API timeout | Internet outage, API rate limit | No cloud telemetry | HAL `CLOUD_TIMEOUT` | HAL falls back to local Modbus |
| Firmware update in progress | OEM-initiated update | Inverter temporarily offline | `is_active = false` | Short-duration; no action needed |

### 4. Battery BMS

| Failure Mode | Cause | Symptom | Detection | Mitigation |
|---|---|---|---|---|
| Over-temperature | Cell degradation, overcharge | BMS thermal fault code | `bms_fault_code != 0` | **Immediately halt all charge commands**; CEE-AI excludes battery from dispatch |
| Cell over-voltage | Charging fault | BMS disconnects | `battery_soc_pct` drops suddenly | BMS hardware protection (independent of software) |
| Cell under-voltage | Deep discharge | BMS disconnects | `battery_soc_pct < 10%` + disconnect | SOC floor enforcement in emergency-prioritization.ts |
| BMS comms loss | RS-485 fault | `battery_soc_pct` stale | HAL stale timestamp check | After 5 min stale: exclude battery from routing; alert admin |
| Swelling / venting | Cell failure | Physical deformation visible | Visual inspection only | **Evacuate area**; call battery vendor; do not use water |

### 5. EV Charger

| Failure Mode | Cause | Symptom | Detection | Mitigation |
|---|---|---|---|---|
| OCPP connection lost | Wi-Fi / network issue | Charger reverts to default profile | No OCPP heartbeat | Alert; physical CB is the backup shedding mechanism |
| Charger hardware fault | Internal fault | OCPP `Faulted` status | OCPP `StatusNotification` | Alert to resident; no dispatch impact if already shed |
| RCD trip | Ground fault | Charger offline | OCPP offline | Physical inspection; do not reset RCD without investigating cause |

---

## Software-Side Safety Guards

The following safety constraints are enforced in CEE-AI software and must NEVER be overridden:

| Guard | Code Location | Rule |
|---|---|---|
| Tier-0 SOC floor | `emergency-prioritization.ts` | SOC floor ≥ 30% for medical-tier homes; `shed_load = false` always |
| BMS charge rate limit | `hardware/hal.ts` | `power_kw` in dispatch commands capped to `max_charge_kw` from BMS |
| Stale data exclusion | `hardware/hal.ts` | Readings older than 5 minutes excluded from routing calculations |
| Dispatch debounce | Decision engine | No repeated commands to same inverter within `COMMAND_DEBOUNCE_WINDOW_SECONDS` (default 60s) |
| Anti-islanding respect | Energy routing | `DISCHARGE` commands to inverters only when `grid_status === "OUTAGE_DG_ACTIVE"` (local battery) |
| Max export limit | `Inverter.max_export_kw` | Dispatch `power_kw` never exceeds inverter's registered `max_export_kw` |

---

## Emergency Contacts & Escalation

In case of hardware emergency:

| Severity | Action |
|---|---|
| **Fire / Smoke from battery or inverter** | Evacuate. Do NOT use water. Call fire brigade. Use CO₂ or dry powder extinguisher only. |
| **Electric shock** | Do NOT touch victim. Turn off main CB. Call emergency services. |
| **BMS over-temperature alarm** | Notify RWA admin immediately. Suspend all charge commands via Emergency Command Center. |
| **Gateway offline > 30 min** | RWA admin physical check of gateway enclosure. |
| **All meters offline simultaneously** | Check RS-485 bus fuse. Check USB-RS485 adapter. |

---

## Maintenance Schedule

| Interval | Task |
|---|---|
| Monthly | Gateway log review, SD card health check (`df -h`, `dmesg \| grep error`) |
| Quarterly | RS-485 bus cable visual inspection; terminal tightness check |
| Annually | SD card replacement on gateway; UPS battery capacity test |
| As needed | Inverter filter cleaning; BESS thermal inspection |
