-- Keep the closed beta invitation-only at the database boundary. The
-- application hashes the one-time code before sending it to Auth, and this
-- trigger atomically validates and consumes the matching invitation.

create table public.beta_invitations (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  email text not null,
  role public.user_role not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid unique references auth.users(id) on delete cascade,
  constraint beta_invitations_code_hash_check check (
    code_hash = lower(btrim(code_hash))
    and char_length(code_hash) = 64
    and code_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint beta_invitations_email_check check (
    email = lower(btrim(email))
    and char_length(email) between 3 and 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint beta_invitations_role_check check (role::text in ('founder', 'investor')),
  constraint beta_invitations_expiry_check check (expires_at > created_at),
  constraint beta_invitations_usage_check check (
    (used_at is null and used_by is null)
    or (used_at is not null and used_by is not null)
  )
);

alter table public.beta_invitations enable row level security;

revoke all on table public.beta_invitations from public, anon, authenticated;
grant all privileges on table public.beta_invitations to service_role;

create or replace function public.is_beta_invitation_valid(
  candidate_hash text,
  candidate_email text,
  candidate_role text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.beta_invitations
    where candidate_hash ~ '^[0-9a-f]{64}$'
      and beta_invitations.code_hash = candidate_hash
      and beta_invitations.email = lower(btrim(candidate_email))
      and beta_invitations.role::text = candidate_role
      and beta_invitations.used_at is null
      and beta_invitations.expires_at > now()
  );
$$;

revoke all on function public.is_beta_invitation_valid(text, text, text) from public;
grant execute on function public.is_beta_invitation_valid(text, text, text) to anon, authenticated;

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
  invitation_hash text := lower(btrim(new.raw_user_meta_data ->> 'beta_invitation_hash'));
  invitation_id uuid;
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

  if invitation_hash is null
    or invitation_hash !~ '^[0-9a-f]{64}$' then
    raise exception using
      errcode = '22023',
      message = 'A valid beta invitation is required';
  end if;

  select beta_invitations.id
  into invitation_id
  from public.beta_invitations
  where beta_invitations.code_hash = invitation_hash
    and beta_invitations.email = lower(btrim(new.email))
    and beta_invitations.role::text = requested_role
    and beta_invitations.used_at is null
    and beta_invitations.expires_at > now()
  for update;

  if invitation_id is null then
    raise exception using
      errcode = '22023',
      message = 'The beta invitation is invalid, expired, or already used';
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

  update public.beta_invitations
  set
    used_at = now(),
    used_by = new.id
  where id = invitation_id;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

comment on table public.beta_invitations is
  'One-time, email- and role-bound closed-beta invitations. Only SHA-256 code hashes are stored; raw invitation codes are operator-held secrets.';

comment on function public.is_beta_invitation_valid(text, text, text) is
  'Pre-validates a high-entropy invitation hash for a stable signup error. The Auth trigger remains the atomic authorization boundary.';
