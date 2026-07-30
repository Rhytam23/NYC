# User Personas & Stakeholder Profiles — Community Energy Exchange AI
**Document:** `docs/USER_PERSONAS.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. Primary User Personas (Indian Residential Society Context)

### Persona 1: Rajesh Sharma (45) — "The Solar EV Tech-Enthusiast" (Net Surplus Provider)
- **Role / Occupation:** VP of Engineering at a multinational tech firm; owns a 4-BHK Villa in Whitefield, Bangalore.
- **Energy Setup:**
  - 8 kWp Rooftop Solar with Enphase Microinverters.
  - 10 kWh Lithium-ion Hybrid Storage Battery.
  - EV Charger (Tata Nexon EV LR - 40.5 kWh battery).
- **Pain Points:**
  - Frustrated that during sunny peak hours, his battery is 100% full by 11:30 AM and his excess solar is exported to BESCOM for a paltry ₹2.80/kWh.
  - Wants to support his neighbors during power cuts without risking his own family’s evening battery reserves.
- **Goals with CEE-AI:**
  - Earn a fair return (~₹8.55/kWh) on surplus clean energy credited directly against his ₹12,000 monthly RWA maintenance bill.
  - Set a strict **35% minimum SOC reserve** so his home never runs out of backup power.

---

### Persona 2: Dr. Meenakshi Sundaram (68) — "The Medical Lifeline Resident" (Net Deficit Consumer)
- **Role / Occupation:** Retired Pediatrician; lives with her elderly husband (who uses a home oxygen concentrator and CPAP machine) in a 3-BHK apartment in DLF Phase 5, Gurgaon.
- **Energy Setup:**
  - Basic 1.5 kVA Lead-Acid Inverter (drains in 45 minutes when grid drops).
  - No rooftop solar access (apartment on the 4th floor).
- **Pain Points:**
  - Terrified of summer grid failures and the 10–15 minute delay before the society Diesel Generator fires up or when the DG trips due to overload.
  - High monthly maintenance surcharge for DG diesel fuel (often ₹3,500+ extra per month).
- **Goals with CEE-AI:**
  - Registered as a **Tier 0 (Life Critical - Medical)** household.
  - Guaranteed continuous, zero-interruption virtual power from community solar/battery reserves during grid drop.
  - Pays clean community energy rates instead of dirty, expensive DG diesel rates.

---

### Persona 3: Col. V. K. Nair (Retd.) (62) — "The RWA President & Treasurer" (Society Administrator)
- **Role / Occupation:** President of Palm Meadows Resident Welfare Association (RWA) — 280 Villas & Apartments.
- **Energy Setup:**
  - Oversees a 250 kVA centralized Diesel Generator set and common area lighting/pumps.
- **Pain Points:**
  - Endless complaints from residents about high monthly Common Area Maintenance (CAM) bills driven by soaring diesel fuel prices (₹92/liter).
  - Noise and black soot pollution from the DG stack ruining the society’s greenery and air quality.
  - Complex manual accounting when residents ask for solar group net-metering rebates.
- **Goals with CEE-AI:**
  - Cut society DG fuel bills by 60%+ through automated AI virtual battery sharing.
  - Automated monthly CSV/JSON export that imports directly into NoBrokerHood/MyGate without manual bookkeeping.

---

## 2. Stakeholder Requirements Matrix

| Persona | Key Metric of Success | Preferred Interface | Primary Action |
| :--- | :--- | :--- | :--- |
| **Rajesh (Surplus Provider)** | Monthly CAM Credit Earned (₹ INR) & Battery Health | Mobile Web App (React) | Configure SOC Floor (35%) & View Real-Time kWh Shared |
| **Dr. Meenakshi (Lifeline Consumer)** | 100% Medical Uptime & DG Surcharge Saved | SMS Alerts / Simple Mobile App | View Tier 0 Protected Status & Outage Survival Hours |
| **Col. Nair (RWA President)** | DG Liters Saved & Zero Accounting Discrepancies | Admin Command Center (Desktop Dark Mode) | View Community VPP Status & Export Monthly Ledger JSON |
