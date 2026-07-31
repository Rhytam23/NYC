# Edge Gateway Firmware Scaffold

> Production firmware is not yet implemented. This scaffold defines the project structure and key module interfaces.

## Project Structure (planned)

```
edge-gateway/
├── package.json
├── tsconfig.json
├── index.ts                     # Service entry point (starts all daemons)
├── config.ts                    # Configuration loader (config.json + env vars)
├── modbus/
│   ├── poller.ts                # Modbus polling scheduler
│   ├── parser.ts                # Register → HardwareTelemetry parsing
│   └── register-maps/           # Per-device register map definitions
│       ├── genus-meter.ts       # Genus DLMS meter registers
│       ├── lt-em6400.ts         # L&T EM6400NG registers
│       ├── sunspec-model101.ts  # SunSpec inverter single-phase
│       └── pylon-bms.ts        # PYLON US2000 BMS registers
├── mqtt/
│   ├── broker.ts                # Mosquitto connection manager
│   ├── publisher.ts             # Publish telemetry, alerts, heartbeat
│   └── subscriber.ts           # Subscribe to dispatch commands
├── cloud/
│   ├── bridge.ts                # HTTP POST to /api/v1/hardware/telemetry
│   └── auth.ts                  # Hardware JWT generation and refresh
├── buffer/
│   └── sqlite-queue.ts          # Local SQLite offline buffer
├── health/
│   └── watchdog.ts              # Systemd watchdog notification
└── tests/
    ├── modbus-parser.test.ts    # Unit tests for register parsing
    └── mqtt-payload.test.ts     # Unit tests for MQTT payload schema
```

## Key Interfaces

### Modbus Device Config

```typescript
interface ModbusDeviceConfig {
  address: number;          // Modbus slave address (1–247)
  device_type: "SMART_METER" | "BMS" | "INVERTER";
  home_id: string;          // CEE-AI home UUID
  register_map: RegisterMap; // From register-maps/
  poll_fast_seconds: number; // SOC polling interval
  poll_slow_seconds: number; // Energy counter polling interval
}
```

### HardwareReading (published to MQTT)

```typescript
interface HardwareReading {
  home_id: string;
  timestamp: string;       // ISO 8601
  solar_gen_kw: number;
  battery_soc_pct: number;
  battery_flow_kw: number;
  home_demand_kw: number;
  grid_import_kw: number;
  grid_export_kw: number;
  grid_voltage_v: number;
  grid_status: "NORMAL" | "OUTAGE_DG_ACTIVE" | "CYCLONE_ALERT";
  device_health: {
    meter_online: boolean;
    inverter_online: boolean;
    bms_online: boolean;
    bms_fault_code: number;
    temperature_c: number;
  };
}
```

## Deployment

```bash
# Raspberry Pi deployment (manual)
scp -r edge-gateway/ pi@192.168.1.100:/opt/cee-edge-agent/
ssh pi@192.168.1.100
cd /opt/cee-edge-agent
npm install --production
sudo systemctl restart cee-edge-agent

# Ansible playbook (automated — future)
ansible-playbook -i inventory/palm-meadows.ini deploy-edge.yml
```
