<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project

Startup Zone is a secure marketplace MVP for three roles:

- founders publish startups and manage applications;
- specialists discover projects and apply to join teams;
- investors find relevant startups and contact them.

Build features as vertical slices that include real data access, a reachable user interface, server-side validation, authorization, failure states, and tests. Do not present static cards, isolated backend functions, or planned flows as completed product functionality.

The current foundation includes a public landing page and startup directory, Supabase authentication, a protected application area, persisted startup publishing, a PostgreSQL schema with RLS, and tests for critical flows. Treat profile editing, application workflows, application moderation, and production observability as incomplete unless the current code proves otherwise.

## Stack

- Frontend: Next.js 16 App Router, React 19, TypeScript, Mantine UI, Tailwind CSS.
- Server: React Server Components, Server Actions, Route Handlers.
- Authentication and data access: Supabase SSR and Supabase JS.
- Database: Supabase PostgreSQL, migrations, constraints, triggers, indexes, RLS.
- Validation: Zod.
- Tests: Vitest, pgTAP / Supabase CLI, Playwright.
- CI: GitHub Actions.
- Runtime: Node.js 20.9+ and npm with `package-lock.json`.

## Commands

- Install: `npm ci`
- Development server: `npm run dev`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Unit tests: `npm run test`
- Coverage: `npm run test:coverage`
- RLS tests: `npm run test:rls`
- End-to-end tests: `npm run test:e2e`
- Main checks: `npm run check`
- Production build: `npm run build`

`npm run check` runs linting, type-checking, and unit tests. RLS tests require a local Supabase instance. End-to-end tests require a local or explicitly designated test Supabase environment and `SUPABASE_SERVICE_ROLE_KEY`; never use production credentials.

## Rules

### Workflow

- Never work directly on `main`. Use a `codex/<short-task-name>` branch unless the user specifies another branch.
- Before editing, inspect `git status`, the current branch, and relevant history. Preserve unrelated user changes.
- Create small, focused commits with clear messages, preferably using Conventional Commit prefixes.
- Do not delete or rename files without explicit approval. Do not use `git clean`, `git reset --hard`, force-push, or shared-history rewrites.
- Do not perform unrelated refactors or add speculative infrastructure.

### Next.js and TypeScript

- Treat the installed Next.js version as authoritative. Before changing routing, caching, Proxy, Server Actions, or framework configuration, read the relevant documentation in `node_modules/next/dist/docs/`.
- Prefer Server Components. Add `"use client"` only for browser APIs, state, effects, or event handlers.
- Perform reads in Server Components or server-only helpers and mutations in Server Actions or Route Handlers.
- Never import server-only code, including `lib/supabase/server.ts`, into Client Components.
- Keep strict TypeScript passing without `any`, unjustified casts, non-null assertions, or type-error suppression.
- Use the `@/` alias for root imports. Keep code and documentation in English unless the task explicitly requires another language.

### Supabase, Data, and Security

- PostgreSQL constraints and RLS are the final authorization boundary. Route protection and hidden UI controls are defense-in-depth only.
- Verify the authenticated user on the server for sensitive operations. Derive ownership fields from the verified session, never from submitted input.
- Validate all untrusted input with Zod at the server boundary. Return stable user-facing errors without exposing raw database or Auth messages.
- Use the browser Supabase client only in Client Components and the server client only on the server. Create a new server client per request.
- Restrict RLS by role, ownership, writable columns, and allowed state transitions. Cover positive and negative authorization cases.
- Do not rewrite migrations that may have been applied. Add a new migration and keep SQL, database types, Zod schemas, domain constants, server logic, UI, tests, and documentation synchronized.
- Never access or mutate production Supabase without explicit, task-specific user approval. Treat an unverified environment as production.
- Never commit `.env.local`, tokens, service-role keys, credentials, or private data.
- Use only environment variable names documented in `.env.example`. The public demo must render safely without Supabase environment variables.
- Do not add production dependencies unless necessary. Update `package.json` and `package-lock.json` together when dependencies change.

### Product and UI

- Prefer the smallest complete user flow over several partially implemented screens.
- Handle loading, empty, success, validation, authorization, conflict, and unexpected-error states.
- Do not use hard-coded demo data where the UI claims to show persisted or user-created data.
- Reuse Mantine, the configured theme, and established patterns. Verify mobile and desktop layouts, light and dark themes, keyboard use, visible focus, and semantic HTML.
- Keep README content, UI copy, screenshots, and release notes aligned with verified product behavior.

### Verification

- Documentation-only changes: inspect the diff, Markdown structure, paths, and links.
- TypeScript, Server Components, Server Actions, or shared logic: run `npm run check`.
- Routing, Proxy, dependencies, environment handling, or Next.js configuration: run `npm run check` and `npm run build`.
- Authentication, RLS, or migrations: add targeted positive and negative tests, verify against local/test Supabase, and run `npm run check` and `npm run build`.
- Critical MVP flows: add or update Playwright coverage when the test environment supports it.
- UI changes: supplement automated checks with browser verification of the affected flow.
- If an environment-dependent check cannot run, state exactly what remains unverified and why.

## Done means

- The requirement is implemented on a dedicated branch and the user flow is reachable end to end.
- Data is read or persisted as intended; validation, authentication, authorization, integrity, and failure states are handled.
- SQL, RLS, database types, Zod schemas, server logic, and UI remain synchronized when data behavior changes.
- Meaningful success and failure tests are added or updated.
- The appropriate check, build, RLS, end-to-end, and browser verification passes without new warnings, or limitations are documented precisely.
- The diff contains no secrets, private data, build or coverage output, accidental deletions, or unrelated changes.
- The work is recorded in one or more focused commits.
- Documentation describes the verified current behavior and remaining limitations.
