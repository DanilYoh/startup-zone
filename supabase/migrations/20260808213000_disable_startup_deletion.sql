-- Startup lifecycle is reversible. Keep related applications intact by
-- allowing deactivation while removing hard-delete access from the Data API.
drop policy if exists "Founders can delete their startups" on public.startups;
revoke delete on table public.startups from anon, authenticated;

