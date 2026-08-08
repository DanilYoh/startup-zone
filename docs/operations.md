# Startup Zone operations

## Environment boundaries

Use three isolated Supabase environments:

- local development, created by `npx supabase start`;
- test, containing synthetic data only and disposable credentials;
- production, available only to the deployment runtime and approved operators.

CI starts a fresh local Supabase stack, resets it from every migration with
`npx supabase db reset --local --no-seed`, runs pgTAP, builds the production
bundle, and runs Playwright. A managed test project may be used for manual
release validation, but its URL, publishable key, and service-role key must be
stored in the CI secret manager. Never reuse production credentials or data.

The service-role key is required only by test fixture setup. It must never be
prefixed with `NEXT_PUBLIC_`, sent to the browser, committed, or configured in
the public demo.

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
single-line JSON. Feature mutations and reads emit stable event names, safe
database/Auth error codes, and operational fields such as route and method.
Logs must not contain names, email addresses, profile text, application
messages, tokens, secrets, or raw database/Auth errors.

Forward the runtime's stdout and stderr to the chosen log platform. Alert on a
sustained increase in `request.unexpected_error`, authorization read failures,
and write failures. Retention and access controls must follow the deployment
provider's data policy.

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
