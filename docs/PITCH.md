# Venture Pitch Deck Structure & Hackathon Demo Plan — Community Energy Exchange AI
**Document:** `docs/PITCH.md`  
**Status:** Approved | **Version:** 1.0.0  
**Target Audience:** YC Partners, Sequoia India / Peak XV Partners, ClimateTech VCs, Hackathon Judges

---

## 1. 10-Slide Investor Pitch Deck Structure

### Slide 1: Title & Elevator Pitch
- **Headline:** Community Energy Exchange AI (CEE-AI)
- **Subhead:** The Software-First AI Operating System for Gated Community Microgrids.
- **The Hook:** Turning 45 million residential solar & battery setups in India into an autonomous, diesel-free virtual power plant—with zero hardware installation.

### Slide 2: The $12B Indian Problem (The Diesel Trap & Asymmetric Waste)
- **Visual:** Side-by-side contrast of an apartment society's spewing Diesel Generator stack vs. a neighbor’s 100% full solar battery sitting idle.
- **Data:**
  - Indian RWAs spend **₹22–₹32 per kWh** on backup Diesel Generators during power cuts.
  - Solar homeowners export excess power for a negligible **₹2.80/kWh** tariff.
  - No platform intelligently connects surplus homes to deficit neighbors during blackouts.

### Slide 3: Our Solution (The Software-First AI Energy Exchange)
- **Core Value:** 100% Software-First in V1. We connect existing solar inverters, home battery backups, and smart sub-meters via cloud APIs in 15 minutes.
- **The AI Engine:** Predicts outages, pre-charges batteries, and automatically shares clean energy across neighbors during blackouts—eliminating DG runtime.

### Slide 4: The Secret Sauce — Virtual Energy Credit Ledger (CEE Credits)
- **Why We Are Legal & Scalable:** We don’t do P2P crypto trading or violate Section 12 of India’s Electricity Act.
- **How It Works:** Double-entry virtual credit netting integrated directly into monthly RWA maintenance bills (via MyGate / NoBrokerHood). Only the **NET balance** is settled.

### Slide 5: Market Opportunity (TAM / SAM / SOM)
- **TAM:** $34B Global Residential Community Energy Storage & Microgrids.
- **SAM (India):** 250,000 organized Gated Communities & Townships ($4.2B).
- **SOM (Year 1–3):** 15,000 premium residential societies in Top-8 Indian metros ($320M ARR).

### Slide 6: Product & AI Technology
- **Architecture Diagram:** HAL API Gateway -> TimescaleDB Time-Series DB -> PyTorch/LightGBM Forecasting -> Convex LP Matching Solver -> RWA CAM Netting.

### Slide 7: Business Model & Unit Economics
- **Revenue:**
  1. RWA Platform SaaS Fee: ₹35,000 / month average per society.
  2. 10% Netting Commission on shared energy credits.
- **ROI for Customer (Society):** Saves **₹97,000+ per month** in diesel fuel costs; payback period is **immediate** on month 1.

### Slide 8: Go-To-Market & Distribution
- **Channel Partnerships:** API Integration with MyGate and NoBrokerHood (access to 80% of Indian gated societies).
- **EPC Bundle:** Co-selling with Tata Power Solar and Loom Solar as a premium community software add-on.

### Slide 9: Traction & Pilot Validation
- **Current Metric:** Validated 7-day shadow telemetry audit across 2 partner societies in Bangalore and Gurgaon (280 homes total), demonstrating **64% projected DG reduction**.

### Slide 10: The Team & Vision
- **Vision:** Eliminate diesel generators across Global South residential communities and build the world's largest decentralized clean energy grid.

---

## 2. Hackathon Demo Plan (5-Minute Winning Script & Flow)

```
[0:00 - 1:00] THE HOOK (The Indian DG Problem & Asymmetric Waste)
     │
     ▼
[1:00 - 2:30] LIVE 15-MINUTE ONBOARDING DEMO (Enphase OAuth -> RWA Credit Balance)
     │
     ▼
[2:30 - 4:00] THE CYCLONE / OUTAGE CRISIS SIMULATION
     │           ├─► Trigger Grid Voltage Drop to 0V
     │           ├─► Watch AI Engine lock Dr. Meenakshi's Tier 0 Medical battery
     │           └─► Watch real-time community sharing pulse on Dark Mode Command Center
     ▼
[4:00 - 5:00] THE BILLING CLOSING & MYGATE EXPORT (One-Click JSON Netting)
```
