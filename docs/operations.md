# Startup Zone operations

## Environment boundaries

Use three isolated Supabase environments:

- local development, created by `npx supabase start`;
- demo/test, containing synthetic data only and disposable credentials;
- production, available only to the deployment runtime and approved operators.

The public portfolio deployment may use the demo/test project so visitors can
complete the marketplace flows. Its runtime receives only the project URL and
publishable key. Never configure the service-role key in Vercel or another
public application runtime.

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

The service-role key is required only by test fixture setup. It must never be
prefixed with `NEXT_PUBLIC_`, sent to the browser, committed, or configured in
the public demo.

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
approved production rollout. The bridge detects the later `specialist` enum and
does not replace newer onboarding or RLS policies when applied out of order.
Never repair migration history merely to hide a missing schema change.

## Release gate

Run this sequence from a clean checkout before deployment:

```bash
npm ci
npm run check
npm run build
npx supabase start
npx supabase db reset --local --no-seed
npm run test:rls
npm run test:e2e
```

Apply additive migrations to the designated test project before production.
Verify signup for all three roles, profile editing, startup publication and
deactivation, application submission, and founder moderation. Production
migration or deployment requires explicit approval and a recorded rollback
decision.

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
