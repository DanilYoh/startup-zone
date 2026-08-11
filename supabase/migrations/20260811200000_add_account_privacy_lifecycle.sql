-- Give every account a self-service export and deletion path without putting a
-- service-role key in the application runtime. Deletion removes product data
-- through existing cascades and immediately anonymizes the small audit subset
-- retained for aggregate legal/security evidence.

drop trigger if exists legal_consents_are_immutable on public.legal_consents;

alter table public.legal_consents
  add column evidence_id uuid not null default gen_random_uuid(),
  add column withdrawn_at timestamptz,
  drop constraint legal_consents_pkey,
  drop constraint legal_consents_email_check,
  alter column subject_id drop not null,
  alter column subject_email drop not null,
  add constraint legal_consents_pkey primary key (evidence_id),
  add constraint legal_consents_email_check check (
    subject_email is null
    or (
      subject_email = lower(btrim(subject_email))
      and char_length(subject_email) between 3 and 254
      and subject_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ),
  add constraint legal_consents_withdrawal_check check (
    (withdrawn_at is null and subject_id is not null and subject_email is not null)
    or (withdrawn_at is not null and subject_id is null and subject_email is null)
  );

create unique index legal_consents_active_subject_version_idx
  on public.legal_consents (subject_id, document_version)
  where subject_id is not null;

create or replace function public.prevent_legal_consent_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and current_setting('startup_zone.account_deletion', true) = old.subject_id::text
    and new.evidence_id = old.evidence_id
    and new.document_version = old.document_version
    and new.accepted_at = old.accepted_at
    and new.source = old.source
    and new.subject_id is null
    and new.subject_email is null
    and new.withdrawn_at is not null then
    return new;
  end if;

  raise exception using
    errcode = '55000',
    message = 'Legal consent records are immutable';
end;
$$;

create trigger legal_consents_are_immutable
  before update or delete on public.legal_consents
  for each row execute procedure public.prevent_legal_consent_changes();

alter table public.beta_invitations
  drop constraint beta_invitations_used_by_fkey,
  drop constraint beta_invitations_email_check,
  drop constraint beta_invitations_usage_check,
  alter column email drop not null,
  add constraint beta_invitations_used_by_fkey
    foreign key (used_by) references auth.users(id) on delete set null,
  add constraint beta_invitations_email_check check (
    email is null
    or (
      email = lower(btrim(email))
      and char_length(email) between 3 and 254
      and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ),
  add constraint beta_invitations_usage_check check (
    (used_at is null and used_by is null and email is not null)
    or used_at is not null
  );

create or replace function public.export_my_personal_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  result jsonb;
begin
  if account_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select jsonb_build_object(
    'schema_version', 1,
    'exported_at', statement_timestamp(),
    'account', (
      select jsonb_build_object(
        'id', users.id,
        'email', users.email,
        'created_at', users.created_at,
        'last_sign_in_at', users.last_sign_in_at
      )
      from auth.users
      where users.id = account_id
    ),
    'profile', (
      select to_jsonb(profiles)
      from public.profiles
      where profiles.id = account_id
    ),
    'private_contact', (
      select to_jsonb(profile_contacts)
      from public.profile_contacts
      where profile_contacts.profile_id = account_id
    ),
    'startups', coalesce((
      select jsonb_agg(to_jsonb(owned_startups) order by owned_startups.created_at)
      from (
        select * from public.startups where founder_id = account_id
      ) as owned_startups
    ), '[]'::jsonb),
    'applications', coalesce((
      select jsonb_agg(to_jsonb(account_applications) order by account_applications.created_at)
      from (
        select applications.*
        from public.applications
        where applications.applicant_id = account_id
          or exists (
            select 1
            from public.startups
            where startups.id = applications.startup_id
              and startups.founder_id = account_id
          )
      ) as account_applications
    ), '[]'::jsonb),
    'legal_consents', coalesce((
      select jsonb_agg(to_jsonb(account_consents) order by account_consents.accepted_at)
      from (
        select
          legal_consents.document_version,
          legal_consents.accepted_at,
          legal_consents.source,
          legal_consents.withdrawn_at
        from public.legal_consents
        where legal_consents.subject_id = account_id
      ) as account_consents
    ), '[]'::jsonb),
    'beta_invitations', coalesce((
      select jsonb_agg(to_jsonb(account_invitations) order by account_invitations.created_at)
      from (
        select
          beta_invitations.email,
          beta_invitations.role,
          beta_invitations.expires_at,
          beta_invitations.created_at,
          beta_invitations.used_at
        from public.beta_invitations
        where beta_invitations.used_by = account_id
      ) as account_invitations
    ), '[]'::jsonb),
    'content_reports', coalesce((
      select jsonb_agg(to_jsonb(account_reports) order by account_reports.created_at)
      from (
        select
          content_reports.startup_id,
          content_reports.link_kind,
          content_reports.reported_url,
          content_reports.reason,
          content_reports.status,
          content_reports.created_at,
          content_reports.reviewed_at
        from public.content_reports
        where content_reports.reporter_id = account_id
      ) as account_reports
    ), '[]'::jsonb),
    'decision_audit', coalesce((
      select jsonb_agg(to_jsonb(account_decisions) order by account_decisions.changed_at)
      from (
        select
          application_status_audit.application_id,
          application_status_audit.startup_id,
          application_status_audit.previous_status,
          application_status_audit.new_status,
          application_status_audit.changed_at
        from public.application_status_audit
        where application_status_audit.actor_id = account_id
      ) as account_decisions
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.delete_my_account()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
begin
  if account_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  perform set_config('startup_zone.account_deletion', account_id::text, true);

  update public.legal_consents
  set
    subject_id = null,
    subject_email = null,
    withdrawn_at = clock_timestamp()
  where subject_id = account_id;

  update public.beta_invitations
  set
    email = null,
    used_by = null
  where used_by = account_id;

  update public.application_status_audit
  set actor_id = null
  where actor_id = account_id;

  delete from auth.users where id = account_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Account not found';
  end if;

  return true;
end;
$$;

revoke all on function public.export_my_personal_data() from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.export_my_personal_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.export_my_personal_data() is
  'Exports the authenticated subject account and marketplace data without Auth secrets.';
comment on function public.delete_my_account() is
  'Withdraws consent, anonymizes retained audit evidence, and deletes the authenticated account.';
