alter table public.facilities add column if not exists lost_reason text;
alter table public.facilities add column if not exists status_changed_at timestamptz;

create or replace function public.log_facility_status_change()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    insert into public.facility_activity(company_id, facility_id, kind, message)
    values (new.company_id, new.id, 'status_change', 'Facility status changed to ' || new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_facility_status_change on public.facilities;
create trigger trg_log_facility_status_change after update on public.facilities
for each row execute function public.log_facility_status_change();
