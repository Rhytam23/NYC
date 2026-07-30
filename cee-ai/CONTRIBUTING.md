# Contributing to CEE-AI

Thank you for your interest in contributing to the Community Energy Exchange AI (CEE-AI) platform! 

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please review it to understand our standards and enforcement protocols.

## Getting Started

1. Fork the repository and create your branch from `main`.
2. Bootstrap your local environment and dependencies:
   ```bash
   node setup.js
   ```
3. Set up your local `.env` file based on `.env.example`.
4. Run development server:
   ```bash
   npm run dev
   ```

## Development Guidelines

- **TypeScript**: All new code must be fully type-safe. Avoid `any` where possible.
- **Design System**: Follow Stitch design system named tokens. Do not introduce ad-hoc spacing or custom colors outside the design system guidelines.
- **Prisma & DB**: Run `npx prisma generate` after modifying `schema.prisma`. Ensure schema migrations are Postgres-compatible.
- **Vercel Skills**: Ensure compliance with Vercel React Best Practices and Web Interface Guidelines. Remove `forwardRef` in favor of standard ref passing for React 19.

## Pull Request Process

1. Verify that the project builds locally without errors:
   ```bash
   npm run build
   ```
2. Run typecheck validation:
   ```bash
   npx tsc --noEmit
   ```
3. Update `CHANGELOG.md` with a summary of your changes.
4. Submit your PR for code review by lead architects.
