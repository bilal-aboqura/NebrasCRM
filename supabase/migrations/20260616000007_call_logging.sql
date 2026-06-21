alter type public.facility_activity_type add value if not exists 'call_logged';
alter type public.facility_activity_type add value if not exists 'call_log_edited';
alter type public.facility_activity_type add value if not exists 'call_log_archived';
alter type public.facility_activity_type add value if not exists 'call_log_recovered';

create type public.communication_channel as enum ('call', 'whatsapp');
create type public.communication_direction as enum ('inbound', 'outbound');
create type public.communication_outcome as enum (
  'answered', 'no_answer', 'busy', 'wrong_number', 'callback_requested', 'not_reachable'
);

create table public.call_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  followup_id uuid references public.followups(id) on delete set null,
  created_by_id uuid not null references public.profiles(id),
  channel public.communication_channel not null,
  direction public.communication_direction not null,
  occurred_at timestamptz not null default now(),
  outcome public.communication_outcome not null,
  duration_seconds integer check (duration_seconds between 0 and 86400),
  notes text check (notes is null or length(notes) <= 5000),
  is_archived boolean not null default false,
  archived_at timestamptz,
  archived_by_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_edited_by_id uuid references public.profiles(id),
  last_edited_at timestamptz,
  version integer not null default 1 check (version > 0),
  constraint call_logs_facility_company_fk foreign key (facility_id, company_id)
    references public.facilities(id, company_id),
  constraint call_logs_archive_state check (
    (is_archived and archived_at is not null and archived_by_id is not null)
    or (not is_archived and archived_at is null and archived_by_id is null)
  )
);

create index idx_call_logs_company_id on public.call_logs(company_id);
create index idx_call_logs_facility_id on public.call_logs(facility_id);
create index idx_call_logs_occurred_at on public.call_logs(occurred_at desc);
create index idx_call_logs_facility_active_occurred on public.call_logs(facility_id, occurred_at desc) where not is_archived;

create or replace function public.call_log_actor_can_manage(
  p_actor_id uuid, p_company_id uuid, p_facility_id uuid, p_management_only boolean default false
) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.facilities f on f.id = p_facility_id and f.company_id = p_company_id
    where p.id = p_actor_id and p.status = 'active' and f.is_active
      and (p.role = 'super_admin' or p.company_id = p_company_id)
      and (p.role <> 'sales_user' or (not p_management_only and f.assigned_to = p_actor_id))
  )
$$;

create or replace function public.validate_call_log()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.occurred_at > now() + interval '1 minute' then
    raise exception 'call log occurred_at cannot be in the future' using errcode = '23514';
  end if;
  if new.contact_id is not null and not exists (
    select 1 from public.contacts c where c.id = new.contact_id and c.facility_id = new.facility_id
      and c.company_id = new.company_id and not c.is_archived
  ) then raise exception 'contact does not belong to facility' using errcode = '23503'; end if;
  if new.followup_id is not null and not exists (
    select 1 from public.followups f where f.id = new.followup_id and f.facility_id = new.facility_id
      and f.company_id = new.company_id
  ) then raise exception 'followup does not belong to facility' using errcode = '23503'; end if;
  new.notes := nullif(trim(new.notes), '');
  new.updated_at := now();
  return new;
end;
$$;
create trigger trg_validate_call_log before insert or update on public.call_logs
for each row execute function public.validate_call_log();

create or replace function public.check_call_log_edit_window()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor_role public.app_role;
begin
  if old.company_id is distinct from new.company_id or old.facility_id is distinct from new.facility_id
    or old.contact_id is distinct from new.contact_id or old.followup_id is distinct from new.followup_id
    or old.created_by_id is distinct from new.created_by_id or old.channel is distinct from new.channel
    or old.direction is distinct from new.direction or old.occurred_at is distinct from new.occurred_at
    or old.created_at is distinct from new.created_at then
    raise exception 'immutable call log fields cannot be edited' using errcode = '23514';
  end if;
  select role into actor_role from public.profiles where id = coalesce(new.last_edited_by_id, new.archived_by_id);
  if actor_role = 'sales_user' then
    if old.created_by_id <> new.last_edited_by_id then raise exception 'call log access denied' using errcode = '42501'; end if;
    if old.created_at < now() - interval '24 hours' then raise exception 'call log edit locked after 24 hours' using errcode = '23514'; end if;
    if old.is_archived is distinct from new.is_archived then raise exception 'call log archive access denied' using errcode = '42501'; end if;
  end if;
  return new;
end;
$$;
create trigger trg_check_call_log_edit_window before update on public.call_logs
for each row execute function public.check_call_log_edit_window();

create or replace function public.create_call_log_atomic(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_input jsonb
) returns public.call_logs language plpgsql security definer set search_path = '' as $$
declare result public.call_logs; linked_followup public.followups;
begin
  if not public.call_log_actor_can_manage(p_actor_id, p_company_id, p_facility_id) then
    raise exception 'call log access denied' using errcode = '42501';
  end if;
  if nullif(p_input->>'followup_id', '') is not null then
    select * into linked_followup from public.followups where id = (p_input->>'followup_id')::uuid
      and company_id = p_company_id and facility_id = p_facility_id for update;
    if linked_followup.id is null then raise exception 'followup does not belong to facility' using errcode = '23503'; end if;
    if coalesce((p_input->>'complete_followup')::boolean, false) and linked_followup.status <> 'pending' then
      raise exception 'followup is not pending' using errcode = '23514';
    end if;
  end if;
  insert into public.call_logs (
    company_id, facility_id, contact_id, followup_id, created_by_id, channel, direction,
    occurred_at, outcome, duration_seconds, notes
  ) values (
    p_company_id, p_facility_id, nullif(p_input->>'contact_id', '')::uuid,
    nullif(p_input->>'followup_id', '')::uuid, p_actor_id,
    (p_input->>'channel')::public.communication_channel,
    (p_input->>'direction')::public.communication_direction,
    coalesce((p_input->>'occurred_at')::timestamptz, now()),
    (p_input->>'outcome')::public.communication_outcome,
    nullif(p_input->>'duration_seconds', '')::integer, nullif(trim(p_input->>'notes'), '')
  ) returning * into result;
  if linked_followup.id is not null and coalesce((p_input->>'complete_followup')::boolean, false) then
    update public.followups set status = 'done', completed_by = p_actor_id, completed_at = now(),
      outcome = case result.outcome
        when 'answered' then 'answered'::public.followup_outcome
        when 'no_answer' then 'no_answer'::public.followup_outcome
        when 'callback_requested' then 'callback_requested'::public.followup_outcome
        else null end,
      outcome_note = coalesce(result.notes, 'تم إتمام المتابعة من سجل الاتصال')
      where id = linked_followup.id;
    insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
      values (p_company_id, p_facility_id, p_actor_id, 'followup_complete', 'تم إتمام المتابعة المرتبطة بسجل الاتصال');
  end if;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, p_facility_id, p_actor_id, 'call_logged',
      'تم تسجيل اتصال ' || case result.direction when 'outbound' then 'صادر' else 'وارد' end ||
      ' (' || case result.outcome when 'answered' then 'تم الرد' when 'no_answer' then 'لم يرد'
        when 'busy' then 'مشغول' when 'wrong_number' then 'رقم خاطئ'
        when 'callback_requested' then 'طلب إعادة اتصال' else 'غير متاح' end || ')');
  return result;
end;
$$;

create or replace function public.update_call_log_atomic(
  p_company_id uuid, p_call_log_id uuid, p_actor_id uuid, p_expected_version integer, p_input jsonb
) returns public.call_logs language plpgsql security definer set search_path = '' as $$
declare current_row public.call_logs; result public.call_logs;
begin
  select * into current_row from public.call_logs where id = p_call_log_id and company_id = p_company_id for update;
  if current_row.id is null or not public.call_log_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id) then
    raise exception 'call log access denied' using errcode = '42501';
  end if;
  if current_row.version <> p_expected_version then raise exception 'concurrent update' using errcode = '40001'; end if;
  update public.call_logs set outcome = (p_input->>'outcome')::public.communication_outcome,
    duration_seconds = nullif(p_input->>'duration_seconds', '')::integer,
    notes = nullif(trim(p_input->>'notes'), ''), last_edited_by_id = p_actor_id,
    last_edited_at = now(), version = version + 1 where id = p_call_log_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'call_log_edited', 'تم تعديل سجل الاتصال');
  return result;
end;
$$;

create or replace function public.complete_followup_with_call_log_atomic(
  p_company_id uuid, p_followup_id uuid, p_actor_id uuid,
  p_followup_outcome public.followup_outcome, p_outcome_note text, p_call_input jsonb
) returns public.followups language plpgsql security definer set search_path = '' as $$
declare current_row public.followups;
begin
  select * into current_row from public.followups where id = p_followup_id and company_id = p_company_id for update;
  if current_row.id is null or current_row.status <> 'pending' then
    raise exception 'followup is not pending' using errcode = '23514';
  end if;
  if not public.followup_outcome_matches_type(current_row.type, p_followup_outcome) then
    raise exception 'outcome does not match followup type' using errcode = '23514';
  end if;
  perform public.create_call_log_atomic(
    p_company_id, current_row.facility_id, p_actor_id,
    p_call_input || jsonb_build_object('contact_id', current_row.contact_id, 'followup_id', current_row.id, 'complete_followup', true, 'occurred_at', now())
  );
  update public.followups set outcome = p_followup_outcome,
    outcome_note = coalesce(nullif(trim(p_outcome_note), ''), outcome_note)
    where id = p_followup_id returning * into current_row;
  return current_row;
end;
$$;

create or replace function public.archive_call_log_atomic(
  p_company_id uuid, p_call_log_id uuid, p_actor_id uuid
) returns public.call_logs language plpgsql security definer set search_path = '' as $$
declare current_row public.call_logs; result public.call_logs;
begin
  select * into current_row from public.call_logs where id = p_call_log_id and company_id = p_company_id for update;
  if current_row.id is null or not public.call_log_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id, true) then
    raise exception 'call log access denied' using errcode = '42501';
  end if;
  update public.call_logs set is_archived = true, archived_at = now(), archived_by_id = p_actor_id,
    last_edited_by_id = p_actor_id, last_edited_at = now(), version = version + 1
    where id = p_call_log_id and not is_archived returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, current_row.facility_id, p_actor_id, 'call_log_archived', 'تمت أرشفة سجل الاتصال');
  return coalesce(result, current_row);
end;
$$;

create or replace function public.recover_call_log_atomic(
  p_company_id uuid, p_call_log_id uuid, p_actor_id uuid
) returns public.call_logs language plpgsql security definer set search_path = '' as $$
declare current_row public.call_logs; result public.call_logs;
begin
  select * into current_row from public.call_logs where id = p_call_log_id and company_id = p_company_id for update;
  if current_row.id is null or not public.call_log_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id, true) then
    raise exception 'call log access denied' using errcode = '42501';
  end if;
  update public.call_logs set is_archived = false, archived_at = null, archived_by_id = null,
    last_edited_by_id = p_actor_id, last_edited_at = now(), version = version + 1
    where id = p_call_log_id and is_archived returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, current_row.facility_id, p_actor_id, 'call_log_recovered', 'تمت استعادة سجل الاتصال');
  return coalesce(result, current_row);
end;
$$;

alter table public.call_logs enable row level security;
create policy call_logs_select on public.call_logs for select to authenticated using (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  ) and exists (select 1 from public.facilities f where f.id = call_logs.facility_id
    and f.company_id = call_logs.company_id and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);
create policy call_logs_insert on public.call_logs for insert to authenticated with check (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  ) and created_by_id = auth.uid() and exists (select 1 from public.facilities f where f.id = call_logs.facility_id
    and f.company_id = call_logs.company_id and f.is_active and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);
create policy call_logs_update on public.call_logs for update to authenticated using (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  ) and exists (select 1 from public.facilities f where f.id = call_logs.facility_id
    and f.company_id = call_logs.company_id and f.is_active and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and call_logs.created_by_id = auth.uid())))
);

revoke delete on public.call_logs from public, anon, authenticated;
revoke execute on function public.call_log_actor_can_manage(uuid, uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.create_call_log_atomic(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.update_call_log_atomic(uuid, uuid, uuid, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.archive_call_log_atomic(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.recover_call_log_atomic(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.complete_followup_with_call_log_atomic(uuid, uuid, uuid, public.followup_outcome, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_call_log_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.update_call_log_atomic(uuid, uuid, uuid, integer, jsonb) to service_role;
grant execute on function public.archive_call_log_atomic(uuid, uuid, uuid) to service_role;
grant execute on function public.recover_call_log_atomic(uuid, uuid, uuid) to service_role;
grant execute on function public.complete_followup_with_call_log_atomic(uuid, uuid, uuid, public.followup_outcome, text, jsonb) to service_role;
