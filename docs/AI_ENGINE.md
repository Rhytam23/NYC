# AI Engine Architecture, Mathematical Formulations & ML Pipeline
**Document:** `docs/AI_ENGINE.md`  
**Status:** Approved | **Version:** 1.0.0

---

## 1. Executive Overview of the AI Engine
The CEE-AI Core Engine is not a generic LLM wrapper; it is a **cyber-physical time-series forecasting and convex optimization pipeline** running on PyTorch, LightGBM, and SciPy.
It executes four continuous loops:
1. **Demand & Generation Forecasting:** 24-hour horizon at 15-minute resolution.
2. **Weather Intelligence & Outage Probability Prediction:** Real-time IMD / GRIB ingestion for pre-charging.
3. **Emergency Triage & Load Shedding:** Deterministic 4-Tier safety override.
4. **Community Power Matching Solver:** Linear programming optimization to match net surplus with net deficit while preventing DG start-up.

---

## 2. Machine Learning Forecasting Architecture

```
[IMD / OpenWeatherMap GRIB Data] ──┐
                                   ├──► [Feature Engineering Pipeline] ──► [LightGBM / PyTorch TFT]
[Historical Home Telemetry (UTC)] ─┘                                              │
                                                                                  ▼
                                                            [24-Hr Load & Solar Generation Forecast]
                                                                                  │
                                                                                  ▼
                                                            [Convex Optimization Solver (SciPy)]
```

### 2.1 Household Load Demand Forecasting Model
- **Model Architecture:** **LightGBM Regressor** (for low-latency tabular time-series) ensemble with a **Temporal Fusion Transformer (TFT)** in PyTorch for multi-horizon seasonal spikes.
- **Input Features:**
  - Historical consumption lag features: $t-15m, t-1h, t-24h, t-7d$.
  - Calendar features: Day of week, time of day (15-min bins), Indian holiday index.
  - Ambient meteorological features: Dry-bulb temperature (°C), relative humidity (%), wet-bulb temperature.
- **Loss Function:** Quantile Loss ($P_{50}, P_{90}$) to predict both expected load and upper-bound air conditioning surge.

### 2.2 Solar Irradiance & Generation Forecasting Model
- **Model Architecture:** Physical Clear-Sky Solar Model (PVLib) calibrated with **LightGBM Residual Correction** using real-time cloud opacity from satellite GRIB feeds.
- **Output:** Predicted rooftop generation ($P_{\text{solar}, i}^{(t)}$) for household $i$ at time interval $t$.

---

## 3. Weather Intelligence & Outage Probability Engine
- **The Problem:** In India, monsoons and tropical cyclones (e.g., in Chennai, Kolkata, Mumbai) cause extended multi-day grid blackouts.
- **The Solution:** The `weather-intelligence` pipeline monitors IMD (India Meteorological Department) severe weather alerts and grid frequency sag telemetry.
- **Pre-Charging Threshold Equation:**
  $$\mathbb{P}(\text{Outage}) = f(\text{IMD Alert Level}, \Delta V_{\text{grid}}, \text{Historical Transformer MTBF})$$
  When $\mathbb{P}(\text{Outage}) > 0.65$, the AI Engine sends a `FORCE_CHARGE` command to all participating smart inverters, overriding economic solar self-consumption to bring community battery storage to **100% SOC** before the storm hits.

---

## 4. Community Power Matching Solver (Mathematical Formulation)
At every 15-minute interval $t$, let:
- $\mathcal{S}$ be the set of **Surplus Providers** (homes where $P_{\text{solar}, i}^{(t)} + P_{\text{dis}, i}^{(t)} > P_{\text{load}, i}^{(t)}$).
- $\mathcal{D}$ be the set of **Deficit Consumers** (homes where local generation is insufficient).
- $x_{i, j}^{(t)} \ge 0$ be the energy (kWh) virtually transferred from provider $i \in \mathcal{S}$ to consumer $j \in \mathcal{D}$.

### 4.1 Objective Function (Minimize Energy Waste & DG Dependency)
$$\min_{x} \left( \sum_{j \in \mathcal{D}} w_j \cdot \left( D_j^{(t)} - \sum_{i \in \mathcal{S}} x_{i,j}^{(t)} \right)^+ - \gamma \sum_{i \in \mathcal{S}} \sum_{j \in \mathcal{D}} x_{i,j}^{(t)} \right)$$
where:
- $D_j^{(t)}$ is the net energy deficit of home $j$.
- $w_j$ is the **Triage Priority Weight** ($w_j = 1000$ for Tier 0 Medical; $w_j = 100$ for Tier 1; $w_j = 10$ for Tier 2; $w_j = 1$ for Tier 3).
- $\gamma > 0$ is a small regularization reward for maximizing local peer-to-peer sharing over grid/DG import.

### 4.2 Subject to Immutable Physical & Safety Constraints
1. **Provider Export Limit:**
   $$\sum_{j \in \mathcal{D}} x_{i,j}^{(t)} \le \min \left( \text{MaxExportLimit}_i, \; E_{\text{surplus}, i}^{(t)} \right) \quad \forall i \in \mathcal{S}$$
2. **Battery SOC Safety Floor Constraint (Anti-Hallucination Guardrail):**
   $$\text{SOC}_i^{(t+1)} \ge \text{SOC}_{\text{reserve}, i} \quad (\text{default } 35\% \text{ for Tier 2/3, } 50\% \text{ for Tier 0})$$
3. **Distribution Line Capacity Limit:**
   $$\sum_{i \in \mathcal{S}} \sum_{j \in \mathcal{D}} x_{i,j}^{(t)} \le C_{\text{feeder}}$$

---

## 5. Emergency Prioritization Logic (Deterministic State Machine)

```python
def check_emergency_override(home_state: HomeState, grid_status: str) -> TierAction:
    """
    Deterministic safety override executed before any AI schedule is dispatched.
    """
    if grid_status == "OUTAGE":
        if home_state.tier == Tier.TIER_0_MEDICAL:
            # Life critical: Never shed, guarantee export allocation
            return TierAction(shed_load=False, minimum_soc_floor=0.30, priority_weight=1000)
        elif home_state.tier == Tier.TIER_3_DEFERRABLE:
            # Shed HVAC and EV chargers immediately to preserve community runtime
            return TierAction(shed_load=True, minimum_soc_floor=0.20, priority_weight=1)
    return TierAction(shed_load=False, minimum_soc_floor=home_state.user_reserve_soc, priority_weight=10)
```
