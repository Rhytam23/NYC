# Community Energy Exchange AI — Security, Privacy & Zero-Trust Rules
**File:** `.agent/security_rules.md`
**Version:** 1.0.0 (Production / Full Agent Mode)

---

## 1. Zero-Trust Architecture Mandates
1. **Never Expose Direct Inverter/Meter Credentials:**
   - OEM cloud API tokens (Enphase, GoodWe, SolarEdge, Genus smart meters) MUST be encrypted at rest using AES-256-GCM with envelope encryption via AWS KMS / HashiCorp Vault / Supabase Vault.
   - Never log raw OAuth tokens, API secrets, or resident passwords in application logs.
2. **Mutual TLS (mTLS) & Token Authentication:**
   - All external IoT gateways, smart meters, and edge webhooks must authenticate via mTLS or HMAC-SHA256 signed payloads.
   - API endpoints for resident mobile and RWA admin dashboards require JWT bearer tokens with short expiry (15 minutes access token, 7 days refresh token) and strict role-based access control (RBAC).

---

## 2. Smart Inverter Cyber-Physical Safety
1. **Command Rate Limiting & Debouncing:**
   - Cloud inverters must not be commanded to change charge/discharge rates more frequently than once per **60 seconds** to prevent hardware wear and relay chattering.
2. **Hardware Safety Limits Envelope:**
   - Before executing an AI-recommended discharge or export command, the command MUST be validated against the inverter's nameplate max power rating (`max_export_kw`), battery minimum temperature limits, and minimum SOC floor (`min_soc_limit`, default 20% for normal homes, 30% for Tier 0 medical homes).
3. **Anti-Islanding & Grid Synchronization Compliance:**
   - The software must never override inverter IEEE 1547 / CEA (Central Electricity Authority of India) anti-islanding safety protocols. Inverters automatically disconnect from a dead grid; community sharing during outages operates strictly over isolated RWA secondary feeders or hybrid inverter EPS/UPS backup ports.

---

## 3. Data Privacy & RWA Governance
1. **Granular Privacy Controls:**
   - Residents can hide their exact appliance-level consumption from neighbors. Only aggregate home net import/export and credit balance are visible to the community ledger.
2. **Audit Logging:**
   - Every AI routing decision, emergency triage elevation, and ledger netting transaction must create an immutable, append-only cryptographic audit record in `audit_logs`.
