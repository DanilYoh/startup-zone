begin;

select plan(10);

select has_table(
  'public',
  'beta_invitations',
  'the upgraded database has the closed-beta invitation boundary'
);

select ok(
  pg_get_functiondef('public.handle_new_user()'::regprocedure)
    like '%public.beta_invitations%',
  'the upgraded Auth trigger enforces beta invitations'
);

select results_eq(
  $$ select title from public.startups where slug = 'legacy-startup' $$,
  $$ values ('Legacy startup') $$,
  'the legacy startup survives and normalized identifiers remain reachable'
);

select results_eq(
  $$
    select one_pager, description, stage::text, niche
    from public.startups
    where slug = 'legacy-startup'
  $$,
  $$
    values (
      'Startup summary pending founder completion.',
      'Legacy startup description pending founder review and completion.',
      'idea',
      array['Other']::text[]
    )
  $$,
  'missing legacy startup fields are backfilled without dropping the row'
);

select results_eq(
  $$
    select message, status::text
    from public.applications
    where applicant_id = '20000000-0000-0000-0000-000000000002'
  $$,
  $$ values ('Legacy application message pending applicant review.', 'pending') $$,
  'missing legacy application fields are backfilled without dropping the row'
);

select results_eq(
  $$
    select count(*)
    from pg_constraint
    where connamespace = 'public'::regnamespace
      and not convalidated
  $$,
  $$ values (0::bigint) $$,
  'all public constraints are validated after the upgrade'
);

select results_eq(
  $$
    select column_default::text
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'startups'
      and column_name = 'niche'
  $$,
  $$ values (null::text) $$,
  'startup niche no longer has an invalid empty-array default'
);

select has_view(
  'public',
  'public_founder_profiles',
  'the minimal public founder-profile boundary exists'
);

set local role anon;

select throws_like(
  $$ select * from public.profiles $$,
  '%permission denied%',
  'anonymous users cannot read the profiles table after upgrading'
);

select results_eq(
  $$ select full_name, location from public.public_founder_profiles $$,
  $$ values ('Legacy Founder', null::text) $$,
  'anonymous users receive only the intended founder fields through the view'
);

reset role;
select * from finish();
rollback;
