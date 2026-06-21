alter type public.facility_activity_type add value if not exists 'followup_create';
alter type public.facility_activity_type add value if not exists 'followup_complete';
alter type public.facility_activity_type add value if not exists 'followup_reschedule';
alter type public.facility_activity_type add value if not exists 'followup_cancel';
alter type public.facility_activity_type add value if not exists 'followup_reassign';

create type public.followup_type as enum ('call', 'visit', 'send_offer', 'other');
create type public.followup_status as enum ('pending', 'done', 'cancelled');
create type public.followup_outcome as enum (
  'answered', 'no_answer', 'callback_requested', 'not_interested',
  'met_decision_maker', 'no_show', 'rescheduled', 'followup_needed',
  'offer_sent', 'feedback_received', 'offer_rejected', 'offer_accepted',
  'task_completed', 'postponed'
);

create unique index if not exists contacts_facility_id_id_unique
  on public.contacts(facility_id, id);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  contact_id uuid,
  assigned_to uuid not null references public.profiles(id),
  type public.followup_type not null,
  due_at timestamptz not null,
  status public.followup_status not null default 'pending',
  notes text,
  outcome public.followup_outcome,
  outcome_note text,
  cancel_reason text,
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  cancelled_by uuid references public.profiles(id),
  cancelled_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint followups_facility_company_fk foreign key (facility_id, company_id)
    references public.facilities(id, company_id),
  constraint followups_facility_contact_fk foreign key (facility_id, contact_id)
    references public.contacts(facility_id, id) on delete set null (contact_id),
  constraint followups_completion_state check (
    (status = 'done' and completed_by is not null and completed_at is not null)
    or (status <> 'done' and completed_by is null and completed_at is null)
  ),
  constraint followups_cancellation_state check (
    (status = 'cancelled' and cancelled_by is not null and cancelled_at is not null)
    or (status <> 'cancelled' and cancelled_by is null and cancelled_at is null)
  )
);

create index idx_followups_company_id on public.followups(company_id);
create index idx_followups_facility_id on public.followups(facility_id);
create index idx_followups_assigned_to on public.followups(assigned_to);
create index idx_followups_status_due_at on public.followups(status, due_at);
create index idx_followups_company_owner_status_due
  on public.followups(company_id, assigned_to, status, due_at);

create or replace function public.touch_followup_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger trg_followups_updated_at before update on public.followups
for each row execute function public.touch_followup_updated_at();

create or replace function public.followup_actor_can_manage(
  p_actor_id uuid, p_company_id uuid, p_facility_id uuid, p_management_only boolean default false
) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    join public.facilities f on f.id = p_facility_id and f.company_id = p_company_id
    where p.id = p_actor_id and p.status = 'active' and f.is_active
      and (p.role = 'super_admin' or p.company_id = p_company_id)
      and (p.role <> 'sales_user' or (not p_management_only and f.assigned_to = p_actor_id))
  )
$$;

create or replace function public.followup_outcome_matches_type(
  p_type public.followup_type, p_outcome public.followup_outcome
) returns boolean language sql immutable as $$
  select p_outcome is null or case p_type
    when 'call' then p_outcome in ('answered', 'no_answer', 'callback_requested', 'not_interested')
    when 'visit' then p_outcome in ('met_decision_maker', 'no_show', 'rescheduled', 'followup_needed')
    when 'send_offer' then p_outcome in ('offer_sent', 'feedback_received', 'offer_rejected', 'offer_accepted')
    when 'other' then p_outcome in ('task_completed', 'postponed')
  end
$$;

create or replace function public.create_followup_atomic(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_input jsonb
) returns public.followups language plpgsql security definer set search_path = '' as $$
declare
  result public.followups;
  facility_owner uuid;
  owner_id uuid;
  contact_id uuid := nullif(p_input->>'contact_id', '')::uuid;
  due_time timestamptz := (p_input->>'due_at')::timestamptz;
begin
  if not public.followup_actor_can_manage(p_actor_id, p_company_id, p_facility_id) then
    raise exception 'followup access denied' using errcode = '42501';
  end if;
  if due_time < now() + interval '1 minute' then
    raise exception 'followup due date must be in the future' using errcode = '22007';
  end if;
  select assigned_to into facility_owner from public.facilities
    where id = p_facility_id and company_id = p_company_id and is_active;
  owner_id := coalesce(nullif(p_input->>'assigned_to', '')::uuid, facility_owner, p_actor_id);
  if not exists (
    select 1 from public.profiles p where p.id = owner_id and p.status = 'active'
      and (p.company_id = p_company_id or (p.id = p_actor_id and p.role = 'super_admin'))
  ) then
    raise exception 'invalid followup owner' using errcode = '23514';
  end if;
  if (select role = 'sales_user' from public.profiles where id = p_actor_id) and owner_id <> p_actor_id then
    raise exception 'sales users cannot reassign followups' using errcode = '42501';
  end if;
  if contact_id is not null and not exists (
    select 1 from public.contacts c where c.id = contact_id and c.facility_id = p_facility_id
      and c.company_id = p_company_id and not c.is_archived
  ) then
    raise exception 'contact does not belong to facility' using errcode = '23503';
  end if;

  insert into public.followups (
    company_id, facility_id, contact_id, assigned_to, type, due_at, notes, created_by
  ) values (
    p_company_id, p_facility_id, contact_id, owner_id,
    (p_input->>'type')::public.followup_type, due_time,
    nullif(trim(p_input->>'notes'), ''), p_actor_id
  ) returning * into result;
  insert into public.facility_activity (company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, p_facility_id, p_actor_id, 'followup_create',
      'تمت جدولة متابعة جديدة بتاريخ ' || to_char(due_time at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI'));
  return result;
end;
$$;

create or replace function public.complete_followup_atomic(
  p_company_id uuid, p_followup_id uuid, p_actor_id uuid,
  p_outcome public.followup_outcome default null, p_outcome_note text default null
) returns public.followups language plpgsql security definer set search_path = '' as $$
declare current_row public.followups; result public.followups;
begin
  select * into current_row from public.followups
    where id = p_followup_id and company_id = p_company_id for update;
  if current_row.id is null or not public.followup_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id) then
    raise exception 'followup access denied' using errcode = '42501';
  end if;
  if current_row.status <> 'pending' then raise exception 'followup is not pending' using errcode = '23514'; end if;
  if not public.followup_outcome_matches_type(current_row.type, p_outcome) then
    raise exception 'outcome does not match followup type' using errcode = '23514';
  end if;
  update public.followups set status = 'done', outcome = p_outcome,
    outcome_note = nullif(trim(p_outcome_note), ''), completed_by = p_actor_id, completed_at = now()
    where id = p_followup_id returning * into result;
  insert into public.facility_activity (company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'followup_complete',
      coalesce(nullif(trim(p_outcome_note), ''), 'تم إتمام المتابعة'));
  return result;
end;
$$;

create or replace function public.reschedule_followup_atomic(
  p_company_id uuid, p_followup_id uuid, p_actor_id uuid, p_due_at timestamptz
) returns public.followups language plpgsql security definer set search_path = '' as $$
declare current_row public.followups; result public.followups;
begin
  select * into current_row from public.followups
    where id = p_followup_id and company_id = p_company_id for update;
  if current_row.id is null or not public.followup_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id) then
    raise exception 'followup access denied' using errcode = '42501';
  end if;
  if current_row.status <> 'pending' then raise exception 'followup is not pending' using errcode = '23514'; end if;
  if p_due_at < now() + interval '1 minute' then
    raise exception 'followup due date must be in the future' using errcode = '22007';
  end if;
  update public.followups set due_at = p_due_at where id = p_followup_id returning * into result;
  insert into public.facility_activity (company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'followup_reschedule',
      to_char(current_row.due_at at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI'),
      to_char(p_due_at at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI'));
  return result;
end;
$$;

create or replace function public.cancel_followup_atomic(
  p_company_id uuid, p_followup_id uuid, p_actor_id uuid, p_cancel_reason text default null
) returns public.followups language plpgsql security definer set search_path = '' as $$
declare current_row public.followups; result public.followups;
begin
  select * into current_row from public.followups
    where id = p_followup_id and company_id = p_company_id for update;
  if current_row.id is null or not public.followup_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id) then
    raise exception 'followup access denied' using errcode = '42501';
  end if;
  if current_row.status <> 'pending' then raise exception 'followup is not pending' using errcode = '23514'; end if;
  update public.followups set status = 'cancelled', cancel_reason = nullif(trim(p_cancel_reason), ''),
    cancelled_by = p_actor_id, cancelled_at = now() where id = p_followup_id returning * into result;
  insert into public.facility_activity (company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'followup_cancel',
      coalesce(nullif(trim(p_cancel_reason), ''), 'تم إلغاء المتابعة'));
  return result;
end;
$$;

create or replace function public.reassign_followup_atomic(
  p_company_id uuid, p_followup_id uuid, p_actor_id uuid, p_assigned_to uuid
) returns public.followups language plpgsql security definer set search_path = '' as $$
declare current_row public.followups; result public.followups; old_name text; new_name text;
begin
  select * into current_row from public.followups
    where id = p_followup_id and company_id = p_company_id for update;
  if current_row.id is null or not public.followup_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id, true) then
    raise exception 'followup management access denied' using errcode = '42501';
  end if;
  if current_row.status <> 'pending' then raise exception 'followup is not pending' using errcode = '23514'; end if;
  if not exists (select 1 from public.profiles where id = p_assigned_to and company_id = p_company_id and status = 'active') then
    raise exception 'invalid followup owner' using errcode = '23514';
  end if;
  select display_name into old_name from public.profiles where id = current_row.assigned_to;
  select display_name into new_name from public.profiles where id = p_assigned_to;
  update public.followups set assigned_to = p_assigned_to where id = p_followup_id returning * into result;
  insert into public.facility_activity (company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'followup_reassign', old_name, new_name);
  return result;
end;
$$;

create or replace function public.cascade_facility_followup_owner()
returns trigger language plpgsql as $$
begin
  if old.assigned_to is distinct from new.assigned_to and new.assigned_to is not null then
    update public.followups set assigned_to = new.assigned_to
      where facility_id = new.id and status = 'pending' and assigned_to = old.assigned_to;
  end if;
  return new;
end;
$$;
create trigger trg_facility_owner_cascade after update of assigned_to on public.facilities
for each row execute function public.cascade_facility_followup_owner();

create or replace function public.reassign_facility_atomic(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_assigned_to uuid
) returns public.facilities language plpgsql security definer set search_path = '' as $$
declare current_row public.facilities; result public.facilities; affected integer;
begin
  select * into current_row from public.facilities
    where id = p_facility_id and company_id = p_company_id for update;
  if current_row.id is null or not public.followup_actor_can_manage(p_actor_id, p_company_id, p_facility_id, true) then
    raise exception 'facility management access denied' using errcode = '42501';
  end if;
  if p_assigned_to is not null and not exists (
    select 1 from public.profiles where id = p_assigned_to and company_id = p_company_id
      and role = 'sales_user' and status = 'active'
  ) then raise exception 'invalid facility owner' using errcode = '23514'; end if;
  select count(*) into affected from public.followups
    where facility_id = p_facility_id and status = 'pending' and assigned_to = current_row.assigned_to;
  update public.facilities set assigned_to = p_assigned_to
    where id = p_facility_id returning * into result;
  if p_assigned_to is null then
    update public.followups set assigned_to = p_actor_id
      where facility_id = p_facility_id and status = 'pending' and assigned_to = current_row.assigned_to;
  end if;
  insert into public.facility_activity (company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, p_facility_id, p_actor_id, 'owner_change',
      current_row.assigned_to::text, p_assigned_to::text);
  if affected > 0 then
    insert into public.facility_activity (company_id, facility_id, actor_id, event_type, old_value, new_value)
      values (p_company_id, p_facility_id, p_actor_id, 'followup_reassign',
        current_row.assigned_to::text, coalesce(p_assigned_to, p_actor_id)::text);
  end if;
  return result;
end;
$$;

create or replace function public.unlink_archived_contact_followups()
returns trigger language plpgsql as $$
begin
  if not old.is_archived and new.is_archived then
    update public.followups set contact_id = null where contact_id = new.id;
  end if;
  return new;
end;
$$;
create trigger trg_unlink_archived_contact_followups after update of is_archived on public.contacts
for each row execute function public.unlink_archived_contact_followups();

alter table public.followups enable row level security;
create policy followups_select on public.followups for select to authenticated using (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and exists (
    select 1 from public.facilities f where f.id = facility_id and f.company_id = company_id
      and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid())
  )
);
create policy followups_insert on public.followups for insert to authenticated with check (
  company_id = public.jwt_company_id()
  and exists (select 1 from public.facilities f where f.id = facility_id and f.company_id = company_id and f.is_active
    and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and assigned_to = auth.uid())))
);
create policy followups_update on public.followups for update to authenticated using (
  company_id = public.jwt_company_id()
  and exists (select 1 from public.facilities f where f.id = facility_id and f.company_id = company_id and f.is_active
    and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
) with check (
  company_id = public.jwt_company_id()
  and (public.jwt_role() <> 'sales_user' or assigned_to = auth.uid())
);

revoke delete on public.followups from public, anon, authenticated;
revoke execute on function public.create_followup_atomic(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.complete_followup_atomic(uuid, uuid, uuid, public.followup_outcome, text) from public, anon, authenticated;
revoke execute on function public.reschedule_followup_atomic(uuid, uuid, uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.cancel_followup_atomic(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.reassign_followup_atomic(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.reassign_facility_atomic(uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_followup_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.complete_followup_atomic(uuid, uuid, uuid, public.followup_outcome, text) to service_role;
grant execute on function public.reschedule_followup_atomic(uuid, uuid, uuid, timestamptz) to service_role;
grant execute on function public.cancel_followup_atomic(uuid, uuid, uuid, text) to service_role;
grant execute on function public.reassign_followup_atomic(uuid, uuid, uuid, uuid) to service_role;
grant execute on function public.reassign_facility_atomic(uuid, uuid, uuid, uuid) to service_role;
