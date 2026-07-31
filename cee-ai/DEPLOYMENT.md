# Deploying CEE-AI (Community Energy Exchange)

This document provides step-by-step instructions for deploying CEE-AI to production — specifically **Vercel** for hosting the Next.js application and **Supabase** for the PostgreSQL database.

---

## 🏗️ Production Architecture Overview

CEE-AI runs as an optimized Next.js serverless application:

| Layer | Provider | Purpose |
|---|---|---|
| Web UI & Backend APIs | **Vercel** | Serverless Next.js with automatic scaling |
| Relational Data & Telemetry | **Supabase PostgreSQL** | Energy ledger, telemetry logs, hardware registry |
| Auth | **Supabase Auth** | JWT session management with SSR cookies |
| ORM | **Prisma** | Type-safe DB schema and client generation |
| AI Decision Dispatch | **Google Gemini API** | Energy recommendations and routing |
| Hardware Abstraction Layer | **CEE-AI HAL** | Handles physical MQTT_EDGE, CLOUD_API, or SIMULATED inputs |

---

## 📦 Step-by-Step Deployment Guide

### Step 1: Database Provisioning (Supabase)

1. Go to [supabase.com](https://supabase.com/) and create a new project.
2. Under **Project Settings → Database**, retrieve your connection strings:
   - **Transaction Connection String (Pooler)** → used as `DATABASE_URL` (port 6543, pgbouncer=true)
   - **Session Connection String (Direct)** → used as `DIRECT_URL` (port 5432)
3. Under **Project Settings → API**, retrieve:
   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` — the service role secret key

### Step 2: Initialize Database Schemas (Prisma)

From your local terminal with `.env` configured:

```bash
# Push Prisma schema to Supabase PostgreSQL
npx prisma db push

# Seed Palm Meadows RWA demo data
npx prisma db seed
```

### Step 3: Deploy to Vercel

1. Push your repository to GitHub.
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → **Add New Project**.
3. Import your CEE-AI GitHub repository.
4. Under **Environment Variables**, configure all required variables (see table below).
5. Under **Build & Deployment Settings**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Node.js Version**: 20.x (recommended)
   - **Build Command**: `npm run build` (default)
6. Click **Deploy**.

### Step 4: Edge Gateway Provisioning (Optional, for physical hardware)

If deploying physical hardware at a community site:
1. Solder and mount Raspberry Pi 4 gateways inside DIN-rail enclosures (see [electronics/README.md](file:///e:/NYC/cee-ai/hardware/electronics/README.md)).
2. Provision smart meters, solar inverters, and battery BMS systems on the local RS-485 Modbus loop.
3. Configure the `cee-edge-agent` systemd service on each gateway Pi (see [firmware/edge-gateway/README.md](file:///e:/NYC/cee-ai/hardware/firmware/edge-gateway/README.md)) with:
   - Unique gateway client certificate for MQTT over TLS (port 8883).
   - Valid JWT token signed with `HARDWARE_EDGE_JWT_SECRET`.
4. Point the edge agent to the deployed cloud instance base URL: `https://your-cee-ai-app.vercel.app/api/v1/hardware`.
5. Set the cloud environment variable `HARDWARE_MODE=mqtt_edge` to enable real-time hardware telemetry and dispatch commands.

---

## 🔑 Environment Variables Reference

Configure all variables in Vercel's Environment Variables UI or your local `.env` file.

| Variable | Required | Example Value | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://abc.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `eyJhbGci...` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | `eyJhbGci...` | Supabase service role key (server-only) |
| `DATABASE_URL` | ✅ | `postgresql://...?pgbouncer=true` | Pooled connection string |
| `DIRECT_URL` | ✅ | `postgresql://...` | Direct connection (for migrations) |
| `GEMINI_API_KEY` | ✅ | `AIzaSy...` | Google Gemini AI key |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://cee-ai.vercel.app` | Public deployment URL |
| `JWT_SECRET_KEY` | ✅ | `min_64_byte_random_secret` | JWT signing secret |
| `OPENWEATHERMAP_API_KEY` | ⚠️ | `abc123...` | Weather intelligence (optional for demo) |
| `DEFAULT_TIMEZONE` | ⚠️ | `Asia/Kolkata` | Scheduling timezone |
| `RWA_CLEARING_RATE_INR_PER_KWH` | ⚠️ | `9.50` | CEE energy clearing rate |
| `RWA_PROVIDER_CREDIT_RATE_INR_PER_KWH` | ⚠️ | `8.55` | Provider credit rate |
| `TIER_0_MEDICAL_MIN_SOC_RESERVE_PCT` | ⚠️ | `30` | Medical tier SOC reserve % |
| `EMERGENCY_PRECHARGE_SOC_FLOOR_PCT` | ⚠️ | `100` | Force-charge SOC target |
| `COMMAND_DEBOUNCE_WINDOW_SECONDS` | ⚠️ | `60` | Dispatch command debounce |
| `HARDWARE_MODE` | ⚠️ | `simulated` | Hardware mode: `simulated` (default), `mqtt_edge`, or `cloud_api` |
| `MQTT_BROKER_URL` | ❌ | `mqtts://...:8883` | Edge gateway broker URL (required if `mqtt_edge`) |
| `MQTT_CLIENT_ID` | ❌ | `cee-cloud-consumer` | Broker client identifier (required if `mqtt_edge`) |
| `MQTT_USERNAME` | ❌ | `cee-cloud` | Broker username (required if `mqtt_edge`) |
| `MQTT_PASSWORD` | ❌ | `pwd...` | Broker password (required if `mqtt_edge`) |
| `HARDWARE_EDGE_JWT_SECRET` | ❌ | `min_64_byte_secret` | JWT signing secret for edge auth (required if `mqtt_edge`) |
| `HARDWARE_STALENESS_TTL_SECONDS`| ⚠️ | `300` | Telemetry expiration time in seconds (default 5 min) |

> ✅ = Required for production | ⚠️ = Optional, platform works with defaults | ❌ = Required only when physical hardware integration is active

---

## ✅ Production Build Verification Checklist

Before going live, confirm the following:

- [ ] `npm run typecheck` exits with code `0`
- [ ] `npm run lint src` exits with code `0`
- [ ] `npm run build` completes with no errors
- [ ] All 23 routes render without hydration errors
- [ ] Supabase Auth: login and session refresh work
- [ ] Prisma: DB queries return data (not fallback mock)
- [ ] Gemini AI: `/api/v1/ai/recommendations/[homeId]` returns non-fallback content
- [ ] Responsive: Mobile bottom nav, tablet drawer, desktop sidebar all display correctly
- [ ] Emergency console: Simulate outage toggle works on dashboard
- [ ] HAL: Can retrieve telemetry from `/api/v1/hardware/status` successfully in `simulated` mode
- [ ] HAL: Gateway heartbeat `/api/v1/hardware/heartbeat` registers correctly
- [ ] HAL: Manual dispatch endpoint `/api/v1/hardware/dispatch` accepts commands and signs command IDs
- [ ] Safety validation: Dispatch commands violating battery reserve SOC floor are rejected with `DISPATCH_SAFETY_BLOCKED`

---

## 🔄 Rollback Procedure

If a deployment fails:

1. Go to **Vercel Dashboard → Deployments**
2. Find the last known-good deployment
3. Click **⋯ → Promote to Production**

For database rollbacks, use Prisma migrations:

```bash
# Check migration history
npx prisma migrate status

# Reset to a specific migration
npx prisma migrate reset --to <migration_name>
```
