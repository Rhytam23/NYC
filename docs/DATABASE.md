# Database Architecture & PostgreSQL / TimescaleDB Schema Specification
**Document:** `docs/DATABASE.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. Complete Entity-Relationship (ER) Topology

```
+--------------------+        1:N        +-----------------------+
|    communities     | ────────────────► |         homes         |
+--------------------+                   +-----------------------+
          │                                  │        │
          │ 1:N                              │ 1:N    │ 1:N
          ▼                                  ▼        ▼
+--------------------+                   +---------------+   +------------------------+
| monthly_settlement |                   |   inverters   |   |    energy_telemetry    |
|    _statements     |                   |  (hal_auth)   |   | (TimescaleDB Hypertable)|
+--------------------+                   +---------------+   +------------------------+
                                                                      │
                                                                      │ 1:N
                                                                      ▼
                                                             +------------------------+
                                                             |  ledger_transactions   |
                                                             | (15-min Netting Rows)  |
                                                             +------------------------+
```

---

## 2. PostgreSQL 16 + TimescaleDB Complete SQL Schema (DDL)

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

--------------------------------------------------------------------------------
-- 1. COMMUNITIES TABLE (Gated Societies / RWAs)
--------------------------------------------------------------------------------
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rwa_name VARCHAR(255) NOT NULL,
    rwa_code VARCHAR(64) UNIQUE NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL DEFAULT 'Karnataka',
    discom_name VARCHAR(128) NOT NULL DEFAULT 'BESCOM',
    grid_tariff_inr DECIMAL(10, 4) NOT NULL DEFAULT 8.5000,
    dg_tariff_inr DECIMAL(10, 4) NOT NULL DEFAULT 26.0000,
    clearing_rate_inr DECIMAL(10, 4) NOT NULL DEFAULT 9.5000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 2. HOMES TABLE (Households within a Community)
--------------------------------------------------------------------------------
CREATE TYPE emergency_tier AS ENUM ('TIER_0_MEDICAL', 'TIER_1_LIFELINE', 'TIER_2_BASIC', 'TIER_3_DEFERRABLE');

CREATE TABLE homes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    resident_name VARCHAR(255) NOT NULL,
    mygate_flat_id VARCHAR(64) NOT NULL,
    emergency_tier emergency_tier NOT NULL DEFAULT 'TIER_2_BASIC',
    min_soc_reserve_pct INTEGER NOT NULL DEFAULT 35 CHECK (min_soc_reserve_pct BETWEEN 15 AND 90),
    has_solar BOOLEAN NOT NULL DEFAULT FALSE,
    has_battery BOOLEAN NOT NULL DEFAULT FALSE,
    has_ev BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_community_flat UNIQUE (community_id, mygate_flat_id)
);

CREATE INDEX idx_homes_community ON homes(community_id);

--------------------------------------------------------------------------------
-- 3. INVERTERS & METERS (Hardware Abstraction Layer Credentials)
--------------------------------------------------------------------------------
CREATE TYPE oem_provider AS ENUM ('ENPHASE', 'GOODWE', 'SOLAREDGE', 'SUNGROW', 'GENUS_METER', 'LNT_METER');

CREATE TABLE inverters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    oem_provider oem_provider NOT NULL,
    serial_number VARCHAR(128) NOT NULL,
    nameplate_capacity_kw DECIMAL(10, 4) NOT NULL,
    max_export_kw DECIMAL(10, 4) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    auth_credentials_enc TEXT NOT NULL, -- AES-256-GCM encrypted OAuth token/secret
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_serial UNIQUE (oem_provider, serial_number)
);

CREATE INDEX idx_inverters_home ON inverters(home_id);

--------------------------------------------------------------------------------
-- 4. ENERGY TELEMETRY (TimescaleDB Hypertable — 15s to 60s pulses)
--------------------------------------------------------------------------------
CREATE TABLE energy_telemetry (
    time TIMESTAMPTZ NOT NULL,
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    solar_gen_kw DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    battery_soc_pct DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    battery_flow_kw DECIMAL(10, 4) NOT NULL DEFAULT 0.0000, -- Positive = charge, Negative = discharge
    home_demand_kw DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    grid_import_kw DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    grid_export_kw DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    grid_status VARCHAR(32) NOT NULL DEFAULT 'NORMAL' -- NORMAL | OUTAGE_DG_ACTIVE | CYCLONE_ALERT
);

-- Convert to TimescaleDB hypertable partitioned by time (chunk time interval: 7 days)
SELECT create_hypertable('energy_telemetry', 'time', chunk_time_interval => INTERVAL '7 days');
CREATE INDEX idx_telemetry_home_time ON energy_telemetry (home_id, time DESC);

--------------------------------------------------------------------------------
-- 5. LEDGER TRANSACTIONS (15-Minute Net Energy Credit Accounting)
--------------------------------------------------------------------------------
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    interval_start TIMESTAMPTZ NOT NULL,
    interval_end TIMESTAMPTZ NOT NULL,
    energy_given_kwh DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    energy_received_kwh DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    net_energy_balance_kwh DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    clearing_rate_inr DECIMAL(10, 4) NOT NULL DEFAULT 9.5000,
    net_value_inr DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    audit_signature VARCHAR(256) NOT NULL, -- HMAC-SHA256 hash of record for immutability
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_home_interval ON ledger_transactions(home_id, interval_start, interval_end);

--------------------------------------------------------------------------------
-- 6. MONTHLY SETTLEMENT STATEMENTS (RWA CAM Billing Export Table)
--------------------------------------------------------------------------------
CREATE TYPE settlement_status AS ENUM ('DRAFT', 'CLOSED_EXPORTED', 'DISPUTED');

CREATE TABLE monthly_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    billing_year INTEGER NOT NULL,
    billing_month INTEGER NOT NULL,
    total_energy_given_kwh DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    total_energy_received_kwh DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    net_energy_balance_kwh DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    cam_bill_adjustment_inr DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    dg_liters_saved_equivalent DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    status settlement_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_home_billing_cycle UNIQUE (home_id, billing_year, billing_month)
);

CREATE INDEX idx_settlements_community ON monthly_settlements(community_id, billing_year, billing_month);
```

---

## 3. TimescaleDB Continuous Aggregates for Real-Time Ledgers
To compute instant dashboard ledger balances without scanning millions of raw rows, implement the following continuous aggregate:

```sql
CREATE MATERIALIZED VIEW hourly_home_energy_summary
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket_time,
    home_id,
    SUM(grid_export_kw * 0.0166667) AS total_given_kwh,    -- 60-second samples -> kWh
    SUM(grid_import_kw * 0.0166667) AS total_received_kwh
FROM energy_telemetry
GROUP BY bucket_time, home_id;
```
