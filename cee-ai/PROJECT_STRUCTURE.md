# Project Structure

This document details the file and folder layout of the Community Energy Exchange AI (CEE-AI) platform.

---

## 📁 Repository Directory Layout

```
cee-ai/
├── prisma/                        # Database modeling & seed scripts
│   ├── schema.prisma              # Prisma schema: Community, Home, Inverter, Telemetry, Ledger
│   └── seed.ts                    # Local seed script: Palm Meadows RWA + demo users
├── public/                        # Static public assets (favicon)
├── src/
│   ├── proxy.ts                   # Next.js 16 proxy/middleware — Supabase SSR auth + route protection
│   ├── app/                       # Next.js App Router (pages and API routes)
│   │   ├── (auth)/                # Auth route group
│   │   │   └── login/             # Login page with Quick Demo personas
│   │   ├── api/                   # REST API endpoints
│   │   │   └── v1/                # API version 1
│   │   │       ├── ai/            # AI: recommendations, demand/solar forecasts
│   │   │       ├── auth/          # Auth: login endpoint
│   │   │       ├── emergency/     # Emergency: outage detection, triage
│   │   │       ├── ledger/        # Ledger: balance, community settle
│   │   │       └── telemetry/     # Telemetry: ingest, home, community
│   │   ├── dashboard/             # Main workspace routes
│   │   │   ├── ai-insights/       # AI recommendations + 24hr forecast charts
│   │   │   ├── community/         # VPP stats and tenant triage list
│   │   │   ├── emergency/         # Outage controls, load shedding, weather alerts
│   │   │   ├── ledger/            # Billing transactions and CEE credit accounting
│   │   │   ├── settings/          # SOC reserve slider, smart-load priority tiers
│   │   │   ├── layout.tsx         # Dashboard shell: responsive sidebar/drawer/bottom-nav
│   │   │   └── page.tsx           # Resident Home Dashboard (main overview)
│   │   ├── error.tsx              # Global error boundary page
│   │   ├── not-found.tsx          # 404 page
│   │   ├── robots.ts              # robots.txt generator
│   │   ├── sitemap.ts             # sitemap.xml generator
│   │   ├── globals.css            # Design tokens (Stitch Climate Intelligence System)
│   │   ├── layout.tsx             # Root layout: fonts (Inter, Source Sans 3, JetBrains Mono, Geist)
│   │   └── page.tsx               # Landing page (hero, cost comparison, value props)
│   ├── components/                # Reusable UI & Logic components
│   │   ├── dashboard/             # Layout shells
│   │   │   ├── bottom-nav.tsx     # Mobile bottom navigation bar
│   │   │   ├── nav-drawer.tsx     # Slide-over drawer navigation (tablet + mobile)
│   │   │   ├── sidebar.tsx        # Desktop left sidebar
│   │   │   └── top-bar.tsx        # Mobile/tablet topbar with hamburger toggle
│   │   ├── energy/                # Energy data visualization
│   │   │   ├── battery-gauge.tsx  # Circular SOC gauge with flow direction indicator
│   │   │   ├── energy-flow-visualizer.tsx  # SVG animated energy flow diagram
│   │   │   └── ledger-balance-badge.tsx    # CEE credit balance badge
│   │   ├── shared/                # Cross-cutting concerns
│   │   │   └── error-boundary.tsx # React class error boundary with fallback UI
│   │   ├── ui/                    # Tailored Radix UI primitive components
│   │   │   ├── badge.tsx          # Status/tier badge variants
│   │   │   ├── button.tsx         # Button with emergency variant
│   │   │   ├── card.tsx           # Card + CardHeader/Content/Footer
│   │   │   ├── input.tsx          # Styled text input
│   │   │   ├── progress.tsx       # Progress bar
│   │   │   ├── scroll-area.tsx    # Scrollable container
│   │   │   ├── separator.tsx      # Visual separator
│   │   │   ├── slider.tsx         # Range slider (SOC controls)
│   │   │   └── switch.tsx         # Toggle switch
│   │   └── providers.tsx          # React Query (TanStack) provider
│   ├── lib/                       # Application utility layers
│   │   ├── ai/                    # AI Engine modules
│   │   │   ├── decision-engine.ts         # VPP orchestrator + Gemini integration
│   │   │   ├── emergency-prioritization.ts # 4-tier medical load shedding
│   │   │   ├── energy-routing.ts          # Supplier-consumer grid solver
│   │   │   └── weather-intelligence.ts    # IMD storm risk + force-charge logic
│   │   ├── supabase/              # Supabase client adapters
│   │   │   ├── client.ts          # Browser client (for client components)
│   │   │   └── server.ts          # Server client (for RSC and API routes)
│   │   ├── mock-store.ts          # Offline fallback mock data (Palm Meadows RWA)
│   │   ├── prisma.ts              # Prisma singleton connection
│   │   └── utils.ts               # cn(), formatINR(), formatEnergy(), formatCeeCredits()
│   └── types/                     # TypeScript type declarations
│       └── index.ts               # GridStatus, DispatchInstruction, EmergencyTier enums
├── .env.example                   # Environment variable template
├── .gitignore                     # Git exclusion rules
├── clean.js                       # Cross-platform workspace cleanup script
├── eslint.config.mjs              # ESLint configuration (Next.js + TypeScript)
├── next.config.ts                 # Next.js configuration (headers, image optimization)
├── package.json                   # Dependencies and npm script shortcuts
├── postcss.config.mjs             # PostCSS (Tailwind CSS v4)
├── setup.js                       # Cross-platform one-command developer setup script
└── tsconfig.json                  # TypeScript compiler options
```

---

## 🧩 Core Module Responsibilities

### 1. Database Schema (`prisma/schema.prisma`)
Handles direct mapping to Supabase PostgreSQL, creating tables for:
- `Community` & `Home`: Track Palm Meadows community settings and resident solar/battery assets.
- `LedgerTransaction`: Log 15-minute credit balance changes cryptographically.
- `TelemetryLog`: Store real-time power flows (solar kW, demand kW, grid net kW).

### 2. AI Dispatch Engine (`src/lib/ai/`)
- `decision-engine.ts`: Calculates next VPP state using SOC, weather risk, and emergency events. Integrates Google Gemini for resident recommendations.
- `energy-routing.ts`: Formulates optimal grid-export or battery-charge directives.
- `weather-intelligence.ts`: Predicts storm severity and forecasts pre-charge conditions.
- `emergency-prioritization.ts`: Implements 4-tier medical load shedding controls.

### 3. Design System (`src/app/globals.css`)
Full mapping of the Google Stitch "Climate Intelligence System" design theme:
- CSS custom properties for colors, spacing, typography, and border radius.
- Tailwind v4 `@theme inline` integration for utility class generation.
- Energy status semantic colors (`energy-solar`, `energy-battery`, `energy-critical`).

### 4. Responsive Navigation (`src/components/dashboard/`)
- **Desktop (≥1024px)**: `sidebar.tsx` — fixed left rail.
- **Tablet (768px–1023px)**: `top-bar.tsx` + `nav-drawer.tsx` — slide-over drawer.
- **Mobile (<768px)**: `bottom-nav.tsx` + `top-bar.tsx` + `nav-drawer.tsx`.

### 5. Auth Middleware (`src/proxy.ts`)
Next.js 16 "proxy file" convention — `src/proxy.ts` is recognized directly as the middleware entry point. Handles Supabase SSR session management and redirects:
- Unauthenticated users accessing `/dashboard/*` → redirected to `/login`.
- Authenticated users accessing `/login` → redirected to `/dashboard`.
