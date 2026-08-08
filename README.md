# Startup Zone

Startup Zone is a production-minded foundation for a marketplace where founders can present early-stage products, find specialists, and connect with investors. The current repository includes complete startup-publishing and public-discovery slices: authenticated founders can submit persisted projects, see them on their dashboard, and expose active projects through a filterable public directory and detail pages.

**[Open the public demo](https://startup-zone-danilyoh.vercel.app)** — it runs in read-only demo mode; authentication and startup creation require your own Supabase environment.

![Startup Zone product foundation](docs/startup-zone.png)

## Why this project exists

Early-stage teams usually spread their pitch, hiring, and investor conversations across unrelated tools. The product vision brings the first collaboration step into one focused flow:

- founders publish a structured startup profile;
- specialists apply to join a team;
- investors discover relevant opportunities;
- PostgreSQL row-level security keeps access rules close to the data.

The foundation, startup-publishing flow, and public discovery are implemented today; profile editing and application workflows are listed in [Current scope](#current-scope).

## Tech stack

- Next.js App Router and React Server Components
- React 19 and strict TypeScript
- Supabase Auth, PostgreSQL, and row-level security
- Zod validation for server-side input boundaries
- Mantine UI components with Tailwind CSS for layout utilities
- Vitest for unit tests
- pgTAP integration tests for database authorization
- Playwright for the startup-publishing and public-discovery critical path
- GitHub Actions for linting, type-checking, tests, and production builds

## Architecture

```text
Browser
  ├─ Server Components → read-oriented UI
  └─ Server Actions    → Zod validation → Supabase client
                                              │
                              Auth + PostgreSQL + RLS
```

The application uses Supabase as the single data-access path. Authentication is verified on the server, mutations validate untrusted form data, and database policies enforce ownership independently of the UI.

## Run locally

Requirements: Node.js 20.9 or newer and a Supabase project.

```bash
git clone https://github.com/DanilYoh/startup-zone.git
cd startup-zone
npm ci
copy .env.example .env.local
npm run dev
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, then apply the SQL migration from `supabase/migrations` to your Supabase project.

Open [http://localhost:3000](http://localhost:3000).

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:rls
npm run test:e2e
npm run build
```

`npm run check` runs linting, type-checking, and unit tests together. The RLS suite requires the local Supabase stack. The Playwright suite additionally requires local/test Supabase values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; never use production credentials. CI provisions an isolated local stack for both integration suites.

## Security notes

- secrets stay in local environment files and are never committed;
- sessions use server-aware Supabase clients and cookie refresh middleware;
- protected routes verify authenticated users again before rendering;
- founder roles and startup ownership are enforced with RLS;
- applicants cannot target their own or inactive startups, and founders can update only application status;
- common browser hardening headers are configured in `next.config.ts`.

## Current scope

Implemented: authentication foundation, role-aware database schema, founder dashboard, persisted startup form, active-startup directory with validated filters, public startup detail pages, hardened RLS with integration tests, a publishing-to-discovery Playwright scenario, responsive product UI, dark mode, and CI.

Next: profile editing, specialist and investor applications, application status moderation, broader end-to-end coverage, and deployment observability.

## Author

[DanilYoh](https://github.com/DanilYoh)
