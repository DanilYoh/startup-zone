-- Local/test-only document version. Production must activate a separately
-- approved non-draft version before enabling registration.
insert into public.legal_document_versions (
  version,
  title,
  effective_date,
  is_active
) values (
  'local-development-v1',
  'Local development privacy and consent draft',
  '2026-08-09',
  true
)
on conflict (version) do update
set
  title = excluded.title,
  effective_date = excluded.effective_date,
  is_active = excluded.is_active;
