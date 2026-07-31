# CEE-AI Firmware — Overview

> ⚠️ **Scope Note**: This directory contains firmware **project scaffolds** and architecture documentation only. Production firmware code will be implemented in a dedicated firmware sprint once hardware is physically procured and validated. See the main project roadmap for the firmware milestone.

---

## Firmware Components

The CEE-AI edge hardware requires firmware on two primary computing platforms:

| Platform | Role | Language | Directory |
|---|---|---|---|
| Raspberry Pi 4B | Edge gateway (main agent) | Node.js 20 LTS + Python | `edge-gateway/` |
| ESP32 (optional) | Low-power sensor node / Modbus bridge | MicroPython or C (Arduino) | `smart-meter-reader/` |

---

## Edge Gateway (Raspberry Pi 4)

The edge gateway is the primary computing node. It is **not firmware in the traditional sense** — it runs a full Linux OS with userspace services.

### Architecture

```
Raspberry Pi OS Lite
├── systemd services
│   ├── cee-edge-agent.service      # Main polling + MQTT bridge
│   ├── mosquitto.service           # Local MQTT broker
│   └── cee-cloud-bridge.service   # Subscribes MQTT, POSTs to cloud API
├── /opt/cee-edge-agent/            # Node.js agent code
│   ├── index.js                    # Entry point
│   ├── modbus-poller.js            # Modbus RTU polling daemon
│   ├── mqtt-publisher.js           # MQTT publish logic
│   ├── cloud-bridge.js             # HTTP POST to CEE-AI REST API
│   ├── local-buffer.js             # SQLite buffer for offline queuing
│   └── config.json                 # Community/gateway config (provisioned)
└── /etc/mosquitto/
    ├── mosquitto.conf              # Broker config (TLS, ACL)
    └── certs/                      # TLS certificates
```

### Key Design Decisions

1. **Node.js 20 LTS** is chosen for familiarity with the rest of the CEE-AI codebase (TypeScript ecosystem)
2. **SQLite local buffer** — if MQTT or cloud is unreachable, readings are queued and replayed on reconnect (up to 10,000 records ≈ ~28 hours at 15-second intervals)
3. **Modbus polling** uses the `modbus-serial` npm package
4. **Systemd service** with `Restart=always` and `WatchdogSec=30s`
5. **Read-only root filesystem** with an overlay for the data partition — prevents SD card corruption

### Planned Implementation

When firmware development begins:
1. Port `hardware/firmware/edge-gateway/` to a full Node.js project
2. Generate `package.json` and `tsconfig.json`
3. Implement Modbus register reads per `hardware/protocols/modbus-registers.md`
4. Implement MQTT publish per `hardware/protocols/mqtt-topics.md`
5. Implement cloud bridge per `hardware/protocols/api-contract.md`
6. Write Jest unit tests for register parsing logic
7. Create Ansible playbook for automated deployment to Pi

---

## Smart Meter Reader (ESP32 — Optional)

An optional low-cost alternative for homes that cannot run a full Raspberry Pi. An ESP32 microcontroller reads one smart meter via Modbus and publishes over Wi-Fi MQTT.

### Capabilities

| Feature | Status |
|---|---|
| Modbus RTU read (RS-485 via MAX485 transceiver) | Planned |
| Wi-Fi MQTT publish | Planned |
| OTA firmware updates | Planned |
| Deep sleep between polls (battery operation) | Planned |
| Local display (OLED, optional) | Planned |

### Hardware Bill of Materials (per node)

| Component | Specification | Approx. Cost (INR) |
|---|---|---|
| ESP32-WROOM-32 | Dual-core 240 MHz, Wi-Fi + BT | ₹ 350 |
| MAX485 RS-485 transceiver | Half-duplex, 2.5 Mbps | ₹ 30 |
| 5V power supply (DIN) | 5V / 1A | ₹ 200 |
| PCB + enclosure | Custom or universal | ₹ 150 |
| **Total per node** | | **≈ ₹ 730** |

> vs. Raspberry Pi setup: ≈ ₹ 8,000 per block gateway (shared across 12+ homes, ≈ ₹ 667 per home amortized)

### Planned Implementation

When ESP32 firmware development begins:
1. Set up PlatformIO project in `hardware/firmware/smart-meter-reader/`
2. Use `ModbusMaster` library for RS-485 reads
3. Use `PubSubClient` for MQTT over TLS
4. Implement OTA via `ArduinoOTA`
5. Flash and test with physical Genus meter in lab
