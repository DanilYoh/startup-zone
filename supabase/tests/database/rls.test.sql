begin;

select plan(10);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'founder@example.test', '{}'),
  ('10000000-0000-0000-0000-000000000002', 'specialist@example.test', '{}'),
  ('10000000-0000-0000-0000-000000000003', 'applicant@example.test', '{}'),
  ('10000000-0000-0000-0000-000000000004', 'other-founder@example.test', '{}'),
  ('10000000-0000-0000-0000-000000000005', 'investor@example.test', '{}');

update public.profiles
set role = 'team_seeker'
where id in (
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
);

update public.profiles
set role = 'investor'
where id = '10000000-0000-0000-0000-000000000005';

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
  '10000000-0000-0000-0000-000000000001',
  'Existing startup',
  'existing-startup',
  'A concise existing startup summary.',
  'A sufficiently detailed existing startup description for the RLS integration fixture.',
  'mvp',
  array['SaaS']
), (
  '10000000-0000-0000-0000-000000000004',
  'Inactive startup',
  'inactive-startup',
  'An inactive startup summary.',
  'A sufficiently detailed inactive startup description for the RLS integration fixture.',
  'idea',
  array['FinTech']
);

update public.startups
set is_active = false
where slug = 'inactive-startup';

select set_config(
  'test.inactive_startup_id',
  (select id::text from public.startups where slug = 'inactive-startup'),
  true
);

insert into public.applications (startup_id, applicant_id, type, message)
select
  id,
  '10000000-0000-0000-0000-000000000003',
  'team',
  'I can help build the first product release.'
from public.startups
where slug = 'existing-startup';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$
    insert into public.startups (
      founder_id, title, slug, one_pager, description, stage, niche
    ) values (
      '10000000-0000-0000-0000-000000000001',
      'Founder startup',
      'founder-startup',
      'A founder-owned startup summary.',
      'A detailed founder-owned startup description that passes every database constraint.',
      'idea',
      array['Marketplace']
    )
  $$,
  'a founder can create a startup owned by their profile'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select throws_like(
  $$
    insert into public.startups (
      founder_id, title, slug, one_pager, description, stage, niche
    ) values (
      '10000000-0000-0000-0000-000000000002',
      'Specialist startup',
      'specialist-startup',
      'A specialist-owned startup summary.',
      'A detailed specialist-owned startup description that passes every database constraint.',
      'idea',
      array['Marketplace']
    )
  $$,
  '%row-level security%',
  'a specialist cannot create a startup despite using their own id'
);

select lives_ok(
  $$
    insert into public.applications (startup_id, applicant_id, type, message)
    select
      id,
      '10000000-0000-0000-0000-000000000002',
      'team',
      'I would like to help the team.'
    from public.startups
    where slug = 'existing-startup'
  $$,
  'a specialist can apply to an active startup owned by another user'
);

select throws_like(
  $$
    insert into public.applications (startup_id, applicant_id, type, message, status)
    select
      id,
      '10000000-0000-0000-0000-000000000002',
      'investor',
      'I should not be able to choose the application status.',
      'accepted'
    from public.startups
    where slug = 'existing-startup'
  $$,
  '%permission denied%',
  'an applicant cannot choose a privileged initial status'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_like(
  $$
    insert into public.startups (
      founder_id, title, slug, one_pager, description, stage, niche
    ) values (
      '10000000-0000-0000-0000-000000000004',
      'Spoofed startup',
      'spoofed-startup',
      'A startup with spoofed ownership.',
      'A detailed startup description whose ownership is deliberately supplied as another user.',
      'idea',
      array['Marketplace']
    )
  $$,
  '%row-level security%',
  'a founder cannot create a startup for another user'
);

select throws_like(
  $$
    insert into public.applications (startup_id, applicant_id, type, message)
    select
      id,
      '10000000-0000-0000-0000-000000000001',
      'team',
      'I should not be able to apply to my own startup.'
    from public.startups
    where slug = 'existing-startup'
  $$,
  '%row-level security%',
  'a founder cannot apply to their own startup'
);

select lives_ok(
  $$
    update public.applications
    set status = 'accepted'
    where startup_id = (select id from public.startups where slug = 'existing-startup')
  $$,
  'a founder can update only the status of an application to their startup'
);

select throws_like(
  $$
    update public.applications
    set message = 'Rewritten by the founder'
    where startup_id = (select id from public.startups where slug = 'existing-startup')
  $$,
  '%permission denied%',
  'a founder cannot rewrite applicant-owned application content'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);

select throws_like(
  $$
    insert into public.applications (startup_id, applicant_id, type, message)
    values (
      current_setting('test.inactive_startup_id')::bigint,
      '10000000-0000-0000-0000-000000000005',
      'investor',
      'I should not be able to apply to an inactive startup.'
    )
  $$,
  '%row-level security%',
  'an investor cannot apply to an inactive startup'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);

select results_eq(
  $$
    with updated as (
      update public.applications
      set status = 'rejected'
      where startup_id = (select id from public.startups where slug = 'existing-startup')
      returning id
    )
    select count(*) from updated
  $$,
  $$ values (0::bigint) $$,
  'another founder cannot moderate applications to a startup they do not own'
);

reset role;
select * from finish();
rollback;
