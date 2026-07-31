# CEE-AI Hardware Integration Guide

This guide explains how physical hardware integrates with the CEE-AI software stack, covering the Hardware Abstraction Layer (HAL), environment configuration, API contracts, and the simulation-to-hardware upgrade path.

---

## Architecture Overview

```
Physical Hardware
    │
    │ Modbus RTU (RS-485)
    ▼
Edge Gateway (Raspberry Pi 4)
    │
    │ MQTT over TLS  +  REST API
    ▼
CEE-AI Cloud Platform (Next.js / Vercel)
    │
    │ Hardware Abstraction Layer (HAL)
    │ src/lib/hardware/hal.ts
    ▼
AI Decision Engine + API Routes
```

The **Hardware Abstraction Layer (HAL)** at `src/lib/hardware/hal.ts` is the single integration point between physical hardware and the CEE-AI software. It:

1. **Automatically selects the data source** (MQTT edge → Cloud API → Simulated)
2. **Normalizes all readings** to the standard `HardwareTelemetry` type
3. **Validates readings** against physical constraints (SOC range, power limits)
4. **Caches the last known good reading** with a configurable staleness TTL
5. **Emits hardware health events** to the `HardwareHealthLog` table

---

## HAL Data Source Priority

```
┌─────────────────────────────────────────────────────────┐
│              HAL Source Selection Logic                   │
│                                                           │
│   Is MQTT_EDGE adapter online?                           │
│   └─ YES → Use MQTT_EDGE readings (freshest data)        │
│   └─ NO  →                                               │
│       Is CLOUD_API available (Enphase/SolarEdge)?        │
│       └─ YES → Use CLOUD_API readings (5-min delay)       │
│       └─ NO  → Use SIMULATED readings (mock-store)        │
└─────────────────────────────────────────────────────────┘
```

The HAL exposes a `getTelemetrySource()` method that returns the active source. The decision engine uses this to tag all `EnergyTelemetry` records with the correct `telemetry_source` enum value.

---

## Setting Up the HAL

### Environment Variables

Add these to `.env` (see `.env.example` for the full list):

```bash
# Hardware layer mode: "simulated" | "mqtt_edge" | "cloud_api"
HARDWARE_MODE=simulated

# MQTT broker settings (required when HARDWARE_MODE=mqtt_edge)
MQTT_BROKER_URL=mqtts://gateway.palmmeadows.local:8883
MQTT_CLIENT_ID=cee-cloud-consumer
MQTT_USERNAME=cee-cloud
MQTT_PASSWORD=<strong-password>
MQTT_CA_CERT_PATH=/etc/cee-ai/mqtt-ca.crt

# JWT secret for edge gateway authentication
HARDWARE_EDGE_JWT_SECRET=<min-64-char-random-secret>

# Staleness TTL: treat readings older than this as stale (seconds)
HARDWARE_STALENESS_TTL_SECONDS=300
```

### HAL Import

```typescript
import { hal } from "@/lib/hardware/hal";

// Get current telemetry for a home
const telemetry = await hal.getLatestTelemetry(homeId);

// Get hardware source in use
const source = hal.getTelemetrySource(); // "MQTT_EDGE" | "CLOUD_API" | "SIMULATED"

// Send dispatch command to physical hardware
await hal.sendDispatchCommand({
  home_id: homeId,
  target_action: "CHARGE",
  power_kw: 3.5,
  reasoning_audit_string: "Storm preparation: force charging to 100% SOC",
});
```

---

## Edge Gateway Setup

### 1. Install the OS

```bash
# On your dev machine, flash Raspberry Pi OS Lite (64-bit) to SD card
# Use Raspberry Pi Imager or balenaEtcher

# SSH into the Pi and update:
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm mosquitto mosquitto-clients
```

### 2. Install cee-edge-agent

```bash
# Clone the firmware project
git clone https://github.com/your-org/cee-edge-agent.git
cd cee-edge-agent
npm install

# Configure
cp config.example.json config.json
# Edit config.json with:
#   community_id, gateway_id, modbus_port, mqtt_broker_url
#   home_address_map (modbus address → home_id mapping)
#   hardware_jwt (pre-provisioned from CEE-AI admin panel)

# Install as systemd service
sudo cp cee-edge-agent.service /etc/systemd/system/
sudo systemctl enable cee-edge-agent
sudo systemctl start cee-edge-agent
```

### 3. Verify Modbus Communication

```bash
# Install modbus-cli test tool
npm install -g modbus-cli

# Test reading from meter at address 0x01
modbus read -t 4 -a 1 -c 10 /dev/ttyUSB0
```

### 4. Verify MQTT Telemetry

```bash
# Subscribe to telemetry topic on the Pi
mosquitto_sub -h localhost -t "cee/+/+/telemetry" -v
```

You should see JSON payloads every 10 seconds.

---

## Provisioning a New Gateway

From the CEE-AI RWA Admin panel (or via API):

1. Navigate to **Settings → Hardware → Add Gateway**
2. Enter: `Community ID`, `Block ID`, `Gateway MAC address`
3. Download the pre-configured `config.json` with embedded JWT
4. Copy config to the Pi and restart the agent

The gateway will appear in `HardwareDevice` table with status `PROVISIONING` → `ONLINE` after first heartbeat.

---

## Simulation Mode (Development)

When `HARDWARE_MODE=simulated`, the HAL uses `src/lib/mock-store.ts` data as if it were real hardware readings. This is the default for development.

**Simulation behavior:**
- All readings return `telemetry_source: "SIMULATED"`
- `runtimeState.telemetry` in mock-store provides per-home values
- Dispatch commands are logged but not transmitted anywhere
- `HardwareDevice` table shows all devices as `SIMULATED`

**To switch between modes without redeployment:**

```bash
# On Vercel: change HARDWARE_MODE environment variable
# Locally: update .env and restart dev server
```

---

## Upgrading from Simulation to Real Hardware

When a community deploys physical hardware:

1. **Provision meters and inverters** (electrician)
2. **Install edge gateway** (see Edge Gateway Setup above)
3. **Set `HARDWARE_MODE=mqtt_edge`** in Vercel environment variables
4. **Verify telemetry appears** in `EnergyTelemetry` with `source=MQTT_EDGE`
5. **Run side-by-side validation** for 24 hours:
   - Compare MQTT readings vs cloud API readings
   - Acceptable delta: ≤ 2% for energy readings
6. **Disable cloud API fallback** once confidence is established (optional)

---

## API Endpoints for Hardware Integration

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/v1/hardware/telemetry` | Hardware JWT | Edge pushes batch telemetry readings |
| `GET /api/v1/hardware/status` | Hardware JWT | Edge polls for pending dispatch commands |
| `POST /api/v1/hardware/heartbeat` | Hardware JWT | Gateway health ping (every 60 s) |
| `GET /api/v1/hardware/devices` | User session | List registered hardware devices |
| `POST /api/v1/hardware/dispatch` | User session (Admin) | Manually trigger dispatch command |

Full API contract: [`../protocols/api-contract.md`](../protocols/api-contract.md)

---

## Telemetry Source Transparency

Every `EnergyTelemetry` record is tagged with its source for auditability:

| Source | Meaning |
|---|---|
| `MQTT_EDGE` | From physical hardware via edge gateway |
| `CLOUD_API` | From inverter cloud API (Enphase, SolarEdge, GoodWe) |
| `SIMULATED` | From mock-store (development / demo mode) |
| `MANUAL` | Manually entered by RWA admin (rare override) |

The CEE-AI dashboard displays the active source with a colored status badge so residents and admins always know what their data is based on.
