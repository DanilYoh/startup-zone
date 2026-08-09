-- Upgrade databases that already applied the immutable April schema. This
-- migration deliberately precedes the August hardening migrations because
-- those migrations depend on the policy and constraint names established here.

-- Backfill only missing/blank legacy values. Overlong or otherwise ambiguous
-- data is rejected by VALIDATE CONSTRAINT below instead of being truncated.
update public.startups
set
  title = btrim(title),
  slug = btrim(slug),
  one_pager = coalesce(
    nullif(btrim(one_pager), ''),
    'Startup summary pending founder completion.'
  ),
  description = coalesce(
    nullif(btrim(description), ''),
    'Legacy startup description pending founder review and completion.'
  ),
  stage = coalesce(stage, 'idea'),
  niche = case
    when niche is null or cardinality(niche) = 0 then array['Other']::text[]
    else niche
  end;

update public.applications
set
  message = coalesce(
    nullif(btrim(message), ''),
    'Legacy application message pending applicant review.'
  ),
  status = coalesce(status, 'pending');

alter table public.startups
  alter column one_pager set not null,
  alter column description set not null,
  alter column stage set not null,
  alter column niche set not null,
  alter column niche drop default,
  alter column is_active set not null;

alter table public.applications
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.startups'::regclass
      and conname = 'startups_title_length_check'
  ) then
    alter table public.startups
      add constraint startups_title_length_check
      check (char_length(title) between 3 and 80) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.startups'::regclass
      and conname = 'startups_slug_format_check'
  ) then
    alter table public.startups
      add constraint startups_slug_format_check
      check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.startups'::regclass
      and conname = 'startups_one_pager_length_check'
  ) then
    alter table public.startups
      add constraint startups_one_pager_length_check
      check (char_length(one_pager) between 10 and 240) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.startups'::regclass
      and conname = 'startups_description_length_check'
  ) then
    alter table public.startups
      add constraint startups_description_length_check
      check (char_length(description) between 50 and 5000) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.startups'::regclass
      and conname = 'startups_funding_ask_positive_check'
  ) then
    alter table public.startups
      add constraint startups_funding_ask_positive_check
      check (funding_ask is null or funding_ask > 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.startups'::regclass
      and conname = 'startups_equity_offered_range_check'
  ) then
    alter table public.startups
      add constraint startups_equity_offered_range_check
      check (equity_offered is null or equity_offered between 0 and 100) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.applications'::regclass
      and conname = 'applications_message_max_length_check'
  ) then
    alter table public.applications
      add constraint applications_message_max_length_check
      check (message is null or char_length(message) <= 2000) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.applications'::regclass
      and conname = 'applications_startup_id_applicant_id_type_key'
  ) then
    alter table public.applications
      add constraint applications_startup_id_applicant_id_type_key
      unique (startup_id, applicant_id, type);
  end if;
end;
$$;

alter table public.startups validate constraint startups_title_length_check;
alter table public.startups validate constraint startups_slug_format_check;
alter table public.startups validate constraint startups_one_pager_length_check;
alter table public.startups validate constraint startups_description_length_check;
alter table public.startups validate constraint startups_funding_ask_positive_check;
alter table public.startups validate constraint startups_equity_offered_range_check;
alter table public.applications validate constraint applications_message_max_length_check;

create index if not exists startups_active_created_idx
  on public.startups (created_at desc)
  where is_active = true;

create index if not exists applications_startup_idx
  on public.applications (startup_id);

create index if not exists applications_applicant_idx
  on public.applications (applicant_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists startups_set_updated_at on public.startups;
create trigger startups_set_updated_at
  before update on public.startups
  for each row execute procedure public.set_updated_at();

-- A database that already reached profile onboarding uses the `specialist`
-- enum label. Do not replace its newer auth function or policies when this
-- older bridge migration is applied out of order with `--include-all`.
do $$
begin
  if exists (
    select 1
    from pg_enum
    where enumtypid = 'public.user_role'::regtype
      and enumlabel = 'team_seeker'
  ) then
    execute $function$
      create or replace function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer
      set search_path = ''
      as $body$
      begin
        insert into public.profiles (id, role, full_name)
        values (new.id, 'founder', new.raw_user_meta_data ->> 'full_name');
        return new;
      end;
      $body$
    $function$;

    drop policy if exists "Users can view own profile" on public.profiles;
    drop policy if exists "Users can update own profile" on public.profiles;
    drop policy if exists "Public profiles are readable" on public.profiles;
    drop policy if exists "Users can update their profile" on public.profiles;
    drop policy if exists "Anyone can read active startups" on public.startups;
    drop policy if exists "Founders can manage own startups" on public.startups;
    drop policy if exists "Active startups are readable" on public.startups;
    drop policy if exists "Founders can create startups" on public.startups;
    drop policy if exists "Founders can update their startups" on public.startups;
    drop policy if exists "Founders can delete their startups" on public.startups;
    drop policy if exists "Users can see own applications" on public.applications;
    drop policy if exists "Founders can see applications to their startups" on public.applications;
    drop policy if exists "Users can create applications" on public.applications;
    drop policy if exists "Applicants can read their applications" on public.applications;
    drop policy if exists "Founders can read applications to their startups" on public.applications;
    drop policy if exists "Users can create their applications" on public.applications;
    drop policy if exists "Founders can update application status" on public.applications;

    create policy "Users can view own profile" on public.profiles
      for select using (auth.uid() = id);

    create policy "Users can update their profile" on public.profiles
      for update using (auth.uid() = id)
      with check (auth.uid() = id);

    create policy "Active startups are readable" on public.startups
      for select using (is_active or founder_id = auth.uid());

    create policy "Founders can create startups" on public.startups
      for insert with check (founder_id = auth.uid());

    create policy "Founders can update their startups" on public.startups
      for update using (founder_id = auth.uid())
      with check (founder_id = auth.uid());

    create policy "Founders can delete their startups" on public.startups
      for delete using (founder_id = auth.uid());

    create policy "Applicants can read their applications" on public.applications
      for select using (applicant_id = auth.uid());

    create policy "Founders can read applications to their startups" on public.applications
      for select using (
        exists (
          select 1
          from public.startups
          where startups.id = applications.startup_id
            and startups.founder_id = auth.uid()
        )
      );

    create policy "Users can create their applications" on public.applications
      for insert with check (applicant_id = auth.uid());

    create policy "Founders can update application status" on public.applications
      for update using (
        exists (
          select 1
          from public.startups
          where startups.id = applications.startup_id
            and startups.founder_id = auth.uid()
        )
      );
  end if;
end;
$$;
