-- Keep persisted external links safe to render as clickable startup metadata.
alter table public.startups
  add constraint startups_website_url_http_check
  check (
    website_url is null
    or website_url ~* '^https?://[^[:space:]]+$'
  );

alter table public.startups
  add constraint startups_deck_url_http_check
  check (
    deck_url is null
    or deck_url ~* '^https?://[^[:space:]]+$'
  );
