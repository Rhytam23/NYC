# CEE-AI Hardware Test Plans

This directory contains hardware acceptance test plans and verification procedures.

---

## Test Categories

### 1. Unit Tests (Software HAL)

Run with: `npm run typecheck && npm run lint src`

| Test | File | What it checks |
|---|---|---|
| HAL source selection | `src/lib/hardware/hal.test.ts` | Correct fallback priority (MQTT → Cloud → Simulated) |
| Simulated adapter readings | `src/lib/hardware/adapters/simulated-adapter.test.ts` | Readings within physical range |
| Hardware types | `src/lib/hardware/types.ts` | TypeScript compilation |
| Hardware API route validation | `src/app/api/v1/hardware/telemetry/route.test.ts` | Zod schema validation |

### 2. Integration Tests (Simulation Mode)

Run against local dev server (`npm run dev`):

```bash
# Test 1: Telemetry ingest
curl -s -X POST http://localhost:3000/api/v1/hardware/telemetry \
  -H "Authorization: Bearer $TEST_HARDWARE_JWT" \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/batch-telemetry.json | jq .status

# Test 2: Heartbeat
curl -s -X POST http://localhost:3000/api/v1/hardware/heartbeat \
  -H "Authorization: Bearer $TEST_HARDWARE_JWT" \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/heartbeat.json | jq .status

# Test 3: Device list
curl -s http://localhost:3000/api/v1/hardware/devices \
  -H "Cookie: <session-cookie>" | jq '.data.devices | length'
```

### 3. Acceptance Tests (Physical Hardware — Pre-Deployment)

Run before approving any gateway for production use:

#### AT-001: Modbus Communication

| Step | Expected Result |
|---|---|
| Connect USB-RS485 to gateway Pi | Device appears at `/dev/ttyUSB0` |
| Run `modbus-cli read -a 1 -t 4 -c 10 /dev/ttyUSB0` | Returns 10 register values |
| Verify voltage reading (0x000A) | Within 5% of reference multimeter |
| Verify power reading (0x0000) | Within 2% of reference clamp meter |

#### AT-002: MQTT Telemetry Flow

| Step | Expected Result |
|---|---|
| Start cee-edge-agent | systemd reports `active (running)` |
| Subscribe: `mosquitto_sub -t "cee/#" -v` | Telemetry JSON appears every 10 seconds |
| Verify payload schema | All required fields present and in range |
| Verify gateway heartbeat topic | Heartbeat received every 60 seconds |

#### AT-003: Cloud Bridge

| Step | Expected Result |
|---|---|
| Configure gateway with production URL | config.json updated |
| Monitor cloud logs | Readings appear in EnergyTelemetry with `source=MQTT_EDGE` |
| Check device status on dashboard | Gateway shown as `ONLINE` |
| Introduce network outage (unplug Ethernet) | Gateway buffers readings locally |
| Restore network | Buffered readings replayed; no data gap in DB |

#### AT-004: Dispatch Command Round-Trip

| Step | Expected Result |
|---|---|
| POST `/api/v1/hardware/dispatch` with CHARGE 3.5 kW | 202 Accepted with `command_id` |
| Subscribe to `cee/+/+/dispatch` on gateway | Command received within 2 seconds |
| Gateway publishes ACK to `cee/+/+/dispatch/ack` | `status: "EXECUTED"` received |
| Verify BMS SOC begins increasing | SOC reading rises in subsequent telemetry |

#### AT-005: Safety Constraints

| Test | Expected Result |
|---|---|
| Send CHARGE command with `power_kw > max_charge_kw` | Rejected with `DISPATCH_SAFETY_BLOCKED` |
| Send DISCHARGE when SOC < Tier-0 floor (30%) | Rejected with `DISPATCH_SAFETY_BLOCKED` |
| Send command to Tier-0 home with `shed_load: true` | Rejected (Tier-0 never sheds) |

---

## Test Fixtures

Test fixture files are in `hardware/tests/fixtures/`:

- `batch-telemetry.json` — Sample telemetry batch payload
- `heartbeat.json` — Sample heartbeat payload
- `dispatch-charge.json` — Sample CHARGE command
- `dispatch-curtail.json` — Sample CURTAIL command

---

## Performance Benchmarks

| Metric | Target | Method |
|---|---|---|
| Modbus read latency | < 200 ms per device | `time modbus read ...` |
| MQTT publish latency | < 50 ms (local broker) | MQTT timestamp delta |
| Cloud API ingest latency | < 500 ms (p95) | Vercel function logs |
| Dispatch command round-trip | < 2 seconds end-to-end | Command issued → ACK received |
| Gateway memory usage | < 200 MB RSS | `pm2 status` or `free -h` |
| Offline buffer recovery | No data loss after 30-min outage | Controlled network outage test |
