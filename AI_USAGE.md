# AI usage disclosure

AI-assisted development tools have been used to draft parts of the application,
tests, SQL review notes, CI configuration, and documentation. They are treated
as implementation aids, not as an authority or reviewer of record.

The repository owner remains responsible for accepting product and architecture
decisions, reviewing diffs, protecting credentials, interpreting legal advice,
and approving releases. Generated code is expected to pass the same lint,
type, unit, coverage, build, pgTAP, and end-to-end gates as manually written
code.

Database migrations are checked through both a clean installation and the
documented legacy upgrade fixture on a disposable local database. Security-
sensitive changes are expected to include a regression test at the appropriate
boundary: Vitest for application rules, pgTAP for grants/RLS/constraints, and
Playwright for complete authenticated flows. Passing automated checks does not
replace human review or a staging rehearsal.

Known product and operational limitations are maintained in
[`docs/operations.md`](docs/operations.md#known-limitations). Claims about a
production deployment, backup restore, monitoring ingestion, alert delivery, or
external review must not be made until that activity has actually been recorded.
