# Community Energy Exchange AI (CEE-AI)

[![Production Build](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

CEE-AI is an intelligent, software-first Virtual Power Plant (VPP) and community energy exchange platform. It transforms fragmented residential rooftop solar and battery storage systems into a self-healing virtual microgrid. During outages, the system automatically redirects power from surplus households to protect life-critical medical loads (e.g., oxygen concentrators) in the neighborhood, eliminating the community's reliance on expensive, polluting diesel generators.

Developed for the **NYC Climate Tech Fellowship 2026**.

---

## 🌟 Key Features

1. **AI-Driven VPP Microgrid Routing**: Intelligently balances supply and demand across residential nodes using a supplier-consumer transportation algorithm.
2. **Four-Tier Emergency Triage**: Priority load-shedding hierarchy to safeguard life-saving medical devices (Tier 0) first, while throttling deferrable loads like EV chargers (Tier 3) during blackouts.
3. **Double-Entry Energy Credit Ledger**: Cryptographically signed 15-minute netting transactions settled directly against resident CAM maintenance bills.
4. **Severe Weather Intelligence**: Integrates meteorological alerts to execute proactive `FORCE_CHARGE` procedures before anticipated grid outages.
5. **Pixel-Perfect Responsive Layout**: Full mobile bottom navigation, tablet slide-out drawer, and desktop sidebar rails mapped to custom design specifications.
6. **Hardware-Optional HAL Gateway**: Seamlessly bridges physical smart meters, BMSs, and inverters locally (via Modbus RTU & MQTT over TLS) while supporting automated cloud API fallback and local simulation.

---

## 💻 Tech Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS v4 (Stitch Design Tokens)
- **Database & Auth**: Supabase PostgreSQL + Supabase SSR Auth Client
- **ORM**: Prisma ORM v6
- **AI Core**: Google Gemini API SDK

---

## 🎨 Visual Interface Layouts

```
+-----------------------------------------------------------------------+
|  CEE-AI RESIDENT ENERGY DASHBOARD                                      |
+-----------------------------------------------------------------------+
|  [Welcome Rajesh]                                   Grid: OUTAGE (VPP)|
+-----------------------------------------------------------------------+
|  +--------------------+  +--------------------+  +--------------------+ |
|  |  BATTERY STORAGE   |  |   ENERGY LEDGER    |  |  HARDWARE STATUS   | |
|  |     [ 78.5% ]      |  |     ₹1,372.28      |  |   Enphase Cloud    | |
|  |  Flow: +1.20 kW    |  |  +160.50 Credits   |  |   ONLINE & SYNCED  | |
|  +--------------------+  +--------------------+  +--------------------+ |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  REAL-TIME SVG ENERGY FLOW ANIMATION                            |  |
|  |  Solar (5.82kW) --> Battery (1.20kW) --> Community (2.52kW Export)|  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

### Screen Overview
1. **Resident Dashboard**: Features a real-time circular SOC battery gauge, energy credits balance ledger, and an interactive SVG animated flow visualizer showing power routing.
2. **Community Portal**: Aggregates community solar peak forecasts, active VPP load matching curves, and a resident registry categorized by emergency prioritization tiers.
3. **Emergency Command Center**: RWA control console providing grid outage simulations, real-time diesel generator displacement calculations, and meteorological storm watch alerts.

---

## ⚙️ Installation & Developer Setup

CEE-AI includes a cross-platform setup script to initialize your local workspace with one command.

### Prerequisites
- Node.js version **18.0.0** or higher
- Git

### Quickstart Setup
```bash
# 1. Clone the repository
git clone https://github.com/username/cee-ai.git
cd cee-ai

# 2. Run the automated workspace installer
npm run setup
```

The script will automatically validate your Node.js version, generate `.env` from the template, install all required dependencies, and generate Prisma client mappings.

---

## 🔑 Environment Variables

Create a `.env` file at the root of the workspace (automatically copied from `.env.example` by `npm run setup`).

| Variable | Description | Default / Example Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project dashboard URL | `https://your-proj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client access token | `eyJhbGciOiJIUzI1Ni...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin access token | `eyJhbGciOiJIUzI1Ni...` |
| `DATABASE_URL` | Pooled DB connection (PgBouncer port) | `postgresql://...:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Direct DB connection (standard port) | `postgresql://...:5432/postgres` |
| `GEMINI_API_KEY` | Google Gemini AI authentication key | `AIzaSy...` |
| `JWT_SECRET_KEY` | Custom encryption key (min 64 chars) | `super_secret_jwt_hmac_key...` |

*Note: For local standalone demonstration without live databases, the portal runs on interactive fallback mock data using preset accounts.*

---

## 🛠️ Local Development & Scripts

Start development server:
```bash
npm run dev
```

### Available Package Scripts
- `npm run setup` — Checks system requirements and boots dependencies.
- `npm run dev` — Launches the Turbopack hot-reloading development server on `localhost:3000`.
- `npm run build` — Compiles optimized production bundle assets.
- `npm run start` — Boots the server in production mode.
- `npm run lint` — Runs ESLint checks on all code files.
- `npm run typecheck` — Runs Strict TypeScript compiler verification.
- `npm run format` — Runs Prettier code formatter checks.
- `npm run clean` — Safe cross-platform clean of build caches (`.next/`, `*.tsbuildinfo`). Run `npm run clean -- --all` to clean `node_modules` as well.

---

## 🚀 Production Deployment

### 1. Database Migrations (Supabase)
Apply tables and initial mock database configurations:
```bash
npx prisma db push
npx prisma db seed
```

### 2. Vercel Deployment
1. Connect your repository to Vercel.
2. Supply all variables listed in the Environment Variables section.
3. Configure the **Build Command** as `npm run build`.
4. Deploy. Next.js serverless functions will host the dashboard and APIs.

---

## 📁 Repository Directory Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for a detailed file tree.

- `prisma/` — SQL table schemas and mock seeds.
- `src/app/` — Pages, layouts, styling, and versioned API route endpoints.
- `src/components/` — UI components, animated flow charts, and layout templates.
- `src/lib/` — AI engines, database singleton instances, and utilities.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions to improve community grid resilience are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.
