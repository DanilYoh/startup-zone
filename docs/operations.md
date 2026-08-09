# Startup Zone operations

The concrete single-VPS deployment profile, expected closed-beta budget, and
market-entry gates for Russia are documented in
[`russia-launch-plan.md`](russia-launch-plan.md). Its Docker Compose file runs
the application and TLS edge; the database and Auth services come from the
official self-hosted Supabase bundle and remain a separately pinned operational
dependency.

## Environment boundaries

Use three isolated Supabase environments:

- local development, created by `npx supabase start`;
- demo/test, containing synthetic data only and disposable credentials;
- production, available only to the deployment runtime and approved operators.

The public portfolio deployment may use the demo/test project so visitors can
complete the marketplace flows. Its runtime receives the project URL,
publishable key, and non-secret draft legal metadata. Never configure the
service-role key in Vercel or another public application runtime.

CI starts a fresh local Supabase stack, resets it from every migration with
`npx supabase db reset --local --no-seed`. It also resets specifically to the
immutable April migration, loads a legacy fixture, applies every pending
migration, and verifies that data and validated constraints survive the
upgrade. CI then compares generated TypeScript database types with the checked-in
file, runs pgTAP, builds the production bundle, and runs Playwright. A managed test project may be used for manual
release validation, but its URL, publishable key, and service-role key must be
stored in the CI secret manager. Never reuse production credentials or data.

The manual `Staging database` GitHub Actions workflow deploys migrations to the
dedicated test project and then runs remote pgTAP, the production build, and
Playwright against that environment. It reads configuration only from the
GitHub `Preview` environment and never receives production credentials.
The environment stores the project URL, reference, site URL, and session-pooler
host as variables; the publishable key, service-role key, and database password
remain encrypted secrets.
Before the first staging run, push `supabase/config.toml` to the test project so
synthetic registrations use the same confirmation and redirect behavior as the
local test stack. Never push the test Auth configuration to production.

Production may require email confirmation even though the isolated local/test
configuration confirms users immediately. Add the deployed origin as the Auth
site URL and allow its full `/auth/confirm` URL in the redirect allowlist.
Registration sets that callback as `emailRedirectTo`; the default hosted
confirmation template returns
a PKCE code that the callback exchanges for cookie-backed session credentials.
The callback also accepts `token_hash` links for projects that already use the
Supabase SSR custom template, so that template is optional rather than an
undocumented deployment dependency.

The service-role key is required only by test fixture setup. It must never be
prefixed with `NEXT_PUBLIC_`, sent to the browser, committed, or configured in
the public demo.

Playwright global setup requires `APP_ENVIRONMENT=local`, `test`, or `demo` and
uses the test service-role key to activate `local-development-v1` after a clean
no-seed migration. It refuses production mode. This keeps clean-migration CI and
the isolated staging workflow reproducible without adding any draft legal
version to a production migration.

Populate the isolated demo/test project with repeatable synthetic marketplace
data from a trusted operator machine:

```bash
APP_ENVIRONMENT=demo \
ALLOW_DEMO_SEED=true \
DEMO_SEED_PROJECT_REF=your-test-project-ref \
npm run demo:seed
```

The command reads `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`, creates a non-interactive synthetic founder, and
upserts the documented demo startups. It refuses to start unless the environment
is `local`, `test`, or `demo`, explicit seed authorization is enabled, and the
configured project ref exactly matches the Supabase URL. It rejects production
even when the other flags are present.

## Migration upgrade procedure

The April migration is immutable. The immediately following bridge migration
backfills missing legacy values, adds the schema objects that later hardening
migrations depend on, and validates its constraints before continuing. CI tests
both this real upgrade path and a clean installation.

A project that already recorded later August migrations from a clean database
will see the newly restored bridge as an older, missing migration. First apply
it to the isolated test project with `npx supabase migration up --linked
--include-all`, verify the schema and critical flows, and only then repeat the
approved production rollout. The bridge detects the historical `specialist`
enum label and does not replace newer onboarding or RLS policies when applied
out of order. Active onboarding still permits only founders and investors.
Never repair migration history merely to hide a missing schema change.

## Production legal-document activation

Local and test resets seed `local-development-v1`; that seed is never a
production approval. Production signup has two independent gates:

1. an additive, reviewed migration must insert the counsel-approved version in
   `legal_document_versions`, deactivate any previous version, and activate
   exactly the approved version;
2. the application runtime must set `APP_ENVIRONMENT=production`, every
   `LEGAL_*` value from `.env.example`, and `LEGAL_DOCUMENT_APPROVED=true` with
   an identical version and effective date.

Apply the database migration first while the application remains unavailable to
new registrations. Verify the active version from an approved operator session:

```sql
select version, title, effective_date
from public.legal_document_versions
where is_active;
```

Only then deploy the matching application configuration. Missing operator
details, an unsafe `draft`, `local`, or `test` version, a stale submitted
version, or no active database version keeps account creation closed. Do not set
the approval flag merely to pass the release gate. A new legal text requires a
new immutable version and additive migration; never rewrite a version that users
already accepted.

`compose.production.yaml` injects these values only into the server runtime. If
they are empty or approval is false, the application can still serve public and
existing-user routes while its registration form stays disabled. None of the
operator fields is a `NEXT_PUBLIC_*` build argument.

## Release gate

Run this sequence from a clean checkout before deployment:

```bash
npm ci
npm run check
npm run build
docker compose --env-file .env.example -f compose.production.yaml config --quiet
docker run --rm \
  --env APP_DOMAIN=app.example.com \
  --env SUPABASE_DOMAIN=api.example.com \
  --env SUPABASE_UPSTREAM=host.docker.internal:8000 \
  --volume "$PWD/deploy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2-alpine \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=release-check \
  --build-arg NEXT_PUBLIC_SITE_URL=https://example.com \
  --tag startup-zone:release-check .
npx supabase start
npx supabase db reset --local --no-seed
npm run test:rls
npm run test:e2e
```

Apply additive migrations to the designated test project before production.
Verify signup for both roles, role-specific profile editing, startup publication
and deactivation, investor interest submission, founder moderation, and the
accepted private-contact exchange from both dashboards. Production migration or
deployment requires explicit approval and a recorded rollback decision.

For a production candidate, also verify that `/legal/privacy` and
`/legal/consent` show the approved operator, processors, version, and effective
date; signup records one matching `legal_consents` row with a server timestamp;
and production registration is disabled when any legal value is removed. Do not
copy the local seed version into production.

The production image is a Next.js standalone build and runs as an unprivileged
user with a read-only root filesystem. `GET /healthz` is a process-liveness
probe and deliberately bypasses Auth Proxy and Supabase; a green liveness probe
does not prove database readiness or a complete user flow. Before shifting
traffic, run the critical browser flows against the production candidate and
check the Supabase gateway, Auth SMTP delivery, and database separately.

## Logging and unexpected errors

`instrumentation.ts` records process startup and unexpected request failures as
single-line JSON. Proxy assigns or propagates a bounded `x-request-id`, feature
read/write failures include it, and each log entry has a unique event id plus
environment and release metadata. Feature mutations and reads emit stable event
names, safe database/Auth error codes, and operational fields such as route and method.
Logs must not contain names, email addresses, profile text, application
messages, tokens, secrets, or raw database/Auth errors.

This is a structured-logging baseline, not complete production monitoring.
Before calling a deployment production-ready, forward stdout/stderr to a chosen
backend, verify ingestion, add metrics and alerts, and add approved client-error
collection. None of those external capabilities is implemented in this
repository. Alert on a sustained increase in `request.unexpected_error`,
authorization read failures, and write failures. Retention and access controls
must follow the deployment provider's data policy.

## Abuse controls and audit

Supabase Auth limits combined sign-in and sign-up attempts to 30 per five
minutes per IP in `supabase/config.toml`. Managed Supabase Auth rate limits must
be configured to the same or a stricter value.

PostgreSQL allows an authenticated applicant to create at most 20 applications
per rolling hour. The trigger is process-independent and cannot be bypassed by
calling Supabase directly. Accepted and rejected decisions are copied to the
RLS-protected `application_status_audit` table with the acting user, transition,
startup, and time. Application messages are deliberately excluded from audit
records.

## Backup and restore

Enable scheduled managed database backups and point-in-time recovery for the
production Supabase project when the selected plan supports them. In addition,
an approved operator can create an encrypted logical backup from a trusted
machine:

```bash
npx supabase db dump --db-url "$DATABASE_URL" --file "roles.sql" --role-only
npx supabase db dump --db-url "$DATABASE_URL" --file "schema.sql"
npx supabase db dump --db-url "$DATABASE_URL" --file "data.sql" --data-only --use-copy
```

Keep the percent-encoded database URL in a secret manager and store the backup
outside the repository with encryption, restricted access, retention, and
deletion policies. Do not place credentials in the command history.

Test every restore in a new, isolated test database before considering a
production restore:

```bash
psql "$RESTORE_DATABASE_URL" \
  --set ON_ERROR_STOP=on \
  --single-transaction \
  --file "roles.sql" \
  --file "schema.sql" \
  --command "SET session_replication_role = replica" \
  --file "data.sql"
```

After restore, run the schema/RLS tests and the critical Playwright flows
against that test environment. Record the backup timestamp, restore duration,
verification result, and operator. Perform this drill at least quarterly.
Never overwrite production as part of a restore drill.
