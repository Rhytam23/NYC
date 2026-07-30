# Complete Security Architecture & Zero-Trust Threat Model
**Document:** `docs/SECURITY.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. Zero-Trust Architecture Mandates
The platform operates under the assumption that local apartment Wi-Fi networks and resident devices are untrusted.
- **Hardware Abstraction Layer Security:**
  - OEM cloud OAuth2 refresh tokens (Enphase, GoodWe, SolarEdge, Genus smart meters) MUST NEVER be stored in plaintext. They are encrypted at rest using AES-256-GCM via envelope encryption with AWS KMS / HashiCorp Vault.
  - Telemetry payloads sent from local IoT gateways or smart meters MUST be signed using HMAC-SHA256 (`X-CEE-Signature` header) verified against a unique per-device shared secret.

---

## 2. Cyber-Physical Inverter Safety & Anti-Islanding Protection
- **Anti-Islanding Compliance:**
  - By CEA (Central Electricity Authority of India) and IEEE 1547 standards, grid-tied inverters automatically disconnect within 160ms of a grid outage to prevent backfeeding onto dead DISCOM lines.
  - **CEE-AI Safety Guarantee:** CEE-AI never attempts to override hardware anti-islanding relays. Community energy exchange during outages operates exclusively over isolated RWA internal distribution feeders or dedicated hybrid inverter EPS (Emergency Power Supply) backup buses.
- **Battery Wear & Rate Limiting:**
  - Cloud API dispatch commands are debounced to a maximum of **1 command per 60 seconds** to prevent relay chattering and thermal stress on residential Lithium-ion or LFP battery banks.

---

## 3. Threat Model & Mitigation Matrix (STRIDE Analysis)

| STRIDE Threat Category | Potential Attack Vector | CEE-AI Mitigation Implementation |
| :--- | :--- | :--- |
| **Spoofing** | Rogue node sending fake kWh export telemetry to inflate `Energy Given` ledger credits. | Mandatory mTLS / HMAC signature verification on all ingest webhooks; anomaly detection algorithm flags statistical deviations >3 standard deviations from clear-sky PVLib solar irradiance model. |
| **Tampering** | Resident modifying monthly net energy credit CSV before MyGate CAM billing import. | All ledger rows are cryptographically hashed; monthly settlement files include an RSA-4096 digital signature (`"signature": "308201..."`) verified by the RWA ERP before billing adjustment. |
| **Repudiation** | Homeowner claiming the AI drained their battery without authorization. | Immutable audit table (`audit_logs`) records every dispatch command with timestamp, user SOC reserve floor setting, and reasoning trace. |
| **Information Disclosure** | Neighbor viewing another resident’s specific appliance-level lifestyle patterns. | Granular privacy filters: only aggregate whole-home net import/export and credit balance are visible to the community ledger. |
| **Denial of Service** | DDoS attack against the real-time emergency WebSocket server during a cyclone. | Cloudflare WAF + AWS Shield Advanced; WebSocket connection rate-limited to 5 conns/min per JWT token. |
| **Elevation of Privilege** | Resident changing their tier status to `TIER_0_MEDICAL` to avoid load shedding. | Tier 0 (Medical) status requires verification by the RWA Admin Committee with uploading of a registered doctor’s medical certificate. |
