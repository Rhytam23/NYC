# Implementation Task Breakdown — Community Energy Exchange AI (V1 MVP)
**File:** `tasks.md`  
**Status:** Ready for AI Coding Agent Hand-Off | **Version:** 1.0.0

---

## Sprint 1: Project Setup & Database Foundations
- [ ] **TASK-101:** Initialize Python 3.11+ FastAPI backend project structure under `/src/api` with Poetry or `pyproject.toml`.
- [ ] **TASK-102:** Set up Docker Compose environment (`docker-compose.yml`) running PostgreSQL 16 + TimescaleDB, Redis 7, and local test runners.
- [ ] **TASK-103:** Implement database SQL migration scripts in `/src/db/migrations` matching `docs/DATABASE.md` DDL schema (Communities, Homes, Inverters, Telemetry Hypertable, Ledger Transactions, Monthly Settlements).
- [ ] **TASK-104:** Write automated PyTest test cases verifying database schema creation and TimescaleDB continuous aggregate creation (`hourly_home_energy_summary`).

---

## Sprint 2: Hardware Abstraction Layer (HAL) Connectors
- [ ] **TASK-201:** Implement standard `UnifiedEnergyTelemetry` Pydantic v2 data schema in `/src/hal/schemas.py`.
- [ ] **TASK-202:** Build Enphase Enlighten API OAuth2 Client (`/src/hal/enphase.py`) with 60-second polling and exponential backoff retry logic.
- [ ] **TASK-203:** Build GoodWe SEMS Cloud API Client (`/src/hal/goodwe.py`) for solar and hybrid battery SOC monitoring.
- [ ] **TASK-204:** Build Genus/L&T Smart Meter Webhook Ingestion endpoint (`POST /api/v1/telemetry/webhook/meter`) with HMAC-SHA256 signature verification.
- [ ] **TASK-205:** Implement Redis Stream producer that publishes normalized telemetry events to `telemetry.raw` topic.

---

## Sprint 3: Energy Credit Ledger Service (`/services/ledger-svc`)
- [ ] **TASK-301:** Build `LedgerService` class (`/src/ledger/service.py`) that subscribes to `telemetry.raw` and writes rows into `energy_telemetry` hypertable.
- [ ] **TASK-302:** Implement 15-minute netting engine that calculates `delta_given_kwh`, `delta_received_kwh`, and `net_energy_balance_kwh` for each home.
- [ ] **TASK-303:** Implement double-entry invariant verification tests (`test_zero_sum_netting.py`) ensuring zero community leakage.
- [ ] **TASK-304:** Implement Monthly CAM Settlement Export service (`/src/ledger/settlement.py`) generating signed JSON export files for MyGate/NoBrokerHood ERPs.

---

## Sprint 4: AI Forecasting & Outage Triage Engine (`/services/ai-engine` & `/services/emergency`)
- [ ] **TASK-401:** Implement LightGBM 24-hr household load demand forecasting module (`/src/ai/demand_model.py`) using historical lag features and ambient temperature.
- [ ] **TASK-402:** Implement IMD Weather Alert integration (`/src/ai/weather_client.py`) to trigger preemptive 100% SOC charging when `imd_alert_level == ORANGE | RED`.
- [ ] **TASK-403:** Build SciPy Linear Programming matching solver (`/src/ai/solver.py`) implementing the objective function from `docs/AI_ENGINE.md`.
- [ ] **TASK-404:** Implement 4-Tier Emergency Router (`/src/emergency/router.py`) enforcing Tier 0 Medical battery reserve floors (30% min SOC) during detected grid outages.

---

## Sprint 5: API Gateway & WebSocket Live Command Center
- [ ] **TASK-501:** Implement FastAPI endpoints defined in `docs/API_SPEC.md` (`/api/v1/telemetry/*`, `/api/v1/ai/*`, `/api/v1/ledger/*`, `/api/v1/emergency/*`).
- [ ] **TASK-502:** Build WebSocket manager (`/src/api/ws.py`) streaming live 1-second pulse telemetry and ledger balances to authenticated resident clients.
- [ ] **TASK-503:** Integrate JWT bearer token authentication and RBAC (`RESIDENT` vs `RWA_ADMIN`).

---

## Sprint 6: React / Vite Admin Dashboard & Resident Web App
- [ ] **TASK-601:** Initialize React 18 + Vite + TypeScript frontend project under `/src/web` with Tailwind CSS design tokens from `.agent/ui_rules.md`.
- [ ] **TASK-602:** Build Resident Dashboard view (`<HomeOverview />`) displaying live solar/battery flow, CEE Credit net balance, and reserve SOC slider.
- [ ] **TASK-603:** Build RWA Admin Emergency Command Center (`<CommunityCommandCenter />`) featuring dark-mode outage survival clock, DG diesel savings ticker, and live VPP active routes.
- [ ] **TASK-604:** Build end-to-end Cypress / Playwright browser tests simulating a 15-minute onboarding flow and a simulated monsoon grid outage.
