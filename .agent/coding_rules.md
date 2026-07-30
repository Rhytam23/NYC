# Community Energy Exchange AI — AI Agent Coding & Anti-Hallucination Rules
**File:** `.agent/coding_rules.md`
**Version:** 1.0.0 (Production / Full Agent Mode)

---

## 1. Absolute Anti-Hallucination Commandments
1. **Never Invent APIs:**
   - You MUST NOT import or reference fictional Python/Node libraries for hardware (e.g., do NOT invent `import enphase_magic_sdk`).
   - Use standard HTTP clients (`httpx`, `requests`, `axios`) against officially documented REST schemas defined in `docs/API_SPEC.md` or industry-standard protocols (Modbus-TCP via `pymodbus`, MQTT via `paho-mqtt`, OCPP via `ocpp` library).
2. **Never Invent Database Tables or Columns:**
   - Every table, index, foreign key, and enum referenced in code MUST exist in `docs/DATABASE.md` and be implemented via SQL migration scripts.
   - Do NOT add ad-hoc columns like `temp_data` or `misc_json` without modifying `docs/DATABASE.md` first.
3. **No Duplicate Functionality:**
   - Check existing services before creating new helper functions or modules.
   - All time-series calculations MUST use standard UTC ISO-8601 strings or Unix timestamps with explicit timezone metadata (`Asia/Kolkata` for India-first deployments).
4. **Strict Type Safety & Schema Validation:**
   - In Python: Use Python 3.11+ with explicit type annotations and **Pydantic v2** models for all API payloads and internal data structures.
   - In TypeScript: Use strict mode (`"strict": true` in `tsconfig.json`). Never use `any`. Use **Zod** for runtime schema validation.

---

## 2. Coding Standards by Layer

### 2.1 Backend & AI Engine (Python / FastAPI / PyTorch)
- **Framework:** FastAPI with asynchronous endpoints (`async def`) for all I/O bound operations.
- **ORM / Database Access:** SQLAlchemy 2.0 (asyncio) or asyncpg directly for time-series bulk ingestion into TimescaleDB.
- **Precision in Energy & Currency:**
  - Energy quantities (`kWh`, `kW`, `voltage`, `current`) MUST be stored as `DECIMAL(10, 4)` in database and represented as Python `Decimal` or scaled integers in financial calculations.
  - NEVER use IEEE 754 floating-point (`float`) for ledger balances or energy credit netting.
- **Error Handling:**
  - Never swallow exceptions.
  - Use custom domain exceptions (`LedgerBalanceInsufficientError`, `InverterCommunicationTimeoutError`, `EmergencyTriageActiveError`).

### 2.2 Frontend & Admin Dashboard (TypeScript / React / Tailwind CSS)
- **Framework:** React 18+ with Vite and TypeScript.
- **State Management:** TanStack Query (React Query) for server state; Zustand for local client state.
- **Styling:** Tailwind CSS using the design tokens defined in `docs/PRD.md` and `.agent/ui_rules.md`.
- **Accessibility:** Must adhere to WCAG 2.1 AA standards.

---

## 3. Testing & Invariant Enforcement
1. **Ledger Invariants (Zero-Sum Verification):**
   - Every pull request touching the energy ledger MUST include an automated invariant test proving that for any closed settlement period:
     $$\sum (\text{Net Energy Balance}_i) + \text{Community Losses} + \text{Grid/DG Export} = 0$$
2. **Deterministic Emergency Fallback:**
   - Any AI scheduling output MUST pass through the deterministic safety validator before being dispatched to hardware adaptors. If an AI schedule violates Tier 0 (Life Critical) battery reserve thresholds (minimum 30% SOC for medical homes), the schedule MUST be rejected and replaced by default fallback rules.

---

## 4. Git & Commit Guidelines for Agents
- Commit messages must follow Conventional Commits:
  - `feat(ledger): implement net-zero settlement calculation for RWA billing`
  - `fix(hal): handle retry backoff for Enphase Enlighten API rate limits`
  - `docs(prd): expand Indian DISCOM group net metering regulatory compliance`
