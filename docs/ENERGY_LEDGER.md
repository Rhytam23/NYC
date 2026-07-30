# Energy Credit Ledger Architecture & Mathematical Settlement Specification
**Document:** `docs/ENERGY_LEDGER.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. Executive Summary & Core Architectural Principle
The CEE-AI Energy Ledger operates as a **cryptographically auditable, double-entry relational ledger** built on PostgreSQL 16 + TimescaleDB.
- **Why a Virtual Ledger?** In India, physical direct retail sale of electricity across distribution wires is restricted under **Section 12 of the Electricity Act 2003** unless licensed as a DISCOM.
- **How CEE-AI Complies:** CEE-AI operates as an internal **Virtual Net-Metering & Maintenance Billing Off-Set System** within a single Gated Community / Resident Welfare Association (RWA) or under official DISCOM Group Net Metering regulations (DERC, MERC, BESCOM).
- **The Golden Invariant:**
  $$\text{Total Energy Given by Community} = \text{Total Energy Received by Community} + \text{Distribution Line Losses}$$

---

## 2. Double-Entry Accounting Model (CEE Credits)
Each household $i$ has three primary ledger balances tracked in kilowatt-hours (kWh) and equivalent **CEE Credits** (1 CEE Credit = 1 kWh):

```
+-------------------------------------------------------------------------------+
|                       HOUSEHOLD ACCOUNT LEDGER (HOME A)                       |
|                                                                               |
|  +---------------------+   +---------------------+   +---------------------+  |
|  |    ENERGY GIVEN     |   |   ENERGY RECEIVED   |   | NET ENERGY BALANCE  |  |
|  |      180.5 kWh      |   |      20.0 kWh       |   |   +160.5 Credits    |  |
|  +---------------------+   +---------------------+   +---------------------+  |
+-------------------------------------------------------------------------------+
```

### 2.1 The Net Energy Balance Equation
For any billing cycle $[T_{\text{start}}, T_{\text{end}}]$, the net energy credit balance for household $i$ is:
$$\text{NetEnergyBalance}_i = \sum_{t=T_{\text{start}}}^{T_{\text{end}}} \left( E_{\text{given}, i}^{(t)} - E_{\text{received}, i}^{(t)} \right)$$
- **If $\text{NetEnergyBalance}_i > 0$:** Home $i$ is a **Net Surplus Provider**.
- **If $\text{NetEnergyBalance}_i < 0$:** Home $i$ is a **Net Deficit Consumer**.
- **If $\text{NetEnergyBalance}_i = 0$:** Home $i$ is **Neutral**.

---

## 3. Monthly Financial Settlement & CAM Bill Netting Logic
On the 1st of every month at 00:00 IST, the Ledger Service executes the **RWA Clearing Calculation**:

### 3.1 Tariff & Rate Structure (Illustrative Indian Society Rates)
- **RWA Grid Supply Base Rate ($R_{\text{grid}}$):** ₹8.50 / kWh
- **RWA Diesel Generator Rate ($R_{\text{dg}}$):** ₹26.00 / kWh
- **CEE-AI Community Clearing Rate ($R_{\text{clear}}$):** **₹9.50 / kWh**
- **Surplus Provider Credit Rate ($R_{\text{provider}}$):** **₹8.55 / kWh** (90% of clearing rate)
- **Platform SaaS / Netting Commission:** **₹0.95 / kWh** (10% spread)

### 3.2 Monthly RWA CAM Bill Adjustment Formulas
1. **For Net Surplus Provider ($i \in \mathcal{S}$):**
   $$\text{CAM Credit Rebate}_i = \text{NetEnergyBalance}_i \times R_{\text{provider}} \quad \text{(Deducted from RWA Maintenance Bill)}$$
2. **For Net Deficit Consumer ($j \in \mathcal{D}$):**
   $$\text{CEE Backup Surcharge}_j = |\text{NetEnergyBalance}_j| \times R_{\text{clear}} \quad \text{(Added to RWA Maintenance Bill)}$$
   - *Consumer Savings:* Compared to DG power, the consumer saves:
     $$\text{Net Savings}_j = |\text{NetEnergyBalance}_j| \times (R_{\text{dg}} - R_{\text{clear}}) = |\text{NetEnergyBalance}_j| \times \text{₹16.50/kWh}$$

---

## 4. Ledger Verification & Anti-Double-Billing Invariants
To prevent duplicate billing between the DISCOM meter, the RWA sub-meter, and the CEE-AI ledger, the system enforces three invariants before generating the monthly CSV export:
1. **Invariant 1 (Zero Sum Netting):**
   $$\sum_{i=1}^{N} \text{NetEnergyBalance}_i + E_{\text{common area consumed}} = 0$$
2. **Invariant 2 (Monotonicity of Given/Received):**
   `energy_given_kwh` and `energy_received_kwh` counters can only increase during an open billing period.
3. **Invariant 3 (No Self-Trading):**
   A household can never be recorded as both provider and consumer in the same 15-minute settlement interval $t$.

---

## 5. Automated ERP Export Format (MyGate / NoBrokerHood Integration)
The Monthly Settlement Service produces a signed JSON schema compliant with Indian RWA ERP import standards:

```json
{
  "rwa_id": "PALM-MEADOWS-089",
  "billing_period": "2026-07",
  "generated_at": "2026-08-01T00:00:05Z",
  "settlement_currency": "INR",
  "clearing_rate_per_kwh": 9.50,
  "provider_rate_per_kwh": 8.55,
  "ledgers": [
    {
      "home_id": "home-villa-104",
      "resident_name": "Rajesh Sharma",
      "mygate_flat_id": "V-104",
      "energy_given_kwh": 180.50,
      "energy_received_kwh": 20.00,
      "net_energy_balance_kwh": 160.50,
      "cam_bill_adjustment_inr": -1372.28,
      "adjustment_type": "CREDIT_REBATE",
      "dg_liters_saved_equivalent": 48.15
    },
    {
      "home_id": "home-apt-402",
      "resident_name": "Dr. Meenakshi Sundaram",
      "mygate_flat_id": "A-402",
      "energy_given_kwh": 0.00,
      "energy_received_kwh": 40.00,
      "net_energy_balance_kwh": -40.00,
      "cam_bill_adjustment_inr": 380.00,
      "adjustment_type": "DEBIT_SURCHARGE",
      "net_savings_vs_dg_inr": 660.00
    }
  ]
}
```
