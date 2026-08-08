-- Keep role assignment privileged and align Data API writes with startupSchema.
revoke insert, update, delete on table public.profiles from anon, authenticated;

grant update (
  full_name,
  avatar_url,
  bio,
  location,
  linkedin_url
) on public.profiles to authenticated;

grant all privileges on table public.profiles to service_role;

alter table public.startups
  add constraint startups_slug_length_check
  check (char_length(slug) between 3 and 60),
  add constraint startups_niche_count_check
  check (cardinality(niche) between 1 and 8),
  add constraint startups_funding_ask_max_check
  check (funding_ask is null or funding_ask <= 1000000000);
