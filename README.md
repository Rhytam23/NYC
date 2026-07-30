# Community Energy Exchange AI (CEE-AI)
**The Software-First Autonomous Operating System for Community Energy Resilience & Virtual Peer-to-Peer Netting**

[![Version](https://img.shields.io/badge/Version-1.0.0--MVP-059669?style=for-the-badge)](./project.json)
[![Target Market](https://img.shields.io/badge/Target%20Market-India%20First%20%7C%20Global-0284C7?style=for-the-badge)](./docs/PRD.md)
[![Hardware](https://img.shields.io/badge/Version%201.0-0%25%20Proprietary%20Hardware-7C3AED?style=for-the-badge)](./docs/HARDWARE_ROADMAP.md)
[![Compliance](https://img.shields.io/badge/Compliance-Electricity%20Act%202003%20Sec%2012-D97706?style=for-the-badge)](./docs/ENERGY_LEDGER.md)

---

## 1. Executive Summary: Why We Exist
In urban India—from Whitefield in Bangalore to DLF Phase 5 in Gurgaon—gated communities face an **asymmetric energy resilience crisis**:
- **The Surplus Homes:** Over 30% of premium villas and apartments have installed 3–10 kWp rooftop solar, lithium-ion battery backup systems, and EV chargers. During daytime power cuts or regular grid operation, their batteries sit at 90–100% State of Charge (SOC) while excess solar is exported to DISCOMs for as low as **₹2.80/kWh**.
- **The Deficit Homes:** 70% of homes rely on basic lead-acid inverters (1.5 kVA) that drain in 45 minutes, leaving elderly residents' oxygen concentrators, CPAP machines, and refrigeration without power.
- **The Diesel Generator (DG) Trap:** To cover the gap, Resident Welfare Associations (RWAs) fire up massive 250–500 kVA centralized **Diesel Generators**, burning thousands of liters of diesel at **₹26.00 to ₹32.00 per kWh**—polluting the air and draining community maintenance funds.

```
       WITHOUT CEE-AI (THE DIESEL GENERATOR TRAP)                WITH CEE-AI (SOFTWARE-FIRST VIRTUAL MICROGRID)
       
     [Villa A: 10 kWh Battery Full]  (Idle / Curtailed)         [Villa A] ──(Virtual Sharing @ ₹8.55/kWh)──► [Apt B]
                                                                     │                                         │
     [Apt B: Lead-Acid Inverter Dead] (No Medical Backup)            ├─────────────────────────────────────────┤
                                                                     │   • 0 Liters Diesel Burned (DG Off)     │
     [RWA 250 kVA Diesel Generator]   (Spewing Soot @ ₹26/kWh)       │   • Life-Critical Medical Loads Secure  │
                                                                     │   • Netting against Monthly CAM Bill    │
```

**Community Energy Exchange AI (CEE-AI)** is not another smart home app, monitoring dashboard, or energy optimization software. It is an **AI-powered Community Energy Exchange Platform** that transforms existing residential solar and battery storage into an autonomous, self-healing virtual microgrid—with **zero proprietary hardware in Version 1**.

---

## 2. Core Architectural Commandments
1. **Software-First & Zero Hardware Gatekeeping (V1):** Connects to Enphase, GoodWe, SolarEdge, Genus smart sub-meters, and RWA ERPs (MyGate, NoBrokerHood) via cloud APIs in 15 minutes.
2. **Virtual Energy Credit Ledger (`CEE Credits`):** We never sell retail electricity directly (complying with Section 12 of India’s Electricity Act 2003). Instead, our double-entry ledger nets clean community kilowatt-hours against monthly RWA Common Area Maintenance (CAM) billing.
3. **Four-Tier Emergency Triage:** During grid outages, the AI Engine automatically locks **Tier 0 (Life Critical - Medical)** household batteries at a minimum 30% SOC floor and sheds **Tier 3 (Deferrable)** loads to maximize community survival time.

---

## 3. System Topology & Visual Blueprint

```
+---------------------------------------------------------------------------------------------------------+
|                                    COMMUNITY / RESIDENTIAL LAYER                                        |
|                                                                                                         |
|  +---------------------------+  +---------------------------+  +-------------------------------------+  |
|  | Enphase / GoodWe / Edge   |  | Genus / L&T / Schneider   |  | EV Chargers (OCPP 1.6 / 2.0.1)      |  |
|  | Hybrid Inverter Cloud API |  | Smart Meters / RWA ERP    |  | & Bidirectional EV Batteries        |  |
|  +-------------+-------------+  +-------------+-------------+  +------------------+------------------+  |
+----------------|------------------------------|-----------------------------------|---------------------+
                 |                              |                                   |
                 | REST Poll / MQTT / Webhooks  | REST Poll / Webhooks              | OCPP / REST
                 v                              v                                   v
+---------------------------------------------------------------------------------------------------------+
|                                 HARDWARE ABSTRACTION LAYER (HAL)                                        |
|  +---------------------------------------------------------------------------------------------------+  |
|  |  HAL Gateway Service (`/src/hal`) — Protocol Normalization, Rate-Limiting & Signature Verify      |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------+-----------------------------------------------------+
                                                    | Unified Telemetry Pulse (Redis Stream)
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                       CORE BACKEND SERVICES                                             |
|                                                                                                         |
|  +-------------------------------+  +-------------------------------+  +-----------------------------+  |
|  | AI ORCHESTRATION ENGINE       |  | ENERGY LEDGER SERVICE         |  | EMERGENCY ROUTER SERVICE    |  |
|  | (`/src/ai`)                   |  | (`/src/ledger`)               |  | (`/src/emergency`)          |  |
|  | • 24-hr Demand/Solar Forecast |  | • Double-Entry CEE Ledger     |  | • Grid Outage Detection     |  |
|  | • Convex Optimization Solver  |  | • Zero-Sum Invariant Engine   |  | • Tier 0 Medical Safety     |  |
|  +-------------------------------+  +-------------------------------+  +-----------------------------+  |
+---------------------------------------------------+-----------------------------------------------------+
                                                    | Standardized REST & WebSocket API Gateway
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                  CLIENT & STAKEHOLDER APPLICATIONS                                      |
|  +-------------------------------------+   +---------------------------------------------------------+  |
|  | Resident Web & Mobile App           |   | RWA Admin Command Center (Dark Mode Emergency UI)       |  |
|  +-------------------------------------+   +---------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 4. The Indian Energy Economics Benefit

```
        COST PER kWh (₹ INR) IN INDIAN GATED COMMUNITIES
        
  ₹30 |                                                 [₹26.00/kWh]
      |                                              DIESEL GENERATOR
  ₹25 |                                                (DG POWER)
      |
  ₹20 |
      |
  ₹15 |
      |
  ₹10 |    [₹8.50/kWh]           [₹9.50/kWh]
      |    DISCOM GRID        CEE-AI CLEARING
   ₹5 |                        COMMUNITY RATE
      |                                                 [₹3.00/kWh]
   ₹0 +---------------------------------------------- DISCOM EXPORT
                                                     (NET METERING)
```

- **For Net Surplus Providers:** Earn **₹8.55/kWh** CAM credit rebate on surplus shared energy (vs. ₹3.00/kWh from DISCOM export).
- **For Net Deficit Consumers:** Pay only **₹9.50/kWh** for clean backup power during outages, saving **₹16.50/kWh** compared to DG diesel power (₹26.00/kWh).
- **For RWA Management:** Cuts monthly society diesel consumption by **60–80%**, saving up to **₹11.7 Lakhs/year** for a typical 300-home community.

---

## 5. Repository Structure & Documentation Index
This repository is an **AI-Ready Engineering Manifest** designed to be handed directly to AI coding agents with zero hallucination.

### 5.1 `.agent/` — Agent Studio & Architectural Guardrails
- [`architecture.md`](./.agent/architecture.md) — System boundaries, virtual microgrid physics, and legal compliance.
- [`coding_rules.md`](./.agent/coding_rules.md) — Strict Python/TS standards, anti-hallucination rules, and zero-sum invariant tests.
- [`product_rules.md`](./.agent/product_rules.md) — India-first design mandates, priority hierarchy, and product anti-patterns.
- [`ui_rules.md`](./.agent/ui_rules.md) — Emergency Command Center design system, color tokens, and accessibility.
- [`security_rules.md`](./.agent/security_rules.md) — Zero-trust mTLS, envelope encryption, and anti-islanding safety.
- [`api_rules.md`](./.agent/api_rules.md) — Standardized JSON response envelope and strict endpoint catalog.
- [`prompts.md`](./.agent/prompts.md) — Persona prompts and instructions for AI coding and runtime optimization agents.
- [`roadmap.md`](./.agent/roadmap.md) — Phased rollout from V1 MVP (Software-First) to V3 (Hardware Hubs).

### 5.2 `docs/` — Complete Product, Technical & Business Specifications
- [`PRD.md`](./docs/PRD.md) — Extensive Product Requirements Document (Validation, Competitor Gap Analysis, MoSCoW priorities).
- [`SYSTEM_ARCHITECTURE.md`](./docs/SYSTEM_ARCHITECTURE.md) — Microservices topology, data flows, DevOps, and EKS deployment.
- [`BUSINESS_MODEL.md`](./docs/BUSINESS_MODEL.md) — Unit economics, pricing tiers, and MyGate/NoBrokerHood GTM strategy.
- [`USER_PERSONAS.md`](./docs/USER_PERSONAS.md) — Profiles for Surplus Homeowner, Elderly Lifeline Resident, and RWA President.
- [`USER_JOURNEY.md`](./docs/USER_JOURNEY.md) — 15-minute onboarding, outage emergency triage, and monthly billing export.
- [`AI_ENGINE.md`](./docs/AI_ENGINE.md) — LightGBM / TFT forecasting models and SciPy linear programming matching solver.
- [`ENERGY_LEDGER.md`](./docs/ENERGY_LEDGER.md) — Double-entry accounting, netting mathematics, and zero-leakage invariants.
- [`DATABASE.md`](./docs/DATABASE.md) — Complete PostgreSQL 16 + TimescaleDB SQL DDL schema and continuous aggregates.
- [`API_SPEC.md`](./docs/API_SPEC.md) — OpenAPI contract for telemetry ingestion, AI dispatch, ledger netting, and WebSockets.
- [`SECURITY.md`](./docs/SECURITY.md) — Cyber-physical inverter safety, STRIDE threat matrix, and audit logging.
- [`CLIMATE_IMPACT.md`](./docs/CLIMATE_IMPACT.md) — CEA carbon intensity calculations, diesel particulate reduction, and BRSR/GRI ESG reporting.
- [`HARDWARE_ROADMAP.md`](./docs/HARDWARE_ROADMAP.md) — Specifications for future V2/V3 hardware (AI Energy Hub, Smart Relay ATS).
- [`PITCH.md`](./docs/PITCH.md) — 10-slide venture deck structure and 5-minute hackathon demo script.
- [`FAQ.md`](./docs/FAQ.md) — Deep answers on Electricity Act Section 12, DG AMF synchronization, and RWA governance.

### 5.3 `skills/` — Executable AI Agent Skills
- [`energy-routing.skill`](./skills/energy-routing.skill) — P2P power matching and DG avoidance solver.
- [`weather-intelligence.skill`](./skills/weather-intelligence.skill) — IMD alert ingestion and 100% pre-charge trigger.
- [`battery-optimization.skill`](./skills/battery-optimization.skill) — LFP/NMC longevity and SOC floor preservation.
- [`community-ledger.skill`](./skills/community-ledger.skill) — Double-entry netting and zero-sum invariant verification.
- [`dashboard.skill`](./skills/dashboard.skill) — Dark mode UI state transformation and survival clock synthesis.
- [`notification.skill`](./skills/notification.skill) — Multi-channel WhatsApp/SMS emergency alerts.
- [`settlement.skill`](./skills/settlement.skill) — Monthly CAM bill closing and MyGate/NoBrokerHood JSON export.

### 5.4 Master Execution Backlog & Configuration
- [`tasks.md`](./tasks.md) — Step-by-step sprint execution plan for AI coding agents.
- [`todo.md`](./todo.md) — Prioritized product and technical backlog.
- [`.env.example`](./.env.example) — Full environment variable template with documentation.
- [`.mcp.json`](./.mcp.json) — Production Model Context Protocol server configuration.
- [`project.json`](./project.json) — Master project manifest.

---

## 6. Setup & AI Coding Agent Instructions
To begin implementing the codebase for Version 1.0:
1. **Clone & Inspect:** Verify `/home/user/community-energy-ai` contains all documentation and rules.
2. **Read Invariants:** Read `.agent/coding_rules.md`, `docs/DATABASE.md`, and `docs/API_SPEC.md` before generating any Python or TypeScript file.
3. **Run Tasks Step-by-Step:** Follow `tasks.md` sequentially from Sprint 1 (Database & Migrations) through Sprint 6 (React Admin Dashboard).
4. **Verify Ledger Zero-Sum:** Every pull request MUST execute automated tests asserting that $\sum (\text{Net Energy Balance}_i) = 0$.

```bash
# Example local validation command for coding agents
pytest tests/test_ledger_invariants.py -v
```

---
*Built by the CEE-AI Autonomous Startup Studio in Full Agent Mode.*
