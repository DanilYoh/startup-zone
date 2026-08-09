-- Require every newly created marketplace account to declare consent to one
-- active legal-document version. The application selects the version, while
-- this trigger is the independent database boundary for direct Auth calls.

create table public.legal_document_versions (
  version text primary key,
  title text not null,
  effective_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint legal_document_versions_version_check check (
    version = btrim(version)
    and char_length(version) between 3 and 80
    and version ~ '^[a-z0-9][a-z0-9._-]+$'
  ),
  constraint legal_document_versions_title_check check (
    title = btrim(title)
    and char_length(title) between 3 and 160
  )
);

create unique index legal_document_versions_one_active_idx
  on public.legal_document_versions ((is_active))
  where is_active;

create table public.legal_consents (
  subject_id uuid not null,
  subject_email text not null,
  document_version text not null references public.legal_document_versions(version),
  accepted_at timestamptz not null default timezone('utc'::text, now()),
  source text not null default 'signup',
  primary key (subject_id, document_version),
  constraint legal_consents_email_check check (
    subject_email = lower(btrim(subject_email))
    and char_length(subject_email) between 3 and 254
    and subject_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint legal_consents_source_check check (source = 'signup')
);

create or replace function public.prevent_legal_consent_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'Legal consent records are immutable';
end;
$$;

revoke all on function public.prevent_legal_consent_changes() from public;

create trigger legal_consents_are_immutable
  before update or delete on public.legal_consents
  for each row execute procedure public.prevent_legal_consent_changes();

alter table public.legal_document_versions enable row level security;
alter table public.legal_consents enable row level security;

create policy "Users can read their own legal consents"
  on public.legal_consents
  for select
  to authenticated
  using (subject_id = auth.uid());

revoke all on table public.legal_document_versions from public, anon, authenticated;
revoke all on table public.legal_consents from public, anon, authenticated;
grant select on table public.legal_consents to authenticated;
grant all privileges on table public.legal_document_versions, public.legal_consents to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  consent_version text := btrim(new.raw_user_meta_data ->> 'legal_document_version');
  consent_accepted boolean := coalesce(
    (new.raw_user_meta_data ->> 'legal_consent')::boolean,
    false
  );
begin
  if requested_role is null
    or requested_role not in ('founder', 'investor') then
    raise exception using
      errcode = '22023',
      message = 'A founder or investor role is required';
  end if;

  if not consent_accepted or consent_version is null then
    raise exception using
      errcode = '22023',
      message = 'Versioned personal data consent is required';
  end if;

  if not exists (
    select 1
    from public.legal_document_versions
    where legal_document_versions.version = consent_version
      and legal_document_versions.is_active
  ) then
    raise exception using
      errcode = '22023',
      message = 'The personal data consent version is not active';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    requested_role::public.user_role,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '')
  );

  insert into public.legal_consents (
    subject_id,
    subject_email,
    document_version
  ) values (
    new.id,
    lower(btrim(new.email)),
    consent_version
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

comment on table public.legal_document_versions is
  'Operator-approved privacy-policy and personal-data-consent bundle versions. Production must activate an approved non-draft version before registration.';
comment on table public.legal_consents is
  'Immutable server-timestamped evidence of the legal-document version accepted during account creation.';
