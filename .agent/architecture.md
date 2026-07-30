# Community Energy Exchange AI — Architectural Blueprint & Agent Guidelines
**File:** `.agent/architecture.md`
**Version:** 1.0.0 (Production / Full Agent Mode)
**Target Operating Environment:** Autonomous Agent Studio / AI Coding Agents

---

## 1. Executive Architectural Mandate
Community Energy Exchange AI (CEE-AI) is a **software-first, AI-orchestrated community energy resiliency and peer-to-peer virtual energy exchange platform**. 

### 1.1 Core Immutable Rules for AI Coding Agents
1. **No Proprietary Hardware in Version 1:** All energy telemetry, inverter scheduling, solar curtailment/export commands, and battery state-of-charge (SoC) management MUST be executed via **software integrations** with third-party cloud APIs (e.g., Enphase Enlighten API, SolarEdge Monitoring/Control API, GoodWe SEMS API, Growatt ShineOpen, Sungrow iSolarCloud, Victron VRM API, Genus/Schneider Smart Meters, and OCPP 1.6/2.0.1 for EV chargers).
2. **Virtual Energy Ledger Over Physical Switching:** Version 1 does NOT require physical DC/AC relay switching between houses. Energy sharing operates via **Virtual Community Microgrid Balancing**:
   - During normal grid operation: Utilizing Indian DISCOM Group/Virtual Net Metering frameworks and RWA (Resident Welfare Association) internal feeder telemetry.
   - During outages (DG / Backup Bus Operation): Orchestrating inverter export limits and scheduling home storage discharge into the community internal distribution feeder while tracking individual sub-meter draws.
3. **Event-Driven, Deterministic State Machine:** The AI Engine provides predictive optimizations, recommendations, and automated dispatch schedules, but **all financial and ledger transactions MUST be processed by an immutable, double-entry relational ledger** (Postgres/TimescaleDB) with ACID compliance. The AI never mutates ledger balances directly; it submits audited `EnergyTransferEvent` records to the Ledger Service.

---

## 2. High-Level Architecture Topography

```
+-----------------------------------------------------------------------------------+
|                           RESIDENTIAL SOCIETY / RWA LAYER                         |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Smart Meters       |  | Solar Inverters    |  | EV Chargers & Home Batteries|  |
|  | (Modbus/MQTT/REST) |  | (Enphase,GoodWe..) |  | (OCPP 1.6/2.0.1, Tesla...)  |  |
+--+---------+----------+--+---------+----------+--+--------------+--------------+--+
             |                       |                            |
             v                       v                            v
+------------+-----------------------+----------------------------+-----------------+
|                        HARDWARE ABSTRACTION LAYER (HAL)                           |
|  +-----------------------------------------------------------------------------+  |
|  | Telemetry Ingestion Engine (TimescaleDB / Apache Kafka / Redis Streams)     |  |
|  | Normalization & Protocol Translation (MQTT, HTTP REST, Webhooks)            |  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------------+
|                            CORE BACKEND MICROSERVICES                             |
|                                                                                   |
|  +---------------------------+   +--------------------+   +--------------------+  |
|  | AI ORCHESTRATION ENGINE   |   | ENERGY LEDGER SVC  |   | EMERGENCY ROUTER   |  |
|  | • Solar/Demand Forecast   |   | • Net-Zero Ledger  |   | • Outage Detection |  |
|  | • Outage Prediction       |   | • RWA Netting      |   | • Triage & Lifeline|  |
|  | • Matching & Scheduling   |   | • Audit & Billing  |   | • DG Avoidance     |  |
|  | (PyTorch/LightGBM/Ray)    |   | (ACID Postgres)    |   | (Deterministic Rust|  |
|  +---------------------------+   +--------------------+   +--------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | SOCIETY & USER MANAGEMENT SERVICE (MyGate/NoBrokerHood RWA ERP Integrations)|  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------------+
|                         CLIENT & STAKEHOLDER INTERFACES                           |
|  +----------------------------+  +---------------------+  +--------------------+  |
|  | Resident Mobile App        |  | RWA Admin Dashboard |  | DISCOM / Grid API  |  |
|  | (React Native / Flutter)   |  | (React / Vite / TW) |  | (OpenADR 2.0b / DR)|  |
+--+----------------------------+--+---------------------+--+--------------------+--+
```

---

## 3. Subsystem Specification & Boundaries

### 3.1 Hardware Abstraction Layer (HAL)
- **Responsibility:** Normalizes heterogeneous OEM inverter, smart meter, and battery data into a standardized `UnifiedEnergyTelemetry` JSON schema.
- **Protocol Support:**
  - REST Pollers (interval: 15 seconds during emergencies, 60 seconds normal).
  - MQTT Ingestion (for local IoT gateways or open telemetry modems).
  - Webhook Ingestion (for OEM push events).
- **Anti-Hallucination Rule:** Do not invent unsupported OEM APIs. Follow `.agent/api_rules.md` for strict OpenAPI mock structures for Enphase, GoodWe, and L&T Smart Meters.

### 3.2 AI Orchestration Engine (`/services/ai-engine`)
- **Responsibility:**
  - **Demand Forecasting:** Predicts 24-hour household consumption at 15-minute intervals using LSTM / Temporal Fusion Transformers trained on historical load, day-of-week, and ambient temperature.
  - **Solar Forecasting:** Integrates open weather models (IMD / OpenWeatherMap GRIB data) to predict rooftop irradiance and kWh generation.
  - **Outage Prediction & Resilience Optimization:** Evaluates local grid voltage sags, weather warnings (cyclones, monsoons, heatwaves), and historical DISCOM outage patterns to pre-charge home batteries before grid drop.
  - **Supplier-Consumer Matching Algorithm:** Linear programming / convex optimization solver that matches homes with excess battery/solar (`Net Supply Available`) to homes with deficit (`Net Demand Required`), prioritizing medical/critical emergencies.

### 3.3 Energy Credit Ledger Service (`/services/ledger-svc`)
- **Responsibility:**
  - Maintains the immutable double-entry ledger.
  - Houses the **Net Energy Balance Calculation Engine**.
  - Applies Indian RWA (Resident Welfare Association) tariff logic: netting out peer-to-peer virtual energy exchanges against the monthly society DG (Diesel Generator) or Common Area maintenance bill.
- **Data Store:** PostgreSQL 16 with TimescaleDB extension for time-series energy ledgers.

### 3.4 Emergency Power Routing & Triage Service (`/services/emergency-router`)
- **Responsibility:**
  - Acts as a deterministic, fail-safe override during community blackouts.
  - Immediately categorizes households into **Priority Tiers**:
    - **Tier 0 (Life Critical):** Medical equipment (Oxygen concentrators, respirators, insulin refrigeration).
    - **Tier 1 (Infrastructure Critical):** Water pumps, lifts, community server rooms, security gates.
    - **Tier 2 (Basic Human Needs):** Lights, fans, refrigerator, Wi-Fi.
    - **Tier 3 (Deferrable Load):** EV chargers, HVAC/AC units, washing machines, pool pumps.
  - Sends immediate API/MQTT commands to throttle or shed Tier 3 loads and direct inverter export capacity toward maintaining bus voltage for Tier 0/1 loads.

---

## 4. Indian Regulatory & Physics Compliance Architecture
1. **Electricity Act 2003 (Section 12) Compliance:**
   - In India, direct retail sale of electricity across public roads or distribution networks without a distribution license is prohibited.
   - **CEE-AI Solution:** Operates *within a single RWA / Gated Community / Apartment Complex* served by a single HT/LT bulk connection or under **DISCOM Group/Virtual Net Metering** guidelines (e.g., BESCOM, MERC, DERC rules).
   - Energy transfers are accounted as **Virtual Energy Credits (CEE Credits)**, settled internally within the RWA’s Common Area Maintenance (CAM) billing system.
2. **Diesel Generator (DG) Synchronisation & Avoidance:**
   - Most Indian societies run DGs during outages at ₹22–₹32/kWh.
   - CEE-AI aggregates residential solar + battery storage to form a **Virtual Power Plant (VPP)** that supports common area loads and neighbor loads, delaying or entirely avoiding DG start-up.

---

## 5. Directory Mapping & Code Organization
```
/community-energy-ai
├── .agent/              # AI Agent Studio rules, architecture, and roadmaps
├── docs/                # Comprehensive engineering, product, and business docs
├── skills/              # Executable AI agent skills (.skill files)
├── src/
│   ├── hal/             # Hardware Abstraction Layer (Inverter & Meter adaptors)
│   ├── ledger/          # Double-entry energy credit ledger service
│   ├── ai-engine/       # Forecasting, optimization, and matching ML pipelines
│   ├── emergency/       # Real-time triage and outage response engine
│   ├── api/             # REST & WebSocket API gateway
│   └── web/             # Resident mobile web & RWA admin dashboard (React/Vite)
├── tests/               # Comprehensive unit, integration, and ledger invariant tests
├── .mcp.json            # Tool and server definitions for AI agents
├── project.json         # Master project configuration manifest
├── README.md            # World-class technical documentation & visual diagrams
└── .env.example         # Template for all required environment variables
```
