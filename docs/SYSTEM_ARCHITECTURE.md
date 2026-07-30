# System Architecture & Technical Specifications — Community Energy Exchange AI
**Document:** `docs/SYSTEM_ARCHITECTURE.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. Complete System Architecture & Microservices Topology

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
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  |  HAL Gateway Service (`/services/hal-gateway`)                                                    |  |
|  |  • Protocol Translation (Modbus-TCP, MQTT, REST, OCPP) -> Standardized Telemetry Schema           |  |
|  |  • Retry Exponential Backoff & OEM API Rate-Limit Protection (Redis Token Bucket)                 |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------+-----------------------------------------------------+
                                                    |
                                                    | Unified JSON Telemetry Stream (Apache Kafka / Redis)
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                       CORE BACKEND SERVICES                                             |
|                                                                                                         |
|  +-------------------------------+  +-------------------------------+  +-----------------------------+  |
|  | AI ORCHESTRATION ENGINE       |  | ENERGY LEDGER SERVICE         |  | EMERGENCY ROUTER SERVICE    |  |
|  | (`/services/ai-engine`)       |  | (`/services/ledger-svc`)      |  | (`/services/emergency`)     |  |
|  | • Demand Forecast (LSTM/TFT)  |  | • Immutable Double-Entry      |  | • Grid Outage Detector      |  |
|  | • Solar Forecast (IMD/GRIB)   |  | • Net Energy Balance Engine   |  | • Tier 0-3 Load Triage      |  |
|  | • Convex Optimization Solver  |  | • RWA CAM Bill Netting Engine |  | • DG Avoidance Dispatcher   |  |
|  +-------------------------------+  +-------------------------------+  +-----------------------------+  |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  |  SOCIETY ERP INTEGRATION ENGINE (`/services/erp-integration`)                                     |  |
|  |  • Connectors for MyGate, NoBrokerHood, and Society Maintenance Billing ERPs                      |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------+-----------------------------------------------------+
                                                    |
                                                    | Standardized REST & WebSocket API Gateway
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                  CLIENT & STAKEHOLDER APPLICATIONS                                      |
|                                                                                                         |
|  +-------------------------------------+   +---------------------------------------------------------+  |
|  | Resident Web & Mobile App           |   | RWA Admin Command Center                                |  |
|  | (React / Vite / Tailwind / TS)      |   | (React / Vite / Tailwind / TS — Dark Mode Emergency UI) |  |
|  +-------------------------------------+   +---------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Technical Stack & Justification

| Layer | Recommended Technology | Technical Justification |
| :--- | :--- | :--- |
| **API Gateway & Services** | **Python 3.11+ / FastAPI** | Ultra-fast async I/O (`asyncio`), native Pydantic v2 schema validation, seamless integration with ML/PyTorch ecosystem, and automated OpenAPI spec generation. |
| **Time-Series & Ledger DB** | **PostgreSQL 16 + TimescaleDB** | Delivers enterprise ACID compliance required for immutable energy ledgers while providing hyper-scale time-series ingestion (100k+ metrics/sec) and continuous aggregates for monthly netting. |
| **Message Broker & Queue** | **Redis Streams / Celery** | Low-latency pub/sub for 1-second telemetry pulses and reliable background task workers for OEM API polling and billing calculation. |
| **AI / Machine Learning** | **PyTorch + LightGBM + SciPy** | LightGBM for rapid tabular time-series load forecasting; PyTorch for Temporal Fusion Transformers (TFT); SciPy Linear Programming (`scipy.optimize.linprog`) for optimal energy matching. |
| **Frontend Applications** | **React 18 + Vite + TypeScript + Tailwind CSS** | Fast bundle size, rock-solid type safety, TanStack Query for caching and auto-refetching, and Tailwind for high-contrast dark-mode emergency UI. |
| **Infrastructure & DevOps** | **Docker + Kubernetes (EKS/GKE) + Terraform** | Containerized microservices, horizontal pod autoscaling during weather events, and infrastructure-as-code for repeatable deployments across AWS Mumbai (`ap-south-1`). |

---

## 3. Data Flow Pipelines

### 3.1 Telemetry Ingestion & Ledger Recording Flow
1. **Poll / Push:** `hal-gateway` polls Enphase/GoodWe cloud API or receives L&T smart meter webhooks every 60s.
2. **Normalize:** Payload is transformed into `UnifiedEnergyTelemetry` (with UTC timestamp and `Asia/Kolkata` local tag).
3. **Stream:** Published to Redis Stream topic `telemetry.raw`.
4. **Ingest:** `ledger-svc` subscribes, verifies meter signature, and writes to TimescaleDB hypertable `energy_telemetry`.
5. **Credit Netting:** Every 15-minute boundary, `ledger-svc` computes net export/import delta and inserts immutable credit/debit rows into `ledger_transactions`.
6. **Live UI Pulse:** WebSocket server pushes `LedgerBalanceEvent` to the resident mobile app.

### 3.2 Outage Detection & Emergency Triage Flow
```
[Grid Voltage Drop / DG Signal] 
       │
       ▼
[Emergency Router Service Detects Outage] 
       │
       ├─► 1. Lock Tier 0 (Medical) Batteries (Set minimum SOC floor = 30%)
       │
       ├─► 2. Shed Tier 3 Loads (Send OCPP throttle command to EV chargers, smart plugs)
       │
       ├─► 3. Calculate Community Autonomous Runtime (Total available kWh / Essential kW demand)
       │
       └─► 4. Broadcast Alert to RWA Admin Command Center & Resident Mobile App
```

---

## 4. Deployment Architecture & DevOps Plan

### 4.1 Cloud Infrastructure (AWS India - `ap-south-1` Mumbai Region)
- **VPC Configuration:**
  - **Public Subnets:** Application Load Balancers (ALB) and NAT Gateways.
  - **Private Subnets:** EKS Microservices, Redis Cluster, and TimescaleDB RDS.
  - **Zero Public DB Access:** TimescaleDB and Redis have no public IP; accessible only via IAM-authenticated bastion or private service mesh.
- **High Availability:**
  - Deployed across 3 Availability Zones (`ap-south-1a`, `ap-south-1b`, `ap-south-1c`).
  - Automated database failover with PostgreSQL Multi-AZ RDS.

### 4.2 CI/CD Pipeline (GitHub Actions)
- **Stage 1 (Lint & Static Analysis):** Run `ruff`, `mypy --strict`, and `eslint` on every pull request.
- **Stage 2 (Ledger Invariant Tests):** Run PyTest suite with TimescaleDB containerized service; verify zero-sum energy ledger invariants.
- **Stage 3 (Container Build & Vulnerability Scan):** Build Docker images and scan with Trivy for zero critical vulnerabilities.
- **Stage 4 (Staging Deployment):** Automatic deployment to Staging EKS cluster on merge to `develop`.
- **Stage 5 (Production Release):** Tagged release triggers blue-green deployment to Production EKS cluster.
