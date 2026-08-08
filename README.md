# Startup Zone

Startup Zone is a production-minded foundation for a future marketplace where founders can present early-stage products, find specialists, and connect with investors. The current repository establishes the secure product shell - domain model, authentication, database authorization, startup creation, automated checks and reproducible setup - rather than claiming a finished end-to-end marketplace.

**[Open the public demo](https://startup-zone-danilyoh.vercel.app)** — it runs in read-only demo mode; authentication and startup creation require your own Supabase environment.

![Startup Zone product foundation](docs/startup-zone.png)

## Why this project exists

Early-stage teams usually spread their pitch, hiring, and investor conversations across unrelated tools. The product vision brings the first collaboration step into one focused flow:

- founders publish a structured startup profile;
- specialists apply to join a team;
- investors discover relevant opportunities;
- PostgreSQL row-level security keeps access rules close to the data.

Only the foundation and startup-creation slice are implemented today; the directory, discovery and application workflows are listed in [Current scope](#current-scope).

## Tech stack

- Next.js App Router and React Server Components
- React 19 and strict TypeScript
- Supabase Auth, PostgreSQL, and row-level security
- Zod validation for server-side input boundaries
- Tailwind CSS and accessible Radix UI primitives
- Vitest for unit tests
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
npm run build
```

`npm run check` runs linting, type-checking, and tests together. The same checks run for every pull request in GitHub Actions.

## Security notes

- secrets stay in local environment files and are never committed;
- sessions use server-aware Supabase clients and cookie refresh middleware;
- protected routes verify claims before rendering;
- startup ownership and application visibility are enforced with RLS;
- common browser hardening headers are configured in `next.config.ts`.

## Current scope

Implemented: authentication foundation, role-aware database schema, secure startup creation action, responsive product landing page, dark mode, tests, and CI.

Next: startup directory and filters, profile editing, application status workflow, end-to-end Playwright coverage, and deployment observability.

## Author

[DanilYoh](https://github.com/DanilYoh)
