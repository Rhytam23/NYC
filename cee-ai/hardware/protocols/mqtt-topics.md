# MQTT Topic Schema — CEE-AI Hardware Layer

This document defines all MQTT topics used in the CEE-AI edge-to-cloud communication system.

---

## Topic Structure Convention

```
cee/{community_id}/{entity_id}/{message_type}
```

| Segment | Description |
|---|---|
| `cee` | Static prefix for all CEE-AI topics |
| `{community_id}` | UUID of the RWA community (matches `Community.id`) |
| `{entity_id}` | Either `home_id` (for telemetry) or `gateway_id` (for gateway events) |
| `{message_type}` | The type of message (see below) |

---

## Topic Definitions

### 1. Telemetry (Edge → Cloud)

**Topic**: `cee/{community_id}/{home_id}/telemetry`  
**Direction**: Edge Gateway → CEE-AI Cloud  
**QoS**: 1 (at-least-once)  
**Retain**: No  

**Payload** (JSON):

```json
{
  "schema_version": "1.0",
  "gateway_id": "gw-block-a",
  "home_id": "home-rajesh-v104",
  "timestamp": "2026-07-31T16:30:00.000Z",
  "telemetry_source": "MQTT_EDGE",
  "readings": {
    "solar_gen_kw": 5.82,
    "battery_soc_pct": 78.5,
    "battery_flow_kw": 1.20,
    "home_demand_kw": 2.40,
    "grid_import_kw": 0.0,
    "grid_export_kw": 2.22,
    "grid_voltage_v": 232.4,
    "power_factor": 0.97,
    "grid_status": "NORMAL"
  },
  "device_health": {
    "meter_online": true,
    "inverter_online": true,
    "bms_online": true,
    "bms_fault_code": 0,
    "temperature_c": 38.2
  }
}
```

### 2. Dispatch Command (Cloud → Edge)

**Topic**: `cee/{community_id}/{home_id}/dispatch`  
**Direction**: CEE-AI Cloud → Edge Gateway  
**QoS**: 2 (exactly-once)  
**Retain**: No  

**Payload** (JSON):

```json
{
  "schema_version": "1.0",
  "command_id": "cmd-abc12345",
  "home_id": "home-rajesh-v104",
  "issued_at": "2026-07-31T16:30:15.000Z",
  "expires_at": "2026-07-31T16:31:15.000Z",
  "target_action": "CHARGE",
  "power_kw": 3.5,
  "reasoning_audit_string": "Storm preparation: force charging to 100% SOC. Outage risk: 72%."
}
```

**`target_action` values**:

| Value | Meaning |
|---|---|
| `CHARGE` | Charge battery at `power_kw` rate |
| `DISCHARGE` | Discharge battery at `power_kw` rate |
| `CURTAIL` | Limit inverter export to `power_kw` |
| `IDLE` | No active command; resume default behavior |

### 3. Gateway Heartbeat (Edge → Cloud)

**Topic**: `cee/{community_id}/{gateway_id}/heartbeat`  
**Direction**: Edge Gateway → CEE-AI Cloud  
**QoS**: 0 (fire-and-forget)  
**Retain**: No  
**Frequency**: Every 60 seconds  

**Payload** (JSON):

```json
{
  "schema_version": "1.0",
  "gateway_id": "gw-block-a",
  "community_id": "c7a81023-98ab-4123-bcde-890123456789",
  "timestamp": "2026-07-31T16:30:00.000Z",
  "uptime_seconds": 86400,
  "firmware_version": "1.2.3",
  "modbus_devices_online": 12,
  "modbus_devices_total": 14,
  "mqtt_reconnects": 0,
  "local_buffer_records": 0
}
```

### 4. Alert (Edge → Cloud)

**Topic**: `cee/{community_id}/{gateway_id}/alert`  
**Direction**: Edge Gateway → CEE-AI Cloud  
**QoS**: 1  
**Retain**: No  

**Payload** (JSON):

```json
{
  "schema_version": "1.0",
  "alert_id": "alert-xyz789",
  "gateway_id": "gw-block-a",
  "timestamp": "2026-07-31T16:30:00.000Z",
  "severity": "WARNING",
  "code": "DEVICE_OFFLINE",
  "device_type": "SMART_METER",
  "device_modbus_address": 3,
  "home_id": "home-nair-c201",
  "message": "Smart meter at Modbus address 3 (Flat C-201) offline for > 5 minutes."
}
```

**`severity` values**: `INFO` | `WARNING` | `ERROR` | `CRITICAL`

**`code` values**:

| Code | Description |
|---|---|
| `DEVICE_OFFLINE` | Modbus device not responding |
| `BMS_FAULT` | Battery BMS reported non-zero fault code |
| `BMS_OVERTEMP` | Battery temperature exceeded threshold |
| `VOLTAGE_SAG` | Grid voltage < 200 V detected |
| `TAMPER_DETECTED` | Meter tamper flag set |
| `CLOUD_DISCONNECTED` | Edge cannot reach CEE-AI cloud |
| `DISPATCH_FAILED` | Dispatch command could not be executed |
| `BUFFER_FULL` | Local SQLite buffer reaching capacity |

### 5. Command Acknowledgment (Edge → Cloud)

**Topic**: `cee/{community_id}/{home_id}/dispatch/ack`  
**Direction**: Edge Gateway → CEE-AI Cloud  
**QoS**: 1  

**Payload** (JSON):

```json
{
  "command_id": "cmd-abc12345",
  "home_id": "home-rajesh-v104",
  "status": "EXECUTED",
  "executed_at": "2026-07-31T16:30:16.200Z",
  "actual_power_kw": 3.47,
  "message": "Modbus write register 0x28 = 347 (3.47 kW charge) — SUCCESS"
}
```

**`status` values**: `EXECUTED` | `FAILED` | `EXPIRED` | `REJECTED`

---

## Topic Access Control (Mosquitto ACL)

```acl
# /etc/mosquitto/acl

# Gateway gw-block-a: publish telemetry and alerts, subscribe to dispatch
user gw-block-a
topic write cee/c7a81023-+/+/telemetry
topic write cee/c7a81023-+/gw-block-a/heartbeat
topic write cee/c7a81023-+/gw-block-a/alert
topic write cee/c7a81023-+/+/dispatch/ack
topic read  cee/c7a81023-+/+/dispatch

# Cloud consumer service: subscribe to all, publish dispatch
user cee-cloud
topic read  cee/#
topic write cee/+/+/dispatch
```

---

## Retained Topics (Dashboard Status)

The following topics use MQTT retain flag for immediate status on subscribe:

| Topic | Retained | Purpose |
|---|---|---|
| `cee/+/+/telemetry` | No | Too frequent; not retained |
| `cee/+/{gw_id}/heartbeat` | Yes | Last-known gateway health on reconnect |
| `cee/+/{gw_id}/alert` | No | Alerts delivered once |
