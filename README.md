# Startup Zone

Startup Zone is a marketplace MVP where founders publish projects, specialists find teams, and investors discover early-stage startups.

**[Open the public demo](https://startup-zone-danilyoh.vercel.app)** — the hosted version is read-only. Authentication and startup creation require a configured Supabase environment.

## Current scope

Implemented:

- Supabase authentication with explicit founder, specialist, or investor onboarding;
- protected profile editing with immutable marketplace roles;
- protected founder dashboard;
- persisted startup creation and management with server-side Zod validation;
- specialist applications and investor interest requests with status tracking;
- founder moderation with database-enforced terminal decisions;
- filterable public startup directory and detail pages;
- PostgreSQL constraints and row-level security with pgTAP tests;
- structured server logs, unexpected request capture, application rate limiting, and decision auditing;
- responsive light and dark UI;
- Vitest, Playwright, and GitHub Actions coverage for core flows.

Deployment gates, environment isolation, monitoring expectations, and backup/restore drills are documented in [operations](docs/operations.md). Connecting a production log destination and enabling managed backups remain deployment-environment responsibilities.

## Stack

Next.js 16, React 19, strict TypeScript, Mantine UI, Tailwind CSS, Supabase Auth and PostgreSQL, Zod, Vitest, pgTAP, and Playwright.

Server Components handle reads, Server Actions handle validated mutations, and PostgreSQL RLS enforces ownership independently of the UI.

## Run locally

Requires Node.js 20.9+ and a local or test Supabase project.

```bash
git clone https://github.com/DanilYoh/startup-zone.git
cd startup-zone
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in `.env.local`, then apply the migrations from `supabase/migrations/`. Open [http://localhost:3000](http://localhost:3000).

Never use production Supabase credentials for local development or tests.

## Checks

```bash
npm run check
npm run build
npm run test:coverage
npm run test:rls
npm run test:e2e
```

`npm run check` runs linting, type-checking, and unit tests. RLS and E2E tests require a local or explicitly designated test Supabase environment; E2E also requires `SUPABASE_SERVICE_ROLE_KEY`.

For clean migration verification, release checks, environment separation, logging, rate limits, and recovery procedures, see [docs/operations.md](docs/operations.md).

## Author

[DanilYoh](https://github.com/DanilYoh)
