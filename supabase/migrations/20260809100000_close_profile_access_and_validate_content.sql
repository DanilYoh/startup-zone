-- Complete the profile rollout, align direct Data API writes with Zod, and
-- expose only the founder fields required by the public marketplace.

update public.profiles
set
  full_name = nullif(btrim(full_name), ''),
  bio = nullif(btrim(bio), ''),
  location = nullif(btrim(location), ''),
  avatar_url = nullif(btrim(avatar_url), ''),
  linkedin_url = nullif(btrim(linkedin_url), '');

alter table public.profiles validate constraint profiles_full_name_length_check;
alter table public.profiles validate constraint profiles_bio_length_check;
alter table public.profiles validate constraint profiles_location_length_check;
alter table public.profiles validate constraint profiles_avatar_url_http_check;
alter table public.profiles validate constraint profiles_linkedin_url_check;

alter table public.profiles
  add constraint profiles_full_name_normalized_check
    check (full_name is null or full_name = btrim(full_name)) not valid,
  add constraint profiles_bio_normalized_check
    check (bio is null or (bio = btrim(bio) and bio <> '')) not valid,
  add constraint profiles_location_normalized_check
    check (location is null or (location = btrim(location) and location <> '')) not valid;

alter table public.profiles validate constraint profiles_full_name_normalized_check;
alter table public.profiles validate constraint profiles_bio_normalized_check;
alter table public.profiles validate constraint profiles_location_normalized_check;

-- Use database enums for finite domain values so generated TypeScript types
-- reflect the actual write contract instead of widening constrained text to
-- `string`.
create type public.startup_stage as enum (
  'idea', 'mvp', 'pre_seed', 'seed', 'series_a', 'later'
);
create type public.application_type as enum ('team', 'investor');
create type public.application_status as enum ('pending', 'accepted', 'rejected');

alter table public.startups
  drop constraint if exists startups_stage_check,
  alter column stage type public.startup_stage using stage::public.startup_stage;

drop policy if exists "Eligible users can create their applications" on public.applications;
drop trigger if exists applications_enforce_status_transition on public.applications;
drop trigger if exists applications_audit_status_change on public.applications;

alter table public.applications
  drop constraint if exists applications_type_check,
  drop constraint if exists applications_status_check,
  alter column status drop default,
  alter column type type public.application_type using type::public.application_type,
  alter column status type public.application_status using status::public.application_status,
  alter column status set default 'pending'::public.application_status;

create policy "Eligible users can create their applications" on public.applications
  for insert
  with check (
    applicant_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and (
          (applications.type = 'team' and profiles.role = 'specialist')
          or (applications.type = 'investor' and profiles.role = 'investor')
        )
    )
    and exists (
      select 1
      from public.startups
      where startups.id = applications.startup_id
        and startups.is_active
        and startups.founder_id <> auth.uid()
    )
  );

create trigger applications_enforce_status_transition
  before update of status on public.applications
  for each row execute procedure public.enforce_application_status_transition();

create trigger applications_audit_status_change
  after update of status on public.applications
  for each row execute procedure public.audit_application_status_change();

grant usage on type
  public.startup_stage,
  public.application_type,
  public.application_status
to anon, authenticated, service_role;

update public.startups
set
  title = btrim(title),
  slug = btrim(slug),
  one_pager = btrim(one_pager),
  description = btrim(description),
  niche = coalesce(
    (
      select array_agg(normalized.value order by normalized.first_position)
      from (
        select
          lower(btrim(item)) as comparison_key,
          min(position) as first_position,
          (array_agg(btrim(item) order by position))[1] as value
        from unnest(startups.niche) with ordinality as items(item, position)
        where btrim(item) <> ''
        group by lower(btrim(item))
      ) as normalized
    ),
    array['Other']::text[]
  );

create or replace function public.valid_startup_niches(value text[])
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select
    cardinality(value) between 1 and 8
    and not exists (
      select 1
      from unnest(value) as niche(item)
      where item <> btrim(item)
        or char_length(item) not between 1 and 40
    )
    and (
      select count(*) = count(distinct lower(item))
      from unnest(value) as niche(item)
    );
$$;

alter table public.startups
  alter column niche drop default,
  add constraint startups_title_normalized_check
    check (title = btrim(title) and char_length(title) between 3 and 80) not valid,
  add constraint startups_slug_normalized_check
    check (slug = btrim(slug) and char_length(slug) between 3 and 60) not valid,
  add constraint startups_one_pager_normalized_check
    check (one_pager = btrim(one_pager) and char_length(one_pager) between 10 and 240) not valid,
  add constraint startups_description_normalized_check
    check (description = btrim(description) and char_length(description) between 50 and 5000) not valid,
  add constraint startups_niche_content_check
    check (public.valid_startup_niches(niche)) not valid;

alter table public.startups validate constraint startups_title_normalized_check;
alter table public.startups validate constraint startups_slug_normalized_check;
alter table public.startups validate constraint startups_one_pager_normalized_check;
alter table public.startups validate constraint startups_description_normalized_check;
alter table public.startups validate constraint startups_niche_content_check;

create extension if not exists pg_trgm with schema extensions;

create index if not exists startups_title_trgm_idx
  on public.startups using gin (title extensions.gin_trgm_ops)
  where is_active = true;

create or replace function public.can_read_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_profile_id = auth.uid()
    or exists (
      select 1
      from public.applications
      join public.startups on startups.id = applications.startup_id
      where applications.applicant_id = target_profile_id
        and startups.founder_id = auth.uid()
    );
$$;

revoke all on function public.can_read_profile(uuid) from public, anon;
grant execute on function public.can_read_profile(uuid) to authenticated, service_role;

drop policy if exists "Public profiles are readable" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Profiles are visible to permitted users" on public.profiles;

create policy "Profiles are visible to permitted users" on public.profiles
  for select
  using (public.can_read_profile(id));

revoke select on table public.profiles from anon;
grant select on table public.profiles to authenticated;

-- This security-definer view is the intentional public boundary. It exposes
-- only the three fields used by public startup pages and only for founders who
-- currently have an active startup. Direct profile-table access remains closed.
create or replace view public.public_founder_profiles
with (security_barrier = true, security_invoker = false)
as
select
  profiles.id,
  profiles.full_name,
  profiles.location
from public.profiles
where profiles.role = 'founder'
  and exists (
    select 1
    from public.startups
    where startups.founder_id = profiles.id
      and startups.is_active
  );

revoke all on table public.public_founder_profiles from public, anon, authenticated;
grant select on table public.public_founder_profiles to anon, authenticated, service_role;
