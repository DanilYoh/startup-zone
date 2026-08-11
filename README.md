# Startup Zone

Startup Zone is a focused marketplace MVP where founders publish projects and investors discover, qualify, and contact early-stage startups.

**[Open the public demo](https://startup-zone-danilyoh.vercel.app)** to browse the synthetic startup directory without an account. The demo links are read-only: they never issue a shared user session, and its synthetic records reset automatically. Registration for a personal closed-beta account still requires an invitation.

## Current scope

Implemented:

- Supabase authentication with explicit founder or investor onboarding and an SSR-safe email-confirmation callback;
- invitation-only closed-beta signup with one-time, expiring codes bound to an email address and marketplace role;
- separate, versioned personal-data consent at signup, with immutable server-timestamped evidence and production registration that fails closed until operator-approved documents are configured;
- protected, role-specific profile editing with immutable marketplace roles;
- distinct founder and investor workspaces;
- persisted startup creation and management with server-side Zod validation;
- investor interest requests with status tracking;
- founder moderation with database-enforced terminal decisions and consent-based private contact exchange after acceptance;
- filterable, paginated public startup directory and detail pages;
- PostgreSQL constraints and row-level security with pgTAP tests;
- request-correlated structured server logs, Sentry-compatible server/client error tracking, unexpected request capture, application rate limiting, and decision auditing;
- separate `/healthz` liveness and bounded `/readyz` Supabase readiness probes, plus a restrictive Content Security Policy;
- responsive light and dark UI;
- Vitest, React Testing Library, Playwright, and GitHub Actions coverage for core flows.

The decision-oriented field model for each role is documented in [profile structure](docs/profile-structure.md).

Deployment gates, environment isolation, monitoring, and backup/restore drills are documented in [operations](docs/operations.md). The low-cost, Russia-hosted production topology and market-entry sequence are documented in the [Russia launch plan](docs/russia-launch-plan.md). Architecture trade-offs are recorded in the [ADR index](docs/adr/README.md), and the role of AI-assisted tooling is disclosed in [AI_USAGE.md](AI_USAGE.md).

The public demo never uses production data, shared credentials, or a service-role key at runtime. Operators reset its synthetic records with `npm run demo:seed`; the command additionally requires `APP_ENVIRONMENT`, `ALLOW_DEMO_SEED=true`, an exact `DEMO_SEED_PROJECT_REF` match, and workflow-only synthetic account credentials. The scheduled workflow performs the same guarded reset.

Trusted operators create a one-time invitation with `npm run beta:invite -- --email person@example.ru --role founder`. The command requires explicit `ALLOW_BETA_INVITE_CREATE=true`, an exact `BETA_INVITE_TARGET_URL` match, and a service-role key that is never configured in the application runtime. Full production usage is documented in [operations](docs/operations.md#closed-beta-invitations).

Before opening production traffic, a trusted operator runs `npm run production:preflight`. The read-only gate verifies real HTTPS origins, application and Auth health, deployed legal pages, the exact active database document version, and the invitation boundary without creating accounts or records. It fails on local/test targets and placeholder legal or release metadata; see [operations](docs/operations.md#production-preflight).

## Stack

Next.js 16, React 19, strict TypeScript, Mantine UI, CSS Modules, Supabase Auth and PostgreSQL, Zod, Vitest with React Testing Library, pgTAP, and Playwright.

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

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in `.env.local`, then apply the migrations from `supabase/migrations/`. Local and test environments use the seeded `local-development-v1` legal-document version. The `/legal/privacy` and `/legal/consent` pages clearly identify it as a draft that is not valid for production. Open [http://localhost:3000](http://localhost:3000).

Production registration is disabled unless every `LEGAL_*` value documented in `.env.example` is complete, `LEGAL_DOCUMENT_APPROVED=true`, and the same non-draft version is active in `legal_document_versions`. Operator identity and legal approval are deployment inputs, not repository defaults.

Registration is invitation-only in every environment. Create a local code with the guarded `beta:invite` command described in [operations](docs/operations.md#closed-beta-invitations); use the exact local Supabase API URL as `BETA_INVITE_TARGET_URL`.

Never use production Supabase credentials for local development or tests.

## Checks

```bash
npm run check
npm run build
npm run test:coverage
npm run test:rls
npm run test:e2e
```

`npm run check` runs linting, type-checking, unit tests, and component tests. RLS and E2E tests require a local or explicitly designated test Supabase environment; E2E also requires `SUPABASE_SERVICE_ROLE_KEY`.

Coverage includes all executable application, component, feature, and shared-library files, counting untested files as zero. The global line floor is 60%; critical Server Actions have an additional 80% floor. pgTAP and Playwright remain the authoritative checks for database authorization and complete product flows.

For clean migration verification, release checks, environment separation, logging, rate limits, and recovery procedures, see [docs/operations.md](docs/operations.md).

## Author

[DanilYoh](https://github.com/DanilYoh)
