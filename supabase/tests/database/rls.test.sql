begin;

select plan(27);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'founder@example.test',
    '{"role":"founder","full_name":"Test Founder"}'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'specialist@example.test',
    '{"role":"specialist","full_name":"Test Specialist"}'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'applicant@example.test',
    '{"role":"specialist","full_name":"Test Applicant"}'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'other-founder@example.test',
    '{"role":"founder","full_name":"Other Founder"}'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'investor@example.test',
    '{"role":"investor","full_name":"Test Investor"}'
  );

select results_eq(
  $$ select role::text from public.profiles where id = '10000000-0000-0000-0000-000000000001' $$,
  $$ values ('founder') $$,
  'founder onboarding assigns the requested founder role'
);

select results_eq(
  $$ select role::text from public.profiles where id = '10000000-0000-0000-0000-000000000002' $$,
  $$ values ('specialist') $$,
  'specialist onboarding assigns the requested specialist role'
);

select results_eq(
  $$ select role::text from public.profiles where id = '10000000-0000-0000-0000-000000000005' $$,
  $$ values ('investor') $$,
  'investor onboarding assigns the requested investor role'
);

select throws_like(
  $$
    insert into auth.users (id, email, raw_user_meta_data)
    values (
      '10000000-0000-0000-0000-000000000006',
      'invalid-role@example.test',
      '{"role":"admin","full_name":"Invalid Role"}'
    )
  $$,
  '%A valid marketplace role is required%',
  'onboarding rejects roles outside the marketplace enum'
);

select throws_like(
  $$
    update public.profiles
    set role = 'investor'
    where id = '10000000-0000-0000-0000-000000000002'
  $$,
  '%Profile role cannot be changed after onboarding%',
  'the database prevents privileged role changes after onboarding'
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

select lives_ok(
  $$
    update public.startups
    set is_active = false
    where slug = 'founder-startup'
  $$,
  'a founder can deactivate their own startup'
);

select throws_like(
  $$
    delete from public.startups
    where slug = 'founder-startup'
  $$,
  '%permission denied%',
  'hard deletion is unavailable even for the startup owner'
);

select throws_like(
  $$
    insert into public.startups (
      founder_id, title, slug, one_pager, description, stage, niche, website_url
    ) values (
      '10000000-0000-0000-0000-000000000001',
      'Unsafe link startup',
      'unsafe-link-startup',
      'A startup summary with an unsafe link.',
      'A detailed startup description that attempts to persist an unsafe external link.',
      'idea',
      array['Marketplace'],
      'javascript:alert(1)'
    )
  $$,
  '%startups_website_url_http_check%',
  'startup links are restricted to HTTP and HTTPS at the database boundary'
);

select throws_like(
  $$
    insert into public.startups (
      founder_id, title, slug, one_pager, description, stage, niche, deck_url
    ) values (
      '10000000-0000-0000-0000-000000000001',
      'Unsafe deck startup',
      'unsafe-deck-startup',
      'A startup summary with an unsafe deck.',
      'A detailed startup description that attempts to persist an unsafe pitch-deck link.',
      'idea',
      array['Marketplace'],
      'ftp://example.com/deck'
    )
  $$,
  '%startups_deck_url_http_check%',
  'pitch-deck links are restricted to HTTP and HTTPS at the database boundary'
);

select throws_like(
  $$
    insert into public.startups (
      founder_id, title, slug, one_pager, description, stage, niche
    ) values (
      '10000000-0000-0000-0000-000000000001',
      'Oversized slug startup',
      'startup-with-a-slug-that-is-deliberately-longer-than-sixty-characters-total',
      'A startup summary with an oversized slug.',
      'A detailed startup description that attempts to persist a slug longer than allowed.',
      'idea',
      array['Marketplace']
    )
  $$,
  '%startups_slug_length_check%',
  'startup slugs are limited to the same length as startupSchema'
);

select throws_like(
  $$
    insert into public.startups (
      founder_id, title, slug, one_pager, description, stage, niche
    ) values (
      '10000000-0000-0000-0000-000000000001',
      'Too many niches startup',
      'too-many-niches-startup',
      'A startup summary with too many niches.',
      'A detailed startup description that attempts to persist more niches than allowed.',
      'idea',
      array['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    )
  $$,
  '%startups_niche_count_check%',
  'startup niches are limited to the same count as startupSchema'
);

select throws_like(
  $$
    insert into public.startups (
      founder_id, title, slug, one_pager, description, stage, niche, funding_ask
    ) values (
      '10000000-0000-0000-0000-000000000001',
      'Oversized funding startup',
      'oversized-funding-startup',
      'A startup summary with an oversized funding ask.',
      'A detailed startup description that attempts to persist an oversized funding ask.',
      'idea',
      array['Marketplace'],
      1000000001
    )
  $$,
  '%startups_funding_ask_max_check%',
  'startup funding asks are limited to the same maximum as startupSchema'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select lives_ok(
  $$
    update public.profiles
    set
      full_name = 'Updated Specialist',
      bio = 'Product and growth specialist.',
      location = 'Yekaterinburg',
      avatar_url = 'https://images.example.test/specialist.png',
      linkedin_url = 'https://www.linkedin.com/in/updated-specialist'
    where id = '10000000-0000-0000-0000-000000000002'
  $$,
  'a specialist can update every allowed field on their own profile'
);

select throws_like(
  $$
    update public.profiles
    set avatar_url = 'javascript:alert(1)'
    where id = '10000000-0000-0000-0000-000000000002'
  $$,
  '%profiles_avatar_url_http_check%',
  'profile avatar URLs are restricted to HTTP and HTTPS'
);

select throws_like(
  $$
    update public.profiles
    set linkedin_url = 'https://linkedin.example.com/in/spoofed'
    where id = '10000000-0000-0000-0000-000000000002'
  $$,
  '%profiles_linkedin_url_check%',
  'profile LinkedIn URLs are restricted to the LinkedIn HTTPS origin'
);

select throws_like(
  $$
    update public.profiles
    set role = 'founder'
    where id = '10000000-0000-0000-0000-000000000002'
  $$,
  '%permission denied%',
  'a specialist cannot promote their own profile to founder'
);

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
      update public.startups
      set is_active = false
      where slug = 'existing-startup'
      returning id
    )
    select count(*) from updated
  $$,
  $$ values (0::bigint) $$,
  'another founder cannot update a startup they do not own'
);

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
