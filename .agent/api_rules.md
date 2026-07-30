# Community Energy Exchange AI — API Architecture & Anti-Hallucination Rules
**File:** `.agent/api_rules.md`
**Version:** 1.0.0 (Production / Full Agent Mode)

---

## 1. REST & WebSocket API Core Rules
1. **API Versioning:**
   - All REST endpoints must be prefixed with `/api/v1/`.
   - Never create unversioned endpoints.
2. **Standardized JSON Response Envelope:**
   ```json
   {
     "status": "success",
     "data": { ... },
     "meta": {
       "timestamp": "2026-07-29T14:30:00Z",
       "request_id": "req-98a76bc5-4321"
     }
   }
   ```
   For errors:
   ```json
   {
     "status": "error",
     "error": {
       "code": "INSUFFICIENT_LEDGER_BALANCE",
       "message": "Household net balance cannot go below RWA credit floor.",
       "details": {}
     },
     "meta": { ... }
   }
   ```

---

## 2. Strict Endpoint Catalog (No Invention Permitted)
AI coding agents must implement and call **only** the following validated endpoints (detailed in `docs/API_SPEC.md`):

### 2.1 Telemetry & HAL Endpoints
- `POST /api/v1/telemetry/ingest` — Ingest standardized household telemetry from meter/inverter.
- `GET /api/v1/telemetry/home/{home_id}` — Get real-time energy flow for a specific home.
- `GET /api/v1/telemetry/community/{community_id}` — Get aggregate community solar, battery, demand, and DG status.

### 2.2 AI Engine & Forecasting Endpoints
- `GET /api/v1/ai/forecast/demand/{community_id}` — 24-hr load forecast.
- `GET /api/v1/ai/forecast/solar/{community_id}` — 24-hr solar generation forecast.
- `POST /api/v1/ai/optimize/dispatch` — Trigger AI matching and schedule generation.
- `GET /api/v1/ai/recommendations/{home_id}` — Get AI energy-saving & pre-charging advice.

### 2.3 Energy Ledger & Settlement Endpoints
- `GET /api/v1/ledger/balance/{home_id}` — Get current Given, Received, and Net balance.
- `GET /api/v1/ledger/community/{community_id}` — Get RWA-wide netting statement.
- `POST /api/v1/ledger/settle` — Execute monthly net settlement and CAM billing export.

### 2.4 Emergency & Outage Routing Endpoints
- `POST /api/v1/emergency/outage-detected` — Report grid outage and trigger triage.
- `GET /api/v1/emergency/triage/{community_id}` — Retrieve active Priority Tiers and survival hours.
- `POST /api/v1/emergency/override/{home_id}` — Admin/Medical override for Tier 0 survival.

---

## 3. Real-Time WebSocket Channel Specification
- **Endpoint:** `wss://api.cee-ai.in/v1/ws`
- **Topics:**
  - `community.{id}.telemetry` — 1-second pulse of community grid/DG/solar kW.
  - `home.{id}.ledger` — Live energy credit updates.
  - `community.{id}.emergency` — Severe weather or outage alerts.
