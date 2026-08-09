-- Focus the active marketplace on founders and investors without rewriting
-- historical specialist records that may already exist in an applied database.
-- The legacy enum label remains storage-compatible, while triggers, onboarding,
-- RLS, and the application layer make it unreachable for new product activity.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  if requested_role is null
    or requested_role not in ('founder', 'investor') then
    raise exception using
      errcode = '22023',
      message = 'A founder or investor role is required';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    requested_role::public.user_role,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '')
  );

  return new;
end;
$$;

create or replace function public.enforce_active_marketplace_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.role not in ('founder', 'investor') then
    raise exception using
      errcode = '23514',
      message = 'Only founder and investor profiles are supported';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_active_marketplace_role on public.profiles;
create trigger profiles_enforce_active_marketplace_role
  before insert on public.profiles
  for each row execute procedure public.enforce_active_marketplace_role();

alter table public.profiles
  add column headline text,
  add column founder_experience text,
  add column investor_organization text,
  add column investment_thesis text,
  add column preferred_stages public.startup_stage[] not null default '{}',
  add column ticket_min numeric,
  add column ticket_max numeric,
  add column website_url text,
  add constraint profiles_headline_length_check
    check (headline is null or char_length(headline) <= 120),
  add constraint profiles_founder_experience_length_check
    check (founder_experience is null or char_length(founder_experience) <= 1200),
  add constraint profiles_investor_organization_length_check
    check (investor_organization is null or char_length(investor_organization) <= 120),
  add constraint profiles_investment_thesis_length_check
    check (investment_thesis is null or char_length(investment_thesis) <= 1500),
  add constraint profiles_preferred_stages_count_check
    check (cardinality(preferred_stages) <= 6),
  add constraint profiles_ticket_range_check
    check (
      (ticket_min is null or ticket_min between 1 and 1000000000)
      and (ticket_max is null or ticket_max between 1 and 1000000000)
      and (ticket_min is null or ticket_max is null or ticket_min <= ticket_max)
    ),
  add constraint profiles_website_url_http_check
    check (
      website_url is null
      or (
        char_length(website_url) <= 2048
        and website_url ~* '^https?://'
      )
    ),
  add constraint profiles_role_specific_fields_check
    check (
      (
        role = 'founder'
        and investor_organization is null
        and investment_thesis is null
        and cardinality(preferred_stages) = 0
        and ticket_min is null
        and ticket_max is null
        and website_url is null
      )
      or (
        role = 'investor'
        and founder_experience is null
      )
      or (
        role = 'specialist'
        and founder_experience is null
        and investor_organization is null
        and investment_thesis is null
        and cardinality(preferred_stages) = 0
        and ticket_min is null
        and ticket_max is null
        and website_url is null
      )
    );

revoke update on table public.profiles from authenticated;
grant update (
  full_name,
  avatar_url,
  bio,
  location,
  linkedin_url,
  headline,
  founder_experience,
  investor_organization,
  investment_thesis,
  preferred_stages,
  ticket_min,
  ticket_max,
  website_url
) on public.profiles to authenticated;

-- Founder credibility is part of the public startup pitch. The view remains a
-- narrow boundary: it exposes no contact details or private account fields.
create or replace view public.public_founder_profiles
with (security_barrier = true, security_invoker = false)
as
select
  profiles.id,
  profiles.full_name,
  profiles.location,
  profiles.headline,
  profiles.founder_experience
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

drop policy if exists "Eligible users can create their applications" on public.applications;
create policy "Eligible users can create their applications" on public.applications
  for insert
  with check (
    applicant_id = auth.uid()
    and applications.type = 'investor'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'investor'
    )
    and exists (
      select 1
      from public.startups
      where startups.id = applications.startup_id
        and startups.is_active
        and startups.founder_id <> auth.uid()
    )
  );

comment on type public.user_role is
  'Active product roles are founder and investor. The specialist label is retained only for immutable historical compatibility.';
