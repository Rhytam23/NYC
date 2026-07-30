# Community Energy Exchange AI — Product Rules & Decision Guardrails
**File:** `.agent/product_rules.md`
**Version:** 1.0.0 (Production / Full Agent Mode)

---

## 1. Core Product Identity & Philosophy
1. **This is NOT a Smart Home App:**
   - Do NOT build features for turning on living room mood lights, scheduling coffee makers, or controlling individual smart bulbs.
   - The platform operates at the **Home-to-Community Interconnection Layer**—focusing on whole-home energy balance, battery storage, solar export, and critical circuit survival.
2. **This is NOT a Generic Electricity Monitoring Dashboard:**
   - Do NOT stop at passive charts of historical kWh usage.
   - Every dashboard and UI element MUST provide **actionable recommendations, automated AI decisions, or real-time community resilience metrics**.
3. **Software-First & Zero Hardware Gatekeeping:**
   - In Version 1, any household with an existing smart inverter, battery backup, EV charger, or smart sub-meter can join the network in under 15 minutes by authenticating their inverter/meter cloud account or society ERP token.
   - Do NOT require a proprietary gateway box for Version 1 onboarding.

---

## 2. India-First Design Mandates
1. **Indian Residential Society Infrastructure:**
   - Account for typical Indian RWA (Resident Welfare Association) power setups:
     - **Grid Supply:** HT/LT bulk supply from DISCOM (BESCOM, Tata Power, BSES, etc.).
     - **DG Backup:** Shared diesel generators that kick in within 15–30 seconds of grid failure.
     - **Dual-Source Billing:** Societies bill grid power at ~₹7–10/kWh and DG power at ~₹24–30/kWh.
   - **The Product Opportunity:** By sharing solar and battery energy across apartments/villas during outages, CEE-AI prevents the DG from starting for light/medium loads, saving the RWA and residents thousands of rupees per month while eliminating diesel soot.
2. **Medical & Lifeline Protection (Tier 0):**
   - India has frequent monsoon outages, cyclone disruptions, and summer transformer trips.
   - Any household with registered elderly residents, oxygen concentrators, CPAP machines, or insulin refrigeration MUST receive absolute priority during community triage.
3. **Virtual Energy Credit Ledger (CEE Credits):**
   - Direct peer-to-peer retail cash sale of electricity between neighbors is legally complex under Section 12 of India's Electricity Act 2003.
   - Therefore, the product MUST operate on **Energy Credit Netting (CEE Credits)**:
     - 1 CEE Credit = 1 kWh of clean community energy shared.
     - Net credits are settled monthly as debits/credits on the resident's RWA maintenance bill or via virtual green rewards.

---

## 3. Product Feature Anti-Patterns (What NOT to Build)
- **NO Crypto/Blockchain Tokenization:** Do not introduce blockchain, NFTs, or gas fees. The ledger is a high-performance PostgreSQL/TimescaleDB relational database with cryptographic audit logs.
- **NO Hardware Wiring Diagrams in V1:** Do not require electricians to rewire residential panels for V1 deployment. All orchestration is via software cloud APIs and society distribution bus netting.
- **NO Manual Bid/Ask Energy Trading Marketplace:** Homeowners are not stock traders. They do not want to place order books to sell 2 kWh of solar at ₹8.50. The AI Engine automatically clears and matches supply and demand at fair, transparent RWA-governed credit rates.

---

## 4. Prioritization Hierarchy for AI Engine Decisions
When conflicts arise in optimization, the AI Engine MUST obey this priority order:
1. **Priority 1: Human Life & Medical Safety** (Tier 0 loads must never lose power).
2. **Priority 2: Grid & Inverter Electrical Safety** (Never exceed inverter thermal or current limits; prevent backfeeding when grid is down without proper isolation).
3. **Priority 3: Community Outage Survival Duration** (Maximize total hours the community can survive without grid or DG).
4. **Priority 4: Financial & Energy Waste Minimization** (Prevent solar curtailment; maximize local consumption of rooftop solar).
5. **Priority 5: Individual Cost Optimization** (Minimize individual net energy import costs).
