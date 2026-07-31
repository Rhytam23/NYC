# CEE-AI Hardware Simulations

This directory contains simulation strategies and tools for testing CEE-AI hardware integration without physical hardware.

---

## Simulation Architecture

CEE-AI uses a layered simulation strategy that allows developers to test the full system without any physical hardware:

```
Layer 1 (Current): Mock Store
  └─ src/lib/mock-store.ts
  └─ Static preset data for Palm Meadows RWA
  └─ Used for UI demos and offline development

Layer 2 (HAL Simulated Adapter):
  └─ src/lib/hardware/adapters/simulated-adapter.ts
  └─ Wraps mock-store with realistic behavior:
       • Random noise on readings (±2%)
       • SOC discharge over time (0.3% per 15-min cycle)
       • Grid outage simulation mode
       • Weather event injection

Layer 3 (Hardware-in-the-Loop — Future):
  └─ Physical hardware connected to test bench
  └─ Standardized test profiles run against real devices
  └─ Automated regression testing
```

---

## Layer 2: HAL Simulated Adapter

The simulated adapter (`src/lib/hardware/adapters/simulated-adapter.ts`) provides a realistic simulation of hardware behavior:

### Simulated Behaviors

| Behavior | Implementation |
|---|---|
| Solar generation curve | Sinusoidal profile (peak at noon, zero at night) |
| Battery SOC drift | Decreases when demand > solar; increases when solar > demand |
| Grid voltage variation | Normally distributed around 230V (σ = 5V) |
| Random noise | ±2% Gaussian noise on all readings |
| Outage injection | `runtimeState.gridStatus === "OUTAGE_DG_ACTIVE"` triggers outage |
| BMS fault injection | Set `simulateBmsFault = true` in environment config |

### Using the Simulator

```typescript
import { hal } from "@/lib/hardware/hal";

// The HAL auto-selects SIMULATED when HARDWARE_MODE=simulated
const telemetry = await hal.getLatestTelemetry("home-rajesh-v104");
console.log(telemetry.source); // "SIMULATED"

// Inject a simulated outage
import { runtimeState } from "@/lib/mock-store";
runtimeState.gridStatus = "OUTAGE_DG_ACTIVE";

// Now all decision engine runs will use emergency triage mode
```

---

## Test Scenarios

### Scenario 1: Normal Day Operation

- Morning: SOC at 80%, solar ramps up, battery charges
- Noon: Peak solar (8 kW), exports 5 kW to community
- Afternoon: Battery at 95%, solar surplus continues
- Evening: Solar drops, battery begins discharge
- Night: Grid import, battery SOC decreases to reserve floor

### Scenario 2: Grid Outage During Peak Load

1. Set `gridStatus = "OUTAGE_DG_ACTIVE"`
2. Tier-3 EV chargers shed immediately
3. Tier-0 medical home receives priority battery routing
4. Monitor SOC floors — Tier-0 must stay ≥ 30%
5. Autonomous survival clock counts down

### Scenario 3: Cyclone Alert (Force Charge)

1. Set `weather.alertLevel = "RED"`
2. P(Outage) calculates to > 0.70
3. Decision engine issues FORCE_CHARGE to all homes
4. Battery charges to 100% SOC despite normal conditions
5. Grid export curtailed

### Scenario 4: Meter Offline (Hardware Fault)

1. Simulate meter offline: remove home from telemetry map
2. HAL marks `DEVICE_OFFLINE`
3. HAL falls back to cloud API (or cached last reading)
4. Dashboard shows "Hardware Status: STALE"
5. After 5 minutes: admin alert triggered

---

## Running Simulations

```bash
# Run the development server in simulation mode
HARDWARE_MODE=simulated npm run dev

# Trigger an outage via API (simulation)
curl -X POST http://localhost:3000/api/v1/emergency/outage-detected \
  -H "Content-Type: application/json" \
  -d '{"community_id": "c7a81023-98ab-4123-bcde-890123456789", "status": "OUTAGE_DG_ACTIVE"}'

# Check the triage response
curl http://localhost:3000/api/v1/emergency/triage/c7a81023-98ab-4123-bcde-890123456789
```

---

## Future: Hardware-in-the-Loop (HIL) Testing

When physical hardware is available:

1. **Test bench**: 1× Raspberry Pi 4, 1× Genus meter (or simulator), 1× BMS (or simulator)
2. **Automated test runner**: Jest tests that POST to the real edge agent API
3. **Regression suite**: Run all 4 scenarios above against physical hardware
4. **Acceptance criteria**: Readings within ±2% of reference meter; dispatch commands executed within 2 seconds
