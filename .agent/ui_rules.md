# Community Energy Exchange AI — UI/UX Design System & Rules
**File:** `.agent/ui_rules.md`
**Version:** 1.0.0 (Production / Full Agent Mode)

---

## 1. UI/UX Core Principles
1. **Calm Under Crisis:**
   - During normal operation, the interface is serene, informational, and unobtrusive.
   - During a power outage or severe weather alert, the interface transforms into a **high-clarity, high-contrast Emergency Command Center** showing remaining community battery hours, active sharing routes, and lifeline status.
2. **Glanceable Energy Metrics:**
   - Always display energy quantities with units (`kWh`, `kW`, `% SOC`).
   - Use color codes consistently:
     - **Green (`#10B981`):** Clean solar generation / Net energy provider / Positive CEE Credit balance.
     - **Blue (`#3B82F6`):** Battery storage / Active sharing.
     - **Amber (`#F59E0B`):** Warning / High demand / Pre-charging for weather alert.
     - **Red (`#EF4444`):** Emergency / Grid Outage / Medical Tier 0 active / Low SOC (<20%).

---

## 2. Design Tokens (Tailwind CSS Configuration)
- **Primary Palette (Deep Emerald - Energy & Sustainability):**
  - `primary-50`: `#ecfdf5`
  - `primary-500`: `#10b981`
  - `primary-700`: `#047857`
  - `primary-900`: `#064e3b`
- **Dark Mode Backgrounds (Required for Command Center feel):**
  - `bg-surface-dark`: `#0f172a` (Slate 900)
  - `bg-card-dark`: `#1e293b` (Slate 800)
  - `text-primary-dark`: `#f8fafc` (Slate 50)
- **Typography:**
  - Font Family: `Inter`, system-ui, -apple-system, sans-serif.
  - Monospace (for meters, ledger balances, and telemetry): `JetBrains Mono`, `Fira Code`, monospace.

---

## 3. Mandatory Component Rules
1. **Energy Flow Visualizer (`<EnergyFlowGraph />`):**
   - Must visually depict real-time power flows between Solar, Battery, Household Load, Community Bus, and Grid/DG.
   - Use animated vectors or SVG pulses where animation speed is proportional to kW power transfer.
2. **Net Energy Ledger Badge (`<LedgerBalanceBadge />`):**
   - Must show formatted net balance: e.g., `+18.50 CEE Credits (Net Provider)` or `-4.20 CEE Credits (Net Receiver)`.
   - Never show raw unformatted decimal numbers.
3. **Outage Survival Ticker (`<CommunitySurvivalClock />`):**
   - A prominent countdown badge displayed during outages: `Estimated Community Autonomous Runtime: 14 hrs 32 mins (DG Avoided)`.

---

## 4. Accessibility & Responsive Constraints
- Minimum tap target size on mobile: **48x48px**.
- Contrast ratio: Minimum **4.5:1** for body text, **3:1** for UI icons and headings.
- Full screen reader (`aria-label`, `role`) support for real-time telemetry updates.
