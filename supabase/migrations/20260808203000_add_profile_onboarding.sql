-- Make the product role names explicit and assign them exactly once when the
-- corresponding auth user is created.
alter type public.user_role rename value 'team_seeker' to 'specialist';

alter table public.profiles
  alter column role drop default,
  add constraint profiles_full_name_length_check
    check (full_name is null or char_length(full_name) between 2 and 80) not valid,
  add constraint profiles_bio_length_check
    check (bio is null or char_length(bio) <= 1000) not valid,
  add constraint profiles_location_length_check
    check (location is null or char_length(location) <= 120) not valid,
  add constraint profiles_avatar_url_http_check
    check (
      avatar_url is null
      or (
        char_length(avatar_url) <= 2048
        and avatar_url ~* '^https?://'
      )
    ) not valid,
  add constraint profiles_linkedin_url_check
    check (
      linkedin_url is null
      or (
        char_length(linkedin_url) <= 2048
        and linkedin_url ~* '^https://([a-z0-9-]+\.)*linkedin\.com(?:/|$)'
      )
    ) not valid;

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
    or requested_role not in ('founder', 'specialist', 'investor') then
    raise exception using
      errcode = '22023',
      message = 'A valid marketplace role is required';
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

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception using
      errcode = '23514',
      message = 'Profile role cannot be changed after onboarding';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update of role on public.profiles
  for each row execute procedure public.prevent_profile_role_change();

