# Future Hardware Integration & Edge Microgrid Roadmap (Version 2.0 / 3.0)
**Document:** `docs/HARDWARE_ROADMAP.md`  
**Status:** Approved Roadmap | **Version:** 1.0.0  
**IMPORTANT REMINDER:** Version 1.0 is 100% SOFTWARE-FIRST. No proprietary hardware is built or required for V1 deployment. This document defines the future edge hardware ecosystem for sub-second physical microgrid switching.

---

## 1. Why Transition from Pure Software (V1) to Hybrid Edge Hardware (V2/V3)?
While V1’s software-first cloud integrations solve **virtual energy credit netting and 60-second inverter scheduling**, physical hardware integration in V2/V3 unlocks:
- **Sub-Second Islanding & Microgrid Forming:** Zero-millisecond transfer switching during DISCOM grid drop without losing power to Wi-Fi routers or sensitive electronics.
- **Physical Feeder Isolation:** Automatic switching of residential backup circuits onto a dedicated low-voltage DC or AC community distribution bus.

---

## 2. Hardware Module Specifications (Roadmap Catalog)

```
+---------------------------------------------------------------------------------------------------------+
|                                    CEE-AI FUTURE EDGE HARDWARE ROADMAP                                  |
|                                                                                                         |
|  +-----------------------------+   +-----------------------------+   +-------------------------------+  |
|  |     1. AI ENERGY HUB        |   |    2. SMART RELAY & ATS     |   |    3. COMMUNITY GATEWAY       |  |
|  |  (Local Rust Edge Super-    |   |  (100A DIN-Rail Automatic   |   |  (RWA Substation IoT Gateway  |  |
|  |   visor with 4G/LTE/Wi-Fi)  |   |   Transfer Switch & Bus)    |   |   with Modbus/MQTT/Cellular)  |  |
|  +-----------------------------+   +-----------------------------+   +-------------------------------+  |
|                                                                                                         |
|  +-----------------------------+   +-----------------------------+   +-------------------------------+  |
|  |   4. BATTERY CONTROLLER     |   |      5. IOT SENSORS         |   |      6. SMART PLUG (TIER 3)   |  |
|  |  (CAN/RS485 Universal BMS   |   |  (CT Clamps & Power Quality |   |  (16A Heavy-Duty Appliance    |  |
|  |   Protocol Bridge)          |   |   Harmonic Analyzers)       |   |   Load-Shedding Relay)        |  |
|  +-----------------------------+   +-----------------------------+   +-------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1 AI Energy Hub (Home Edge Controller)
- **Role:** Replaces cloud API polling with local, zero-latency Modbus/CAN-bus communication to the residential hybrid inverter.
- **Spec:** ARM Cortex-A55 Quad-Core processor running Linux + local Rust edge supervisor; integrated Wi-Fi 6, Zigbee 3.0, and 4G LTE eSIM fallback during monsoon fiber-optic cuts.
- **Target BOM Cost:** <$45 USD (₹3,800 INR).

### 2.2 Smart Relay & ATS (Automatic Transfer Switch)
- **Role:** Installed in the electrical distribution panel of premium villas/apartments to physically toggle between DISCOM Grid, RWA DG, and the CEE-AI Community Microgrid Bus.
- **Spec:** 100A bidirectional solid-state contactors with <10ms transfer time; integrated current transformer (CT) metering.

### 2.3 Community Gateway (Substation Controller)
- **Role:** Installed at the RWA transformer / DG generator shed to monitor grid voltage sags, DG start signals, and total society feeder load.

### 2.4 Battery Controller (BMS Universal Adaptor)
- **Role:** RS485/CAN-bus interface that bridges proprietary lithium battery BMS protocols (Pylontech, Growatt, Luminous, Exide) to standard CEE-AI MQTT telemetry.

### 2.5 IoT Sensors & CT Clamps
- **Role:** Split-core Current Transformers (100A/200A) clamped onto incoming mains and backup circuits for real-time 1000Hz power factor and harmonic distortion monitoring.

### 2.6 Smart Plug (Tier 3 Deferrable Load Shedding)
- **Role:** 16A heavy-duty Wi-Fi/Zigbee smart plug for geysers, AC units, and pool pumps that automatically opens contact within 2 seconds of an emergency triage broadcast.
