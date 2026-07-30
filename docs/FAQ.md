# Deep Technical, Regulatory & Operational FAQ — Community Energy Exchange AI
**Document:** `docs/FAQ.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. Regulatory & Legal FAQ (India Focus)

### Q1: Does peer-to-peer energy sharing violate Section 12 of India’s Electricity Act 2003?
**Answer:** No. Section 12 prohibits the direct retail sale and distribution of electricity across public roads or utility distribution wires without a DISCOM license. CEE-AI complies in two ways:
1. **Internal RWA Virtual Accounting:** Within a single Gated Community / Apartment Complex served by a single HT/LT bulk connection, internal sub-metering and Common Area Maintenance (CAM) billing adjustments are legally permitted and standard practice across India.
2. **Group / Virtual Net Metering Frameworks:** For societies with individual DISCOM meters, CEE-AI operates under official DISCOM Group Net Metering guidelines (e.g., DERC, MERC, BESCOM rules), where exported clean energy is virtually offset against community common area meters.

### Q2: How do we prevent double-billing between DISCOMs, RWAs, and CEE-AI?
**Answer:** CEE-AI never charges for the physical electrons already billed by the DISCOM or RWA sub-meter. Our platform calculates a **Virtual Energy Credit Netting Statement (`CEE Credits`)**. If Home A shares 50 kWh with Home B, Home A receives a ₹427.50 credit rebate on their RWA maintenance bill, and Home B pays a ₹475.00 backup surcharge to the RWA—netting out to zero across the society ledger.

---

## 2. Electrical Engineering & Cyber-Physical FAQ

### Q3: How does V1 share energy without physical relay switches between individual apartments?
**Answer:** In modern Indian gated societies, apartments share an internal secondary distribution bus or common backup feeder. During normal hours, when Home A’s inverter exports 2 kW into the internal society wiring, that 2 kW is physically consumed by neighboring appliances or common area loads (pumps, lifts) along the path of least electrical resistance. CEE-AI’s Hardware Abstraction Layer (HAL) tracks sub-meter telemetry and accounts for this sharing virtually.

### Q4: How does CEE-AI prevent Diesel Generators (DGs) from starting during minor outages?
**Answer:** Indian RWA DGs are controlled by Automatic Mains Failure (AMF) panels that trigger after a 15–30 second voltage drop. CEE-AI interfaces with the AMF controller or Community Gateway. When an outage occurs, if CEE-AI’s AI Engine verifies that aggregate community battery capacity is sufficient to carry the current society load, it signals the AMF panel to inhibit DG ignition—running the society purely on the Virtual Power Plant (VPP).

### Q5: What happens if an inverter’s Wi-Fi drops during a community power outage?
**Answer:** The AI Engine operates on a **Deterministic Fail-Safe Fallback**. If telemetry heartbeat is lost for >120 seconds, the inverter’s local edge firmware automatically reverts to default standalone household self-consumption mode and enforces the user’s pre-set minimum SOC reserve (e.g., 35%), ensuring the homeowner never loses backup power.

---

## 3. Social & RWA Governance FAQ

### Q6: What if a resident complains that their battery degraded because of community sharing?
**Answer:** 
1. **Financial Compensation:** Our clearing rate (₹9.50/kWh) includes a **Battery Amortization Component**, ensuring the provider earns ~₹8.55/kWh—significantly higher than the Levelized Cost of Storage (LCOS) for modern LFP batteries (~₹2.50/kWh wear cost).
2. **Rate-Limit Guardrails:** CEE-AI enforces maximum C-rate limits and debounces commands (max 1 command per 60s) to prevent thermal stress, preserving 10+ year battery lifespans.

### Q7: How are disputes handled if a resident claims they didn't consume the energy billed on their CAM statement?
**Answer:** Every 15-minute netting transaction is signed with an HMAC-SHA256 cryptographic signature (`audit_signature`) and stored in our immutable TimescaleDB ledger. Residents can download an itemized, second-by-second audit trail from their app that matches their Genus/L&T smart sub-meter readings.
