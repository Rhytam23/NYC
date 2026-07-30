# Product Requirements Document (PRD) — Community Energy Exchange AI (CEE-AI)
**Document:** `docs/PRD.md`  
**Status:** Approved | **Version:** 1.0.0  
**Target Market:** India First (Gated Communities, Residential Societies, Townships) -> Global Scalability

---

## 1. Problem Validation & Deep-Dive
### 1.1 The Asymmetric Resilience & Waste Problem
In urban and semi-urban India (e.g., Bangalore, Gurgaon, Mumbai, Hyderabad, Pune, Chennai), residential communities suffer from frequent grid power disruptions caused by monsoon storms, transformer failures, peak-hour load shedding, and grid maintenance.
- **Current Residential Infrastructure:**
  - **The Surplus Homes:** 25–40% of premium apartments and villas have invested in 3–10 kWp rooftop solar, lithium-ion/tubular battery backup inverters, and EV chargers. During daytime power outages or grid normal hours, their batteries sit at 90–100% State of Charge (SOC) while solar generation is curtailed or exported to the grid at low net-metering feed-in tariffs (₹2.20–₹3.50/kWh).
  - **The Deficit Homes:** 60–75% of homes have modest lead-acid inverters (1–1.5 kVA) or zero backup power. During outages lasting >45 minutes, they lose power for critical medical devices (oxygen concentrators, nebulizers, CPAP machines), refrigeration, and remote work infrastructure.
  - **The Diesel Generator (DG) Trap:** Resident Welfare Associations (RWAs) rely on massive centralized Diesel Generators (100–500 kVA) that kick in automatically when the DISCOM grid drops. DG power costs between **₹22 and ₹32 per kWh** (fuel + maintenance + capital amortization), generates severe particulate/noise pollution, and burns community maintenance funds.

### 1.2 Why Existing Solutions Fail
| Category | Why It Fails for Community Resilience |
| :--- | :--- |
| **Smart Home Apps (Apple Home, Google Home)** | Focused on comfort and novelty (lights, thermostats); zero understanding of battery SOC, inverter dispatch, or community distribution physics. |
| **Electricity Dashboard Apps (Sense, Emporia)** | Passive monitoring only; lacks automated power routing, peer-to-peer netting, or emergency triage. |
| **Hardware Microgrid Companies** | Require expensive custom hardware boxes, panel rewiring, and physical relays ($2,000+ per home), creating a massive adoption barrier. |
| **DISCOM Net Metering** | Slow, bureaucratic, and only interacts with the central grid—does not enable neighbor-to-neighbor sharing during a local blackout. |

---

## 2. Market Research & Competitor Analysis
### 2.1 Total Addressable Market (TAM, SAM, SOM)
- **TAM:** Global residential community energy storage & microgrid management software: **$34 Billion** by 2030.
- **SAM (India):** ~250,000 organized Gated Communities, Apartment Societies, and Townships in India housing 45+ million households: **$4.2 Billion**.
- **SOM (Year 1–3 Focus):** ~15,000 premium residential societies in Top-8 Indian cities with existing solar/battery penetration and MyGate/NoBrokerHood ERP adoption: **$320 Million**.

### 2.2 Competitor & Gap Analysis
```
                       HIGH COMMUNITY INTEGRATION
                                   ^
                                   |
                                   |         ★ CEE-AI (Our Platform:
                                   |           Software-First, Virtual Netting,
                                   |           AI Emergency Triage)
                                   |
    LOW AI AUTONOMY <--------------+--------------> HIGH AI AUTONOMY
                                   |
       Enphase / SolarEdge Apps    |         Tesla Autobidder (Utility Scale /
       (Siloed Home-Only)          |         No RWA P2P Netting)
                                   |
                                   |   Power Ledger (Crypto/Blockchain,
                                   |   High friction, not India-ready)
                                   v
                       LOW COMMUNITY INTEGRATION
```

---

## 3. Product Vision, Mission & Core Philosophy
- **Vision:** A world where residential communities are 100% energy-autonomous, zero-carbon, and immune to power grid disasters through AI-orchestrated collective energy sharing.
- **Mission:** Build the software-first operating system for community energy exchange that transforms fragmented residential solar and battery storage into a resilient, self-healing virtual microgrid.
- **Core Philosophy:**
  1. **Software First, Zero Hardware Gatekeeping:** Work with what homes already own.
  2. **Energy Credit Ledger Over P2P Cash Trading:** Never turn neighbors into stock traders; let AI net clean kilowatt-hours seamlessly on the monthly RWA maintenance bill.
  3. **Life-Critical Safety First:** Always protect Tier 0 medical devices and survival infrastructure above financial optimization.

---

## 4. Stakeholders & Target Audience
1. **Resident — Surplus Provider (e.g., "The Solar EV Homeowner"):** Wants to maximize return on their solar/battery investment and support neighbors without draining their own battery below reserve.
2. **Resident — Deficit Consumer (e.g., "The Elderly Medical Resident"):** Needs guaranteed backup power for medical oxygen and essential appliances during blackouts.
3. **RWA / Society Management Committee (President / Treasurer):** Wants to cut monthly Diesel Generator diesel fuel bills by 60–80% and simplify society utility accounting.
4. **DISCOM / Grid Operator:** Wants peak-load shaving and green demand response during transformer stress.

---

## 5. Unique Value Proposition (UVP)
1. **Zero-Hardware V1 Onboarding:** Connects to Enphase, GoodWe, SolarEdge, Genus smart meters, and RWA ERPs via cloud API in 15 minutes.
2. **AI Emergency Triage Engine:** Automatically predicts outages and pre-charges batteries, then dynamically routes power to medical and lifeline appliances first.
3. **Double-Entry CEE Credit Ledger:** Fully compliant with Indian Electricity Act Section 12 via Virtual/Group Net Metering and RWA Common Area Maintenance (CAM) netting.
4. **DG Elimination Engine:** Uses community surplus storage as a Virtual Power Plant (VPP) to delay or eliminate diesel generator firing.

---

## 6. Detailed User Stories & Feature Prioritization
### 6.1 Feature Prioritization Matrix (MoSCoW)
- **Must Have (MVP - V1):**
  - Cloud API connectors for top inverter & smart meter OEMs (HAL).
  - Double-entry Net Energy Credit Ledger (`CEE Credits`).
  - AI 24-hr Demand & Solar Forecasting.
  - Outage Detection & 4-Tier Emergency Triage.
  - RWA Admin Command Center & Resident Web/Mobile App.
  - Automated Monthly RWA Billing Export (JSON/CSV for MyGate/NoBrokerHood).
- **Should Have (V1.5):**
  - IMD Weather / Cyclone alert pre-charging.
  - EV Smart Charger bidirectional V2H orchestration.
  - Gamified community carbon savings leaderboard.
- **Could Have (V2.0):**
  - Automated OpenADR 2.0b DISCOM demand response signaling.
  - Custom hardware integration (AI Energy Hub, ATS Relay).
- **Won't Have (V1):**
  - Blockchain/crypto tokenization or direct fiat micro-transactions between neighbors.

---

## 7. Core Functional Requirements (PRD Specifications)
### 7.1 Automated Inverter & Meter Telemetry Normalization
- System shall poll or receive webhooks from registered household inverters and smart sub-meters every 60 seconds (15 seconds during active emergency triage).
- System shall normalize telemetry into a standard payload containing: `home_id`, `timestamp`, `solar_gen_kw`, `battery_soc_pct`, `battery_flow_kw`, `home_demand_kw`, `grid_status`, and `export_limit_kw`.

### 7.2 AI Energy Routing & Peer-to-Peer Virtual Netting
- System shall calculate every 15 minutes the `Net Available Supply` and `Net Required Demand` across all participating homes.
- During normal grid operation, the AI Engine shall dispatch export recommendations to surplus inverters to feed the community common distribution bus, while crediting the provider's ledger account and debiting the consumer's account.

### 7.3 Four-Tier Emergency Triage Engine
During a detected grid blackout, the platform shall enforce the following strict priority hierarchy:
1. **Tier 0 (Life Critical - Medical):** Oxygen concentrators, respirators, insulin refrigeration. Minimum battery reserve: **30% SOC**.
2. **Tier 1 (Community Lifeline):** Water booster pumps, elevator rescue loads, security/gate control.
3. **Tier 2 (Basic Domestic):** Lighting, fans, refrigerator, Wi-Fi router.
4. **Tier 3 (Deferrable):** HVAC/AC, EV charging, pool pumps, washing machines. (Automatically throttled or shed during outages).

### 7.4 Net Energy Credit Ledger (CEE Credits)
- Every household shall have three ledger balances:
  - `Energy Given (kWh)`
  - `Energy Received (kWh)`
  - `Net Energy Balance (kWh)`
- Only the **Net Energy Balance** is settled at the end of the billing cycle (1st of each month at 00:00 IST).
- Net Providers receive credit against their monthly RWA Common Area Maintenance (CAM) fee; Net Consumers pay the RWA community green tariff (e.g., ₹9.50/kWh), which is 65% cheaper than DG power (₹26/kWh).
