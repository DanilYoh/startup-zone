-- Keep private contact details outside profiles so the existing profile-read
-- policy cannot expose them before an investment-interest request is accepted.

create table public.profile_contacts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  contact_email text,
  contact_url text,
  sharing_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint profile_contacts_email_check check (
    contact_email is null
    or (
      contact_email = btrim(contact_email)
      and char_length(contact_email) between 3 and 254
      and contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ),
  constraint profile_contacts_url_check check (
    contact_url is null
    or (
      contact_url = btrim(contact_url)
      and char_length(contact_url) <= 2048
      and contact_url ~* '^https?://'
    )
  ),
  constraint profile_contacts_enabled_value_check check (
    not sharing_enabled
    or contact_email is not null
    or contact_url is not null
  )
);

insert into public.profile_contacts (profile_id)
select profiles.id
from public.profiles
on conflict (profile_id) do nothing;

create or replace function public.handle_new_profile_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile_contacts (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_profile_contact() from public;

create trigger profiles_create_private_contact
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile_contact();

create trigger profile_contacts_set_updated_at
  before update on public.profile_contacts
  for each row execute procedure public.set_updated_at();

create or replace function public.can_read_profile_contact(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_profile_id is not null
    and auth.uid() is not null
    and exists (
      select 1
      from public.applications
      join public.startups on startups.id = applications.startup_id
      where applications.type = 'investor'
        and applications.status = 'accepted'
        and (
          (
            applications.applicant_id = target_profile_id
            and startups.founder_id = auth.uid()
          )
          or (
            startups.founder_id = target_profile_id
            and applications.applicant_id = auth.uid()
          )
        )
    );
$$;

revoke all on function public.can_read_profile_contact(uuid) from public, anon;
grant execute on function public.can_read_profile_contact(uuid) to authenticated, service_role;

alter table public.profile_contacts enable row level security;

create policy "Users can read permitted profile contacts"
  on public.profile_contacts
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or (
      sharing_enabled
      and public.can_read_profile_contact(profile_id)
    )
  );

create policy "Users can update their profile contact"
  on public.profile_contacts
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

revoke all on table public.profile_contacts from public, anon, authenticated;
grant select on table public.profile_contacts to authenticated;
grant update (contact_email, contact_url, sharing_enabled)
  on table public.profile_contacts to authenticated;
grant all privileges on table public.profile_contacts to service_role;
