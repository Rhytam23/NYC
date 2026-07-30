# Prioritized Backlog & Sprint Todo List — Community Energy Exchange AI
**File:** `todo.md`  
**Status:** Active Backlog | **Version:** 1.0.0

---

## High-Priority Backlog (V1 MVP - Weeks 1 to 4)
- [ ] **[DB]** Execute SQL migrations for PostgreSQL + TimescaleDB schema (`docs/DATABASE.md`).
- [ ] **[HAL]** Complete Enphase Enlighten API connector with OAuth2 token renewal and rate-limiting.
- [ ] **[HAL]** Complete Genus / L&T Smart Meter webhook verification engine.
- [ ] **[LEDGER]** Implement 15-minute `LedgerService` net energy balance calculator.
- [ ] **[LEDGER]** Build zero-sum invariant PyTest suite ensuring $\sum (\text{Net Balance}) = 0$.
- [ ] **[AI]** Build LightGBM tabular load forecasting baseline model.
- [ ] **[EMERGENCY]** Implement Tier 0 Medical safety lock (preventing battery discharge below 30% SOC).
- [ ] **[API]** Implement core REST endpoints and WebSocket `/v1/ws` pulse channel.
- [ ] **[UI]** Build React/Tailwind Emergency Command Center dashboard with dark mode and survival ticker.
- [ ] **[ERP]** Implement 1-click JSON CAM billing export for MyGate and NoBrokerHood.

---

## Medium-Priority Backlog (V1.5 - Weeks 5 to 8)
- [ ] **[WEATHER]** Connect India Meteorological Department (IMD) RSS/API for automated cyclone pre-charging.
- [ ] **[EV]** Add OCPP 1.6 smart EV charger throttling command during Level 2 emergency triage.
- [ ] **[UI]** Build gamified RWA carbon savings leaderboard (`docs/CLIMATE_IMPACT.md`).
- [ ] **[SECURITY]** Implement automated RSA-4096 signature verification on CAM settlement exports.
- [ ] **[DEVOPS]** Set up AWS EKS Terraform scripts for Mumbai (`ap-south-1`) deployment.

---

## Low-Priority / Roadmap Backlog (V2.0 / V3.0 - Future Hardware Integration)
- [ ] **[ROADMAP-HW]** Design Rust/Linux edge supervisor firmware for the AI Energy Hub (`docs/HARDWARE_ROADMAP.md`).
- [ ] **[ROADMAP-HW]** Prototype Modbus-over-TCP integration for bidirectional ATS Smart Relays.
- [ ] **[ROADMAP-DISCOM]** Implement OpenADR 2.0b virtual power plant demand response client for BESCOM/Tata Power grid support.
