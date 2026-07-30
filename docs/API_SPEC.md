# API Specification & OpenAPI Contract — Community Energy Exchange AI
**Document:** `docs/API_SPEC.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. Authentication & Security Flow
- **Protocol:** HTTPS REST + WSS WebSockets.
- **Authentication:** Bearer JWT in the `Authorization: Bearer <token>` header.
- **Token Generation:** Issued via `/api/v1/auth/login` after verifying resident tenancy against the RWA ERP (MyGate / NoBrokerHood) or OAuth2 identity provider.

---

## 2. Comprehensive REST Endpoint Catalog

### 2.1 Telemetry Ingestion Endpoint
- **Endpoint:** `POST /api/v1/telemetry/ingest`
- **Authentication:** Mandatory (mTLS or HMAC signed Gateway Header `X-CEE-Signature`).
- **Request Body (JSON):**
  ```json
  {
    "home_id": "a8c9b201-34df-4912-98ab-10293847561a",
    "timestamp": "2026-07-29T14:30:00Z",
    "solar_gen_kw": 4.5200,
    "battery_soc_pct": 78.50,
    "battery_flow_kw": 1.2000,
    "home_demand_kw": 2.1000,
    "grid_import_kw": 0.0000,
    "grid_export_kw": 2.4200,
    "grid_status": "NORMAL"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "data": {
      "recorded": true,
      "ingested_at": "2026-07-29T14:30:00.120Z"
    },
    "meta": { "request_id": "req-9801" }
  }
  ```

---

### 2.2 Resident Real-Time Home Dashboard Endpoint
- **Endpoint:** `GET /api/v1/telemetry/home/{home_id}`
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "home_id": "a8c9b201-34df-4912-98ab-10293847561a",
      "resident_name": "Rajesh Sharma",
      "emergency_tier": "TIER_2_BASIC",
      "current_flows": {
        "solar_gen_kw": 4.5200,
        "battery_soc_pct": 78.50,
        "home_demand_kw": 2.1000,
        "net_export_kw": 2.4200
      },
      "ledger_summary_month_to_date": {
        "energy_given_kwh": 180.5000,
        "energy_received_kwh": 20.0000,
        "net_energy_balance_kwh": 160.5000,
        "projected_cam_rebate_inr": 1372.28
      }
    },
    "meta": {
      "timestamp": "2026-07-29T14:30:05Z",
      "request_id": "req-9802"
    }
  }
  ```

---

### 2.3 Community VPP & Outage Command Center Endpoint
- **Endpoint:** `GET /api/v1/telemetry/community/{community_id}`
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "community_id": "c7a81023-98ab-4123-bcde-890123456789",
      "rwa_name": "Palm Meadows RWA",
      "grid_status": "OUTAGE_DG_ACTIVE",
      "community_vpp_stats": {
        "total_active_homes": 142,
        "total_solar_gen_kw": 284.5000,
        "total_battery_storage_kwh": 1420.0000,
        "aggregate_soc_pct": 81.20,
        "total_community_demand_kw": 310.0000,
        "dg_liters_avoided_today": 96.40,
        "autonomous_survival_hours_remaining": 5.42
      },
      "emergency_triage_summary": {
        "tier_0_medical_homes_active": 8,
        "tier_1_lifeline_homes_active": 12,
        "tier_3_shed_loads_count": 45
      }
    },
    "meta": { "request_id": "req-9803" }
  }
  ```

---

### 2.4 Monthly Ledger Settlement Export Endpoint
- **Endpoint:** `POST /api/v1/ledger/settle`
- **Role Required:** `RWA_ADMIN`
- **Request Body (JSON):**
  ```json
  {
    "community_id": "c7a81023-98ab-4123-bcde-890123456789",
    "billing_year": 2026,
    "billing_month": 7
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "community_id": "c7a81023-98ab-4123-bcde-890123456789",
      "billing_period": "2026-07",
      "total_homes_settled": 142,
      "total_community_given_kwh": 14500.0000,
      "total_community_received_kwh": 14500.0000,
      "total_dg_savings_inr": 239250.00,
      "erp_export_url": "https://api.cee-ai.in/v1/export/mygate/PALM-MEADOWS-089/2026-07.json"
    },
    "meta": { "request_id": "req-9804" }
  }
  ```

---

## 3. Real-Time WebSocket Channel Specification

```
Client App                           CEE-AI WebSocket Server
    │                                           │
    ├── CONNECT wss://api.cee-ai.in/v1/ws       │
    │   Auth: Bearer <JWT>                      │
    │ ────────────────────────────────────────► │
    │ ◄──────────────────────────────────────── │
    │   ACK { "status": "CONNECTED" }           │
    │                                           │
    ├── SUBSCRIBE "community.PALM-089.outage"   │
    │ ────────────────────────────────────────► │
    │                                           │
    │   [14:15 IST - TRANSFORMER FAILS]         │
    │ ◄──────────────────────────────────────── │
    │   EVENT { "topic": "emergency",           │
    │           "status": "OUTAGE_DETECTED",    │
    │           "action": "LOCK_TIER_0" }       │
    ▼                                           ▼
```
