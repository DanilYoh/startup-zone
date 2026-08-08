-- Keep direct Data API writes aligned with applicationSchema and serialize
-- rate-limit checks for concurrent submissions from the same applicant.
alter table public.applications
  alter column message set not null,
  add constraint applications_message_length_check
    check (char_length(btrim(message)) between 20 and 2000);

create or replace function public.limit_application_submissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'application-submission:' || new.applicant_id::text,
      0
    )
  );

  if (
    select count(*)
    from public.applications
    where applicant_id = new.applicant_id
      and created_at >= pg_catalog.clock_timestamp() - interval '1 hour'
  ) >= 20 then
    raise exception using
      errcode = 'P0001',
      message = 'Application submission rate limit exceeded';
  end if;

  return new;
end;
$$;
