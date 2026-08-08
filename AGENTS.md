<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Startup Zone Project Instructions

## Mission

Build Startup Zone into a secure, functional MVP where founders can publish startups, specialists can apply to teams, and investors can discover and contact relevant projects.

Prioritize, in order:

1. security and authorization correctness;
2. complete user-facing MVP workflows;
3. data integrity and type safety;
4. automated verification;
5. responsive, accessible product quality;
6. maintainable delivery history.

Do not optimize only for screenshots or portfolio presentation. A feature is implemented only when its user flow is reachable, persists or reads real data as intended, handles failure states, and is protected at the database boundary.

## Current product boundary

The repository currently contains a public landing page, Supabase authentication, a protected shell, a startup domain schema with RLS, and a validated Server Action for startup creation. The directory, discovery, profile editing, application workflow, end-to-end coverage, and production observability remain incomplete unless the current code proves otherwise.

Keep README copy, UI claims, screenshots, and release notes aligned with reality. Do not present planned behavior, isolated backend functions, static demo cards, or unverified security properties as completed product functionality.

## Agent autonomy

The development agent has broad autonomy within the active task and may, without additional confirmation:

- inspect and edit repository files;
- create new source files, tests, migrations, configuration, and documentation;
- install or update dependencies when required by the task;
- run local commands, development servers, builds, tests, linters, and browser checks;
- use local or explicitly identified test Supabase environments;
- create task branches and logical commits;
- push a task branch or open a pull request when that is the natural requested outcome;
- make reasonable implementation decisions that stay within the requested scope.

Broad autonomy does not authorize unrelated refactors, speculative infrastructure, or changes outside the task.

## Hard restrictions

### Production Supabase

Never access or mutate a production Supabase project without explicit, task-specific user approval. This includes:

- applying migrations or running SQL;
- inserting, updating, deleting, or exporting production data;
- changing Auth, RLS, storage, Edge Functions, secrets, or project configuration;
- using a production service-role key or database connection string;
- creating production users or triggering real emails.

If an environment cannot be proven local, disposable, or explicitly designated as test, treat it as production. Preparing SQL or deployment instructions locally is allowed; applying them to production is not.

### File deletion

Do not delete or rename repository files without explicit user approval. This applies to tracked and untracked project files, migrations, assets, configuration, and generated artifacts stored in the repository. Do not run `git clean`, destructive reset commands, or recursive deletion commands.

Normal regeneration of tool-managed caches such as `.next/` during an existing project command is allowed. When deletion is genuinely required, identify the exact paths and explain why before requesting approval.

### Secrets and destructive Git operations

- Never commit `.env.local`, tokens, service-role keys, credentials, or private user data.
- Never use `git reset --hard`, discard user changes, rewrite shared history, or force-push unless the user explicitly requests it.
- Preserve unrelated changes already present in the working tree.

## Git workflow and commit history

Never implement changes directly on `main`.

1. Inspect `git status`, the current branch, and relevant history before editing.
2. Create a branch from the intended base using `<short-task-name>` unless the user supplies another name.
3. Keep each commit focused on one coherent, working change.
4. Use clear imperative commit messages, preferably Conventional Commit prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, or `chore:`.
5. Run checks appropriate to the commit before creating it.
6. Inspect the staged diff and confirm that no secrets, build output, coverage reports, or unrelated files are included.
7. Commit completed work proactively so regressions can be located and the project history remains understandable.

For a larger feature, prefer a small sequence such as schema/security, application logic, UI, and tests rather than one opaque commit. Every intermediate commit should build or clearly state why it is an intentionally dependent step. Do not create empty checkpoint commits.

## Repository map

- `app/` — Next.js App Router pages, layouts, Route Handlers, and Server Actions.
- `components/` — product components and reusable UI primitives.
- `components/ui/` — the existing Radix-based design primitives.
- `lib/validations.ts` — Zod schemas and domain input validation.
- `lib/supabase/` — browser, server, and Proxy clients plus database types.
- `proxy.ts` — Supabase session refresh and route protection.
- `supabase/migrations/` — PostgreSQL schema, constraints, triggers, indexes, and RLS policies.
- `tests/` — Vitest tests.
- `.github/workflows/ci.yml` — required CI behavior.
- `docs/` — repository and portfolio media.

Use the `@/` alias for root imports. Keep code and documentation in English unless the task explicitly requires another language.

## Development commands

Use Node.js 20.9 or newer and the npm lockfile.

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run check
npm run build
```

Use `npm ci` for clean and CI installations. When dependencies change, update `package.json` and `package-lock.json` together. Do not add a dependency when the platform or current stack provides a simple equivalent.

The public demo must continue to render safely without Supabase environment variables. Use only the environment variable names documented in `.env.example` and never introduce a public variable for a secret.

## Next.js and React architecture

- Treat the installed Next.js version as authoritative. Read the relevant local Next.js 16 documentation before changing routing, caching, Proxy, Server Actions, or framework configuration.
- Prefer React Server Components. Add `"use client"` only for browser APIs, state, effects, or event handlers.
- Perform reads in Server Components or server-only helpers. Perform mutations in Server Actions or Route Handlers.
- Keep server-only code out of client bundles. Never import `lib/supabase/server.ts` into a Client Component.
- Validate all untrusted input at the server boundary even when the client validates it too.
- Revalidate affected paths after successful mutations and redirect only after success.
- Validate user-controlled redirect destinations. Allow only safe internal paths; never forward arbitrary absolute URLs to `redirect()` or `router.push()`.
- Design loading, empty, validation, authorization, conflict, and unexpected-error states as part of every complete workflow.
- Avoid sequential client fetching when server rendering or parallel server reads can provide the data directly.

## Supabase and security architecture

PostgreSQL constraints and RLS are the final authorization boundary. Route protection and hidden UI controls are defense-in-depth only.

- Use the browser Supabase client only in Client Components and the server client on the server.
- Create a new server client per request; never keep it in global module state.
- For security-sensitive mutations, verify the user server-side with `supabase.auth.getUser()` or an equally strong verified identity.
- Derive `founder_id`, `applicant_id`, and similar ownership fields from the authenticated user, never submitted input.
- Parse every mutation payload with Zod before accessing the database.
- Keep policies least-privileged. A role-specific policy must check `profiles.role`; its name is not enforcement.
- Restrict state transitions and writable columns. A founder changing application status must not implicitly gain permission to rewrite applicant ownership or application content.
- Prevent users from applying to inactive projects, their own startup, or through a role-incompatible application type unless the product specification explicitly allows it.
- Return stable user-facing errors without exposing raw database or Auth messages. Preserve enough structured server context for diagnosis.
- Do not claim cookies are HTTP-only, encrypted, or hardened unless the installed Supabase configuration has been explicitly verified.
- Add rate limiting or abuse controls before exposing sensitive public mutations where the deployment platform supports them.

Treat committed migrations as append-only once they may have been applied. Add a new migration instead of rewriting historical production state. A database change is incomplete until all of the following remain synchronized:

1. SQL schema, constraints, indexes, and RLS;
2. Supabase-generated TypeScript database types;
3. Zod validation and shared domain constants;
4. Server reads and mutations;
5. UI states and form constraints;
6. positive and negative authorization tests;
7. setup and operational documentation.

TypeScript nullability and optional fields must match PostgreSQL `NULL` and `NOT NULL`. Prefer generating types from the schema; if generation is unavailable, verify every handwritten field against the migration.

## MVP implementation standard

Build vertical slices rather than disconnected layers. A typical feature should include, where applicable:

- schema and least-privilege RLS;
- typed data access and server-side validation;
- a reachable responsive UI;
- authentication and role-aware authorization;
- loading, empty, success, conflict, and failure states;
- focused unit and integration tests;
- end-to-end coverage for the critical path;
- accurate README or operational documentation.

Prefer the smallest complete workflow over several partially implemented screens. Do not use hard-coded demo data where the feature claims to show user-created content. Seed data must be clearly identified and restricted to local or test environments.

## TypeScript and code quality

- Keep strict TypeScript passing. Avoid `any`, unsafe casts, unexplained non-null assertions, and type-error suppression.
- Model expected Server Action failures with typed results. Reserve thrown errors for unexpected failures or framework control flow.
- Give empty strings, malformed numbers, repeated `FormData` fields, malformed JSON, and unique conflicts explicit behavior.
- Keep shared domain constants centralized so SQL checks, TypeScript unions, Zod enums, and UI options cannot drift silently.
- Prefer small functions with clear names around parsing, authorization, and data access.
- Do not refactor working areas merely for stylistic preference while implementing an unrelated feature.

## UI and accessibility

- Reuse `components/ui/`, current Tailwind tokens, and established interaction patterns before adding another UI system.
- Verify narrow mobile and desktop layouts in both light and dark themes for meaningful visual changes.
- Use semantic HTML, associated labels, visible keyboard focus, descriptive controls, and native browser behavior where possible.
- Keep server-rendered content as the default and avoid unnecessary Client Components or heavy client dependencies.
- Product copy must state what the user can actually do now. Planned workflows and static examples must be visually and textually distinguishable from persisted marketplace data.

## Testing strategy

Select checks based on risk; the following are minimums, not maximums.

- Documentation-only: inspect the diff, rendered Markdown structure, paths, and links.
- TypeScript, Server Component, Server Action, or shared logic: `npm run check`.
- Routing, Proxy, dependency, environment, or Next.js configuration: `npm run check` and `npm run build`.
- UI behavior: applicable automated checks plus browser verification of the changed flow, responsive layout, keyboard behavior, and both themes.
- Authentication, authorization, RLS, or migration: targeted positive and negative tests, local/test Supabase verification when available, `npm run check`, and `npm run build`.
- Critical MVP user flow: add or update Playwright coverage when the test environment supports it.

Tests should prove behavior and failure handling, not only validate implementation details. Current coverage configuration includes selected files; never describe that number as repository-wide coverage.

If an environment-dependent check cannot run, state exactly what remains unverified and why. Placeholder Supabase credentials can validate a build path but do not prove an Auth, database, or RLS integration.

## Definition of done

Before committing and handing off work, confirm that:

- the task is implemented on a dedicated branch;
- the requested user flow is reachable and complete;
- authentication, authorization, validation, data integrity, and error states are handled;
- schema, TypeScript types, Zod schemas, application logic, and UI agree;
- meaningful success and failure cases are tested;
- the appropriate check suite passes without new warnings;
- visual changes have proportional browser verification;
- no production Supabase action occurred without explicit approval;
- no file was deleted or renamed without explicit approval;
- no secrets, private data, build output, coverage output, or unrelated changes are included;
- the work is recorded in one or more clear, scoped commits;
- documentation describes the real current behavior and any remaining limitations.
