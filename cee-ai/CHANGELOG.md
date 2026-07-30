# Changelog

All notable changes to the CEE-AI Platform will be documented in this file.

## [1.3.0] - 2026-07-30

### Added
- **`ARCHITECTURE.md`**: Mapped full system design, Mermaid ER diagrams, decision engine dispatch flows, and safety models.
- **`clean.js`**: Cross-platform script to purge Next.js builds, cache, and dependencies.
- **NPM Script integration**: Registered `"setup"` and `"clean"` scripts directly under package.json.

### Fixed
- **Next Lint error**: Mapped `"lint"` to direct ESLint runtime (`eslint src`) since Next.js 16 CLI has deprecated or refactored build hooks.

### Removed
- **Unused dependencies**: Pruned 11 packages including `@radix-ui` elements (avatar, dialog, select, tabs, tooltip) and client utilities (date-fns, zustand, motion).
- **Unused UI Primitives**: Removed the unimported `tooltip.tsx` component from UI folder.

## [1.2.0] - 2026-07-30

### Added
- **Security Headers**: Added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers via `next.config.ts`.
- **Image Optimization**: Configured Supabase storage as an allowed remote image pattern in `next.config.ts`.
- **ESLint Rule Override**: Added `argsIgnorePattern: "^_"` to allow underscore-prefixed unused parameters as an intentional convention.
- **`src/proxy.ts` documented**: Added JSDoc clarifying it serves as the Next.js 16 proxy/middleware entry point.

### Fixed
- **ESLint Errors (2)**: Resolved `prefer-const` error in login page and `no-explicit-any` error in telemetry ingest route.
- **ESLint Warnings (46)**: Cleaned all unused imports, variables, and catch block parameters across 15+ files.
- **`package.json` lint script**: Fixed broken `next lint` command → `next lint src`.

### Changed
- **`next.config.ts`**: Added security headers and Supabase image remote patterns (was empty scaffold file).
- **`.gitignore`**: Added `skills-lock.json`, `.agents/` to exclusions.
- **`README.md`**: Added demo personas table, env var reference table, updated architecture diagram.
- **`DEPLOYMENT.md`**: Added complete 15-variable env var table, Vercel settings, post-deployment checklist, and rollback procedure.
- **`PROJECT_STRUCTURE.md`**: Full rewrite with accurate directory tree including `middleware.ts`, `proxy.ts`, and all components.

### Removed
- **Dead scaffold assets**: Deleted `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` (Next.js create-app defaults, not used).

## [1.1.0] - 2026-07-30


### Added
- **Multi-Device Responsive Design:** Fully integrated mobile and tablet Google Stitch design layouts in a single Next.js codebase.
- **Adaptive Navigation Layout:** Static sidebar for desktop (>=1024px), hamburger drawer navigation for tablet, and fixed bottom navigation + drawer navigation for mobile screens (<768px).
- **Responsive Energy Flow Visualizer:** Re-engineered the animated flow visualizer with a portrait cross-layout (Solar top, Load bottom, Battery left, Grid right) on mobile screens.
- **Automation Scripts:** Added a cross-platform `setup.js` script to configure and bootstrap the developer workspace environment in one command.

## [1.0.0] - 2026-07-29

### Added
- **Design System**: Fully mapped Google Stitch design tokens into Tailwind CSS and CSS variables. Created core primitives (Button, Card, Badge, Progress, Switch, Slider).
- **Database Architecture**: Implemented database schema mapping to `DATABASE.md` tables (Community, Home, Inverter, Telemetry, Ledger, Settlements).
- **Supabase Auth**: Created login interface supporting credential verification and Quick Demo logins for testing Provider/Consumer/Admin personas. Added SSR cookie middleware.
- **Resident Dashboard**: Live State of Charge battery gauges, Net energy ledger credit badges, and dynamic SVG-animated energy flow visualizers.
- **Community Dashboard**: Aggregated Virtual Power Plant (VPP) metrics, solar peak forecasts, and resident triage groups.
- **Ledger System**: Cryptographically auditable 15-minute netting transaction log and MyGate ERP export actions.
- **Emergency Center**: High-contrast command console supporting grid failure simulations, load shedding logs, and IMD cyclone weather alerts.
- **AI Engines**: Integrated Decision Engine, Energy Routing solver, Weather pre-charge checks, and Gemini-based actionable suggestions.

### Changed
- **React 19 Refactoring**: Removed `React.forwardRef()` from UI components in favor of standard ref properties to support Vercel React Best Practices.
- **Accessibility**: Added standard `aria-label` attributes to icon-only controls and autocomplete attributes.
- **ellipses**: Unified triple-dot ellipses `...` into unicode `…` characters.
