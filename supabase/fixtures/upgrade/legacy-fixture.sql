insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'legacy-founder@example.test',
    '{"full_name":"Legacy Founder"}'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'legacy-applicant@example.test',
    '{"full_name":"Legacy Applicant"}'
  );

insert into public.startups (
  founder_id,
  title,
  slug,
  one_pager,
  description,
  stage,
  niche
)
values (
  '20000000-0000-0000-0000-000000000001',
  '  Legacy startup  ',
  '  legacy-startup  ',
  null,
  null,
  null,
  array[]::text[]
);

insert into public.applications (
  startup_id,
  applicant_id,
  type,
  message,
  status
)
select
  id,
  '20000000-0000-0000-0000-000000000002',
  'team',
  null,
  null
from public.startups
where slug = '  legacy-startup  ';
