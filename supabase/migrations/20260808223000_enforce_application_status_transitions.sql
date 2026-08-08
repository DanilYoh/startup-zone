-- Application decisions are terminal for the MVP. A founder may decide a
-- pending application once, but cannot reopen or reverse that decision.
create or replace function public.enforce_application_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
    and not (
      old.status = 'pending'
      and new.status in ('accepted', 'rejected')
    ) then
    raise exception using
      errcode = '23514',
      message = 'Invalid application status transition';
  end if;

  return new;
end;
$$;

create trigger applications_enforce_status_transition
  before update of status on public.applications
  for each row execute procedure public.enforce_application_status_transition();

