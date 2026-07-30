# Comprehensive User Journeys — Community Energy Exchange AI
**Document:** `docs/USER_JOURNEY.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. User Journey 1: 15-Minute Software-First Onboarding (Surplus Homeowner)

```
[Resident Opens CEE-AI App] ──► [Selects Society & RWA ID] ──► [Authenticates OEM Inverter Cloud (Enphase/GoodWe OAuth)]
                                                                               │
                                                                               ▼
[AI Engine Runs 7-Day Shadow Telemetry Audit] ◄── [Sets Minimum Battery SOC Floor (e.g., 30%)]
                 │
                 ▼
[First Clean Energy Credit Earned on RWA CAM Bill!]
```

### 1.1 Detailed Step-by-Step
1. **RWA Verification:** Rajesh downloads the CEE-AI app and enters his society code (`PALM-MEADOWS-089`). The app verifies his tenancy via MyGate token.
2. **Hardware Authentication:** Without installing any physical box, Rajesh taps "Connect Inverter" and logs into his Enphase Enlighten API account via secure OAuth2.
3. **Safety Configuration:** He sets his **Emergency Battery Reserve Floor** slider to **35%**. The AI guarantees his battery will never discharge below 35% for neighbor sharing.
4. **Instant Activation:** Within 60 seconds, his solar production and battery state of charge appear on his dashboard, ready to earn clean energy credits.

---

## 2. User Journey 2: Automated Grid Outage & Emergency Triage Response

```
[14:15 IST — DISCOM Grid Voltage Drops to 0V (Monsoon Storm)]
                           │
                           ▼
     [CEE-AI Emergency Router Service Detects Blackout]
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
[Locks Tier 0 Medical Homes]           [Sheds Tier 3 Loads]
(Dr. Meenakshi's Oxygen stays      (Rajesh's EV charging throttles;
 powered via virtual community bus)  export redirected to shared feeder)
       │                                       │
       └───────────────────┬───────────────────┘
                           ▼
  [Community Survives 4 Hrs 18 Mins Autonomous Runtime]
        [0 Liters Diesel Burned — DG Avoided]
```

### 2.1 Detailed Step-by-Step
1. **The Alert:** At 2:15 PM, a monsoon branch knocks out the local DISCOM transformer.
2. **Instant Triage:** The `emergency-router` microservice receives voltage-drop telemetry and immediately shifts the society into **Emergency Command Mode**.
3. **Tier 0 Lifeline Protection:** Dr. Meenakshi’s apartment (Tier 0 Medical) is prioritized. Her home inverter/sub-meter continues drawing 800W from the shared distribution feeder.
4. **Load Shedding & Export:** Rajesh’s EV charger is automatically paused via OCPP 1.6 cloud command. His Enphase inverter exports 1.5 kW into the internal RWA secondary line to balance Dr. Meenakshi and 3 other homes.
5. **The Outcome:** The power cut lasts 3 hours. The society Diesel Generator never starts. The community saves 240 liters of diesel (₹22,080 saved in one afternoon).

---

## 3. User Journey 3: Monthly Net Ledger Settlement & RWA CAM Billing Export

```
[1st of Month — 00:00:00 IST] ──► [Ledger Service Aggregates 15-min Intervals]
                                                  │
                                                  ▼
     [Calculates Net Energy Balance for Every Household: Given vs. Received]
                                                  │
                                                  ▼
     [Applies RWA Clearing Rate (₹9.50/kWh) & Deducts 10% Platform Fee]
                                                  │
                                                  ▼
[Generates Immutable CSV/JSON Settlement File] ──► [Auto-Imports to MyGate / NoBrokerHood RWA Billing]
```

### 3.1 Detailed Step-by-Step
1. **Automated Closing:** On the 1st of each month, `ledger-svc` closes the accounting period for Palm Meadows RWA.
2. **Net Calculation:**
   - Rajesh: Given 180 kWh, Received 20 kWh -> **Net Balance: +160 CEE Credits**.
   - Dr. Meenakshi: Given 0 kWh, Received 40 kWh -> **Net Balance: -40 CEE Credits**.
3. **CAM Bill Adjustments:**
   - Rajesh receives an **₹1,368 credit rebate** on his monthly ₹12,000 maintenance bill (`160 kWh * ₹8.55`).
   - Dr. Meenakshi pays a **₹380 clean backup surcharge** (`40 kWh * ₹9.50`), saving ₹660 compared to DG diesel rates.
4. **Transparency:** Both users receive a push notification with a link to their itemized, tamper-proof monthly energy statement.
