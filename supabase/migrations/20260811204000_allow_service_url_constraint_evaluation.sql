-- Trusted fixture and operator writes use the same table constraints as browser
-- writes. The service role therefore needs access to these data-free validators.

grant execute on function public.external_url_hostname(text) to service_role;
grant execute on function public.is_public_https_url(text) to service_role;
grant execute on function public.is_pitch_deck_url(text) to service_role;
