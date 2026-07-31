# Edge-to-Cloud API Contract

This document defines the REST API contract between the CEE-AI edge gateway and the CEE-AI cloud platform.

All edge requests are authenticated using a pre-provisioned Hardware JWT (Bearer token).

Base URL: `https://cee-ai.vercel.app/api/v1/hardware`

---

## Authentication

All hardware API endpoints require a `Hardware JWT` in the `Authorization` header:

```
Authorization: Bearer <HARDWARE_EDGE_JWT>
```

The JWT payload:

```json
{
  "sub": "gw-block-a",
  "community_id": "c7a81023-98ab-4123-bcde-890123456789",
  "gateway_id": "gw-block-a",
  "iat": 1722441600,
  "exp": 1722528000
}
```

JWT is signed with `HARDWARE_EDGE_JWT_SECRET` (same secret on edge and cloud).

---

## POST /api/v1/hardware/telemetry

Push a batch of telemetry readings from one or more homes.

### Request

```http
POST /api/v1/hardware/telemetry
Content-Type: application/json
Authorization: Bearer <hardware_jwt>
```

```json
{
  "gateway_id": "gw-block-a",
  "community_id": "c7a81023-98ab-4123-bcde-890123456789",
  "batch_timestamp": "2026-07-31T16:30:00.000Z",
  "readings": [
    {
      "home_id": "home-rajesh-v104",
      "timestamp": "2026-07-31T16:30:00.000Z",
      "telemetry_source": "MQTT_EDGE",
      "solar_gen_kw": 5.82,
      "battery_soc_pct": 78.5,
      "battery_flow_kw": 1.20,
      "home_demand_kw": 2.40,
      "grid_import_kw": 0.0,
      "grid_export_kw": 2.22,
      "grid_voltage_v": 232.4,
      "grid_status": "NORMAL",
      "hardware_device_id": "dev-meter-v104"
    }
  ]
}
```

### Response (201 Created)

```json
{
  "status": "success",
  "data": {
    "accepted": 1,
    "rejected": 0,
    "pending_commands": [
      {
        "home_id": "home-rajesh-v104",
        "command_id": "cmd-abc123",
        "target_action": "CHARGE",
        "power_kw": 3.5,
        "reasoning_audit_string": "Storm prep: force charging to 100% SOC"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-31T16:30:01.000Z",
    "request_id": "req-xyz789"
  }
}
```

### Validation Rules

- `home_id` must exist in the `homes` table
- `battery_soc_pct` must be 0–100
- `grid_voltage_v` must be 0–500
- All `_kw` fields must be ≥ 0 (except `battery_flow_kw` which can be negative = discharge)
- `timestamp` must be within ±5 minutes of server time (prevents replay attacks)

---

## GET /api/v1/hardware/status

Query pending dispatch commands and gateway configuration.

### Request

```http
GET /api/v1/hardware/status
Authorization: Bearer <hardware_jwt>
```

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "gateway_id": "gw-block-a",
    "community_id": "c7a81023-98ab-4123-bcde-890123456789",
    "server_time": "2026-07-31T16:30:00.000Z",
    "hardware_mode": "MQTT_EDGE",
    "pending_commands": [],
    "poll_interval_seconds": 15,
    "config": {
      "staleness_ttl_seconds": 300,
      "modbus_poll_fast_seconds": 5,
      "modbus_poll_slow_seconds": 60
    }
  },
  "meta": {
    "timestamp": "2026-07-31T16:30:00.000Z",
    "request_id": "req-abc456"
  }
}
```

---

## POST /api/v1/hardware/heartbeat

Gateway health ping — confirms the gateway is alive and reports device counts.

### Request

```http
POST /api/v1/hardware/heartbeat
Content-Type: application/json
Authorization: Bearer <hardware_jwt>
```

```json
{
  "gateway_id": "gw-block-a",
  "community_id": "c7a81023-98ab-4123-bcde-890123456789",
  "timestamp": "2026-07-31T16:30:00.000Z",
  "uptime_seconds": 86400,
  "firmware_version": "1.2.3",
  "modbus_devices_online": 12,
  "modbus_devices_total": 14,
  "mqtt_reconnects": 0,
  "local_buffer_records": 0,
  "temperature_c": 38.2
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "acknowledged": true,
    "server_time": "2026-07-31T16:30:01.000Z"
  },
  "meta": {
    "timestamp": "2026-07-31T16:30:01.000Z",
    "request_id": "req-hb001"
  }
}
```

---

## GET /api/v1/hardware/devices

List all registered hardware devices for a community. Requires user session auth (not hardware JWT).

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "devices": [
      {
        "id": "dev-gw-block-a",
        "device_type": "EDGE_GATEWAY",
        "label": "Block A Gateway",
        "home_id": null,
        "gateway_id": "gw-block-a",
        "status": "ONLINE",
        "firmware_version": "1.2.3",
        "last_seen_at": "2026-07-31T16:30:00.000Z"
      },
      {
        "id": "dev-meter-v104",
        "device_type": "SMART_METER",
        "label": "Meter — Flat V-104",
        "home_id": "home-rajesh-v104",
        "gateway_id": "gw-block-a",
        "status": "ONLINE",
        "firmware_version": null,
        "last_seen_at": "2026-07-31T16:30:00.000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-31T16:30:00.000Z",
    "request_id": "req-dev001"
  }
}
```

---

## POST /api/v1/hardware/dispatch

Manually trigger a dispatch command to a specific home. Requires `RWA_ADMIN` or `PLATFORM_ADMIN` role.

### Request

```http
POST /api/v1/hardware/dispatch
Content-Type: application/json
Authorization: Bearer <user_session_jwt>
```

```json
{
  "home_id": "home-rajesh-v104",
  "target_action": "CHARGE",
  "power_kw": 3.5,
  "reasoning_audit_string": "Manual override: pre-charging before scheduled maintenance."
}
```

### Response (202 Accepted)

```json
{
  "status": "success",
  "data": {
    "command_id": "cmd-manual-001",
    "home_id": "home-rajesh-v104",
    "queued_at": "2026-07-31T16:30:00.000Z",
    "delivery_method": "MQTT"
  },
  "meta": {
    "timestamp": "2026-07-31T16:30:00.000Z",
    "request_id": "req-disp001"
  }
}
```

---

## Error Responses

All hardware endpoints return standard CEE-AI error format:

```json
{
  "status": "error",
  "error": {
    "code": "HARDWARE_AUTH_INVALID",
    "message": "Hardware JWT is expired or invalid.",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-07-31T16:30:00.000Z",
    "request_id": "req-err001"
  }
}
```

### Hardware-Specific Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `HARDWARE_AUTH_INVALID` | 401 | JWT missing, expired, or invalid signature |
| `HARDWARE_COMMUNITY_MISMATCH` | 403 | Gateway's community_id doesn't match request |
| `HARDWARE_HOME_NOT_FOUND` | 404 | home_id doesn't exist in this community |
| `HARDWARE_READING_TOO_OLD` | 400 | Timestamp outside ±5-minute window |
| `HARDWARE_VALIDATION_FAILED` | 400 | Reading value out of physical range |
| `DISPATCH_SAFETY_BLOCKED` | 422 | Command would violate safety constraint (SOC floor, max_export_kw) |
