-- Enforce founder roles in founder-only policies and limit application moderation
-- to the status column.

drop policy "Founders can create startups" on public.startups;
drop policy "Founders can update their startups" on public.startups;
drop policy "Founders can delete their startups" on public.startups;
drop policy "Founders can read applications to their startups" on public.applications;
drop policy "Founders can update application status" on public.applications;
drop policy "Users can create their applications" on public.applications;

create policy "Founders can create startups" on public.startups
  for insert
  with check (
    founder_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'founder'
    )
  );

create policy "Founders can update their startups" on public.startups
  for update
  using (
    founder_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'founder'
    )
  )
  with check (
    founder_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'founder'
    )
  );

create policy "Founders can delete their startups" on public.startups
  for delete
  using (
    founder_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'founder'
    )
  );

create policy "Founders can read applications to their startups" on public.applications
  for select
  using (
    exists (
      select 1
      from public.startups
      join public.profiles on profiles.id = startups.founder_id
      where startups.id = applications.startup_id
        and startups.founder_id = auth.uid()
        and profiles.role = 'founder'
    )
  );

create policy "Eligible users can create their applications" on public.applications
  for insert
  with check (
    applicant_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and (
          (applications.type = 'team' and profiles.role = 'team_seeker')
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

create policy "Founders can update application status" on public.applications
  for update
  using (
    exists (
      select 1
      from public.startups
      join public.profiles on profiles.id = startups.founder_id
      where startups.id = applications.startup_id
        and startups.founder_id = auth.uid()
        and profiles.role = 'founder'
    )
  )
  with check (
    exists (
      select 1
      from public.startups
      join public.profiles on profiles.id = startups.founder_id
      where startups.id = applications.startup_id
        and startups.founder_id = auth.uid()
        and profiles.role = 'founder'
    )
  );

grant usage on schema public to anon, authenticated;

grant select on table public.profiles, public.startups to anon, authenticated;
grant select on table public.applications to authenticated;
revoke insert, update, delete on table public.startups from anon, authenticated;
grant insert (
  founder_id,
  title,
  slug,
  one_pager,
  description,
  stage,
  niche,
  funding_ask,
  equity_offered,
  deck_url,
  website_url
) on public.startups to authenticated;
grant update (
  title,
  slug,
  one_pager,
  description,
  stage,
  niche,
  funding_ask,
  equity_offered,
  deck_url,
  website_url,
  is_active
) on public.startups to authenticated;
grant delete on table public.startups to authenticated;

revoke insert, update, delete on table public.applications from anon, authenticated;
grant insert (startup_id, applicant_id, type, message) on public.applications to authenticated;
grant update (status) on public.applications to authenticated;

grant usage, select on sequence public.startups_id_seq, public.applications_id_seq to authenticated;
grant all privileges on table public.profiles, public.startups, public.applications to service_role;
grant all privileges on sequence public.startups_id_seq, public.applications_id_seq to service_role;
