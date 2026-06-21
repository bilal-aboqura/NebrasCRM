create type public.lost_reason_type as enum (
  'price',
  'competitor',
  'no_response',
  'not_interested',
  'other'
);

alter table public.facilities
  add column lost_reason public.lost_reason_type,
  add column status_changed_at timestamptz not null default now();

create index idx_facilities_pipeline
  on public.facilities(company_id, status, status_changed_at desc)
  where is_active;

create or replace function public.set_facility_status_changed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger set_facility_status_changed_at
before update of status on public.facilities
for each row execute function public.set_facility_status_changed_at();

-- The transition and its timeline event must commit together. The expected status
-- also prevents a stale board from overwriting a concurrent edit.
create or replace function public.transition_facility_status(
  p_facility_id uuid,
  p_company_id uuid,
  p_actor_id uuid,
  p_expected_status public.facility_status,
  p_new_status public.facility_status,
  p_lost_reason public.lost_reason_type default null
)
returns table (status public.facility_status, status_changed_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_status public.facility_status;
begin
  select f.status
    into current_status
    from public.facilities f
   where f.id = p_facility_id
     and f.company_id = p_company_id
     and f.is_active
   for update;

  if not found then
    raise exception 'facility not found or archived' using errcode = 'P0002';
  end if;
  if current_status is distinct from p_expected_status then
    raise exception 'facility status changed concurrently' using errcode = '40001';
  end if;
  if p_new_status = 'lost' and p_lost_reason is null then
    raise exception 'lost reason is required' using errcode = '22023';
  end if;
  if p_new_status = current_status then
    return query
      select f.status, f.status_changed_at
        from public.facilities f
       where f.id = p_facility_id;
    return;
  end if;

  update public.facilities f
     set status = p_new_status,
         lost_reason = case when p_new_status = 'lost' then p_lost_reason else null end
   where f.id = p_facility_id;

  insert into public.facility_activity (
    company_id, facility_id, actor_id, event_type, old_value, new_value
  ) values (
    p_company_id,
    p_facility_id,
    p_actor_id,
    'status_change',
    current_status::text,
    case
      when p_new_status = 'lost' then p_new_status::text || ':' || p_lost_reason::text
      else p_new_status::text
    end
  );

  return query
    select f.status, f.status_changed_at
      from public.facilities f
     where f.id = p_facility_id;
end;
$$;

revoke execute on function public.transition_facility_status(
  uuid, uuid, uuid, public.facility_status, public.facility_status, public.lost_reason_type
) from public, anon, authenticated;
grant execute on function public.transition_facility_status(
  uuid, uuid, uuid, public.facility_status, public.facility_status, public.lost_reason_type
) to service_role;
