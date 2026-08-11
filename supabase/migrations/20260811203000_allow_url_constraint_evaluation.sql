-- PostgreSQL evaluates check-constraint functions with the permissions of the
-- caller performing the write. These pure validators need EXECUTE permission;
-- they expose no table data and accept only their supplied URL value.

grant execute on function public.external_url_hostname(text) to anon, authenticated;
grant execute on function public.is_public_https_url(text) to anon, authenticated;
grant execute on function public.is_pitch_deck_url(text) to anon, authenticated;
