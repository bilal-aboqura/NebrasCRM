-- ============================================================================
-- Restore Missing Functions and Triggers
-- ============================================================================
-- Purpose: Re-creates all stored functions, triggers, and associated
--          EXECUTE grants/revokes that were defined across migrations
--          20260616000002 .. 20260617000009. This file is safe to run against a
--          database that already has all tables/types/policies but is missing
--          the functions and triggers (e.g. after a partial restore).
--
--          Each trigger is guarded with a preceding DROP TRIGGER IF EXISTS so
--          the script is idempotent. Only functions, triggers, and EXECUTE
--          grants/revokes are included here - no CREATE TABLE, CREATE INDEX,
--          CREATE TYPE, ALTER TABLE, CREATE POLICY, or ALTER TYPE statements.
-- ============================================================================

-- Ensure prerequisite enum types exist (idempotent)
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'app_role') then
    create type public.app_role as enum ('super_admin', 'company_admin', 'supervisor', 'sales_user');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'audit_event') then
    create type public.audit_event as enum ('login', 'logout', 'failed_login', 'company_switch',
      'company_create', 'company_update', 'user_invite', 'profile_update', 'unauthorized_admin_attempt');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'audit_outcome') then
    create type public.audit_outcome as enum ('success', 'failure', 'throttled');
  end if;
end $$;


-- ===========================================================================
-- From 20260616000002_user_company_admin.sql
-- ===========================================================================

create or replace function public.sync_admin_fields()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_table_name = 'companies' then
    new.name_ar := coalesce(new.name_ar, new.name);
    new.name := new.name_ar;
    new.active := new.status = 'active';
  else
    new.display_name := coalesce(new.display_name, new.full_name);
    new.full_name := new.display_name;
    new.active := new.status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists sync_company_admin_fields on public.companies;
create trigger sync_company_admin_fields before insert or update on public.companies
for each row execute function public.sync_admin_fields();

drop trigger if exists sync_profile_admin_fields on public.profiles;
create trigger sync_profile_admin_fields before insert or update on public.profiles
for each row execute function public.sync_admin_fields();

create or replace function public.prevent_last_super_admin_lockout()
returns trigger language plpgsql security definer set search_path = '' as $$
declare active_count integer;
begin
  if old.role = 'super_admin' and old.status = 'active'
     and (new.role <> 'super_admin' or new.status <> 'active') then
    perform id from public.profiles where role = 'super_admin' and status = 'active' for update;
    select count(*) into active_count from public.profiles
      where role = 'super_admin' and status = 'active' and id <> old.id;
    if active_count = 0 then
      raise exception 'يجب أن يكون هناك مشرف عام نشط واحد على الأقل في النظام' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_super_admin_lockout on public.profiles;
create trigger prevent_super_admin_lockout before update of status, role on public.profiles
for each row execute function public.prevent_last_super_admin_lockout();

create or replace function public.enforce_profile_update_boundary()
returns trigger language plpgsql security definer set search_path = '' as $$
declare caller_role text := coalesce(auth.jwt() ->> 'user_role', auth.jwt() -> 'user_metadata' ->> 'role');
declare caller_company uuid := nullif(coalesce(auth.jwt() ->> 'company_id', auth.jwt() -> 'user_metadata' ->> 'company_id'), '')::uuid;
begin
  if auth.role() = 'service_role' then return new; end if;
  if auth.uid() = old.id and caller_role not in ('super_admin', 'company_admin') then
    if new.company_id is distinct from old.company_id or new.role is distinct from old.role
       or new.status is distinct from old.status or new.email is distinct from old.email then
      raise exception 'profile privilege fields cannot be changed' using errcode = '42501';
    end if;
  elsif caller_role = 'company_admin' then
    if old.company_id is distinct from caller_company or new.company_id is distinct from old.company_id
       or new.role = 'super_admin' or old.role = 'super_admin' then
      raise exception 'cross-tenant or privileged profile update denied' using errcode = '42501';
    end if;
  elsif caller_role <> 'super_admin' then
    raise exception 'profile update denied' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_update on public.profiles;
create trigger enforce_profile_update before update on public.profiles
for each row execute function public.enforce_profile_update_boundary();

create or replace function public.audit_admin_resource_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_data jsonb := to_jsonb(old) - array['created_at','updated_at'];
declare new_data jsonb := to_jsonb(new) - array['created_at','updated_at'];
declare key text;
declare diff jsonb := '{}'::jsonb;
declare tenant_id uuid;
begin
  for key in select jsonb_object_keys(new_data) loop
    if old_data -> key is distinct from new_data -> key then
      diff := diff || jsonb_build_object(key, jsonb_build_object('old', old_data -> key, 'new', new_data -> key));
    end if;
  end loop;
  if diff <> '{}'::jsonb then
    if tg_table_name = 'companies' then
      tenant_id := new.id;
    else
      tenant_id := new.company_id;
    end if;
    insert into public.audit_logs (actor_user_id, actor_company_id, event_type, target_company_id, outcome, details)
    values (
      auth.uid(),
      nullif(coalesce(auth.jwt() ->> 'company_id', auth.jwt() -> 'user_metadata' ->> 'company_id'), '')::uuid,
      case when tg_table_name = 'companies' then 'company_update'::public.audit_event else 'profile_update'::public.audit_event end,
      tenant_id, 'success', diff
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_company_changes on public.companies;
create trigger audit_company_changes after update on public.companies
for each row execute function public.audit_admin_resource_change();

drop trigger if exists audit_profile_changes on public.profiles;
create trigger audit_profile_changes after update on public.profiles
for each row execute function public.audit_admin_resource_change();

create or replace function public.revoke_user_sessions(target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service role required' using errcode = '42501'; end if;
  delete from auth.refresh_tokens where user_id = target_user_id::text;
  delete from auth.sessions where user_id = target_user_id;
end;
$$;

revoke execute on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;


-- ===========================================================================
-- From 20260616000003_facility_management.sql
-- ===========================================================================

create or replace function public.normalize_saudi_phone(value text)
returns text language plpgsql immutable strict as $$
declare digits text := regexp_replace(value, '[^0-9]', '', 'g');
begin
  if digits like '00%' then digits := substr(digits, 3); end if;
  if digits like '966%' then return digits; end if;
  digits := regexp_replace(digits, '^0+', '');
  if digits = '' then return ''; end if;
  return '966' || digits;
end;
$$;

create or replace function public.prepare_facility()
returns trigger language plpgsql as $$
declare city_region uuid;
declare city_name text;
declare owner_company uuid;
declare owner_role public.app_role;
declare owner_status text;
begin
  new.name_ar := trim(new.name_ar);
  new.primary_phone_normalized := public.normalize_saudi_phone(new.primary_phone);
  if new.primary_phone_normalized = '' then
    raise exception 'invalid phone' using errcode = '23514';
  end if;
  select region_id, name_en into city_region, city_name from public.cities where id = new.city_id;
  if city_region is distinct from new.region_id then
    raise exception 'city does not belong to region' using errcode = '23514';
  end if;
  if city_name = 'Other' and nullif(trim(new.city_custom), '') is null then
    raise exception 'custom city is required' using errcode = '23514';
  end if;
  if new.assigned_to is not null then
    select company_id, role, status into owner_company, owner_role, owner_status from public.profiles where id = new.assigned_to;
    if owner_company is distinct from new.company_id or owner_role <> 'sales_user' or owner_status <> 'active' then
      raise exception 'invalid facility owner' using errcode = '23514';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists prepare_facility on public.facilities;
create trigger prepare_facility before insert or update on public.facilities
for each row execute function public.prepare_facility();


-- ===========================================================================
-- From 20260616000004_contact_management.sql
-- ===========================================================================

-- Ensure primary contact activity enum values exist (used by update_contact_atomic
-- and archive_contact_atomic). These were missing from the original enum definition.
do $$ begin
  alter type public.facility_activity_type add value if not exists 'primary_changed';
  alter type public.facility_activity_type add value if not exists 'primary_cleared';
end $$;

create or replace function public.prepare_contact()
returns trigger language plpgsql as $$
begin
  new.name_ar := trim(new.name_ar);
  new.job_title := trim(new.job_title);
  new.primary_phone_normalized := public.normalize_saudi_phone(new.primary_phone);
  new.secondary_phone := nullif(trim(new.secondary_phone), '');
  new.email := nullif(lower(trim(new.email)), '');
  new.notes := nullif(trim(new.notes), '');
  if new.primary_phone_normalized !~ '^966(5[0-9]{8}|1[1-7][0-9]{7})$' then
    raise exception 'invalid Saudi phone' using errcode = '23514';
  end if;
  if new.is_archived then new.is_primary := false; end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists prepare_contact on public.contacts;
create trigger prepare_contact before insert or update on public.contacts
for each row execute function public.prepare_contact();

create or replace function public.contact_actor_can_manage(
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

create or replace function public.create_contact_atomic(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_input jsonb
) returns public.contacts language plpgsql security definer set search_path = '' as $$
declare result public.contacts;
begin
  if not public.contact_actor_can_manage(p_actor_id, p_company_id, p_facility_id) then
    raise exception 'contact access denied' using errcode = '42501';
  end if;
  if coalesce((p_input->>'is_primary')::boolean, false) then
    update public.contacts set is_primary = false
      where facility_id = p_facility_id and company_id = p_company_id and is_primary;
  end if;
  insert into public.contacts (
    company_id, facility_id, name_ar, job_title, primary_phone, secondary_phone,
    email, is_primary, notes, created_by
  ) values (
    p_company_id, p_facility_id, p_input->>'name_ar', p_input->>'job_title',
    p_input->>'primary_phone', p_input->>'secondary_phone', p_input->>'email',
    coalesce((p_input->>'is_primary')::boolean, false), p_input->>'notes', p_actor_id
  ) returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, p_facility_id, p_actor_id, 'contact_added', result.name_ar || ' - ' || result.job_title);
  return result;
end;
$$;

create or replace function public.update_contact_atomic(
  p_company_id uuid, p_contact_id uuid, p_actor_id uuid, p_input jsonb
) returns public.contacts language plpgsql security definer set search_path = '' as $$
declare current_contact public.contacts; result public.contacts; old_primary text;
begin
  select * into current_contact from public.contacts
    where id = p_contact_id and company_id = p_company_id and not is_archived for update;
  if current_contact.id is null or not public.contact_actor_can_manage(p_actor_id, p_company_id, current_contact.facility_id) then
    raise exception 'contact access denied' using errcode = '42501';
  end if;
  if coalesce((p_input->>'is_primary')::boolean, current_contact.is_primary)
     and not current_contact.is_primary then
    select name_ar into old_primary from public.contacts
      where facility_id = current_contact.facility_id and is_primary and not is_archived for update;
    update public.contacts set is_primary = false
      where facility_id = current_contact.facility_id and company_id = p_company_id and is_primary;
  end if;
  update public.contacts set
    name_ar = coalesce(p_input->>'name_ar', name_ar),
    job_title = coalesce(p_input->>'job_title', job_title),
    primary_phone = coalesce(p_input->>'primary_phone', primary_phone),
    secondary_phone = case when p_input ? 'secondary_phone' then p_input->>'secondary_phone' else secondary_phone end,
    email = case when p_input ? 'email' then p_input->>'email' else email end,
    is_primary = coalesce((p_input->>'is_primary')::boolean, is_primary),
    notes = case when p_input ? 'notes' then p_input->>'notes' else notes end
  where id = p_contact_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contact_edited',
      jsonb_build_object('name_ar', current_contact.name_ar, 'job_title', current_contact.job_title,
        'primary_phone', current_contact.primary_phone, 'secondary_phone', current_contact.secondary_phone,
        'email', current_contact.email, 'notes', current_contact.notes)::text,
      jsonb_build_object('name_ar', result.name_ar, 'job_title', result.job_title,
        'primary_phone', result.primary_phone, 'secondary_phone', result.secondary_phone,
        'email', result.email, 'notes', result.notes)::text);
  if result.is_primary and not current_contact.is_primary then
    insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
      values (p_company_id, result.facility_id, p_actor_id, 'primary_changed', old_primary, result.name_ar);
  end if;
  return result;
end;
$$;

create or replace function public.archive_contact_atomic(
  p_company_id uuid, p_contact_id uuid, p_actor_id uuid
) returns public.contacts language plpgsql security definer set search_path = '' as $$
declare current_contact public.contacts; result public.contacts;
begin
  select * into current_contact from public.contacts
    where id = p_contact_id and company_id = p_company_id and not is_archived for update;
  if current_contact.id is null or not public.contact_actor_can_manage(p_actor_id, p_company_id, current_contact.facility_id) then
    raise exception 'contact access denied' using errcode = '42501';
  end if;
  update public.contacts set is_archived = true, is_primary = false,
    archived_at = now(), archived_by = p_actor_id where id = p_contact_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contact_archived', result.name_ar, 'مؤرشف');
  if current_contact.is_primary then
    insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
      values (p_company_id, result.facility_id, p_actor_id, 'primary_cleared', result.name_ar, null);
  end if;
  return result;
end;
$$;

create or replace function public.recover_contact_atomic(
  p_company_id uuid, p_contact_id uuid, p_actor_id uuid
) returns public.contacts language plpgsql security definer set search_path = '' as $$
declare current_contact public.contacts; result public.contacts;
begin
  select * into current_contact from public.contacts
    where id = p_contact_id and company_id = p_company_id and is_archived for update;
  if current_contact.id is null or not public.contact_actor_can_manage(p_actor_id, p_company_id, current_contact.facility_id, true) then
    raise exception 'contact recovery denied' using errcode = '42501';
  end if;
  update public.contacts set is_archived = false, is_primary = false,
    archived_at = null, archived_by = null where id = p_contact_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contact_recovered', 'مؤرشف', result.name_ar);
  return result;
end;
$$;

revoke execute on function public.contact_actor_can_manage(uuid, uuid, uuid, boolean) from public, authenticated, anon;
revoke execute on function public.create_contact_atomic(uuid, uuid, uuid, jsonb) from public, authenticated, anon;
revoke execute on function public.update_contact_atomic(uuid, uuid, uuid, jsonb) from public, authenticated, anon;
revoke execute on function public.archive_contact_atomic(uuid, uuid, uuid) from public, authenticated, anon;
revoke execute on function public.recover_contact_atomic(uuid, uuid, uuid) from public, authenticated, anon;
grant execute on function public.create_contact_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.update_contact_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.archive_contact_atomic(uuid, uuid, uuid) to service_role;
grant execute on function public.recover_contact_atomic(uuid, uuid, uuid) to service_role;


-- ===========================================================================
-- From 20260616000005_pipeline_lost_reason.sql
-- ===========================================================================

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

drop trigger if exists set_facility_status_changed_at on public.facilities;
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


-- ===========================================================================
-- From 20260616000006_followup_management.sql
-- ===========================================================================

create or replace function public.touch_followup_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_followups_updated_at on public.followups;
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

drop trigger if exists trg_facility_owner_cascade on public.facilities;
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

drop trigger if exists trg_unlink_archived_contact_followups on public.contacts;
create trigger trg_unlink_archived_contact_followups after update of is_archived on public.contacts
for each row execute function public.unlink_archived_contact_followups();

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


-- ===========================================================================
-- From 20260616000007_call_logging.sql
-- ===========================================================================

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

drop trigger if exists trg_validate_call_log on public.call_logs;
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

drop trigger if exists trg_check_call_log_edit_window on public.call_logs;
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


-- ===========================================================================
-- From 20260617000008_offer_management.sql
-- ===========================================================================

-- Ensure canonical columns exist (live DB may have 'discount'/'tax' instead).
-- These are added idempotently so re-running this script is safe.
do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'offers'
                 and column_name = 'discount_amount') then
    alter table public.offers add column discount_amount numeric(15,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'offers'
                 and column_name = 'tax_amount') then
    alter table public.offers add column tax_amount numeric(15,2) not null default 0;
  end if;
end $$;

-- Sync owner_id <-> created_by on INSERT (live DB has both columns)
create or replace function public.sync_offer_owner_fields()
returns trigger language plpgsql as $$
begin
  if new.owner_id is null and new.created_by is not null then
    new.owner_id := new.created_by;
  end if;
  if new.created_by is null and new.owner_id is not null then
    new.created_by := new.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_offer_owner_fields on public.offers;
create trigger trg_sync_offer_owner_fields
  before insert on public.offers
  for each row execute function public.sync_offer_owner_fields();

create or replace function public.calculate_offer_totals()
returns trigger language plpgsql as $$
begin
  new.title         := trim(new.title);
  new.notes         := nullif(trim(new.notes), '');
  new.decision_note := nullif(trim(new.decision_note), '');
  if new.discount_type = 'percentage' then
    if new.discount_value > 100 then
      raise exception 'percentage discount cannot exceed 100' using errcode = '23514';
    end if;
    new.discount_amount := round(new.subtotal * new.discount_value / 100, 2);
  else
    new.discount_amount := round(new.discount_value, 2);
  end if;
  if new.discount_amount > new.subtotal then
    raise exception 'discount cannot exceed subtotal' using errcode = '23514';
  end if;
  -- Keep legacy column names in sync (live DB has 'discount'/'tax'/'total')
  new.discount    := new.discount_amount;
  new.tax_amount  := round((new.subtotal - new.discount_amount) * new.tax_rate / 100, 2);
  new.tax         := new.tax_amount;
  new.grand_total := round(new.subtotal - new.discount_amount + new.tax_amount, 2);
  new.total       := new.grand_total;
  new.updated_at  := now();
  return new;
end;
$$;

create or replace function public.validate_offer_and_immutability()
returns trigger language plpgsql as $$
begin
  if new.contact_id is not null and not exists (
    select 1 from public.contacts c
    where c.id = new.contact_id and c.facility_id = new.facility_id
      and c.company_id = new.company_id and not c.is_archived
  ) then
    raise exception 'contact does not belong to facility' using errcode = '23503';
  end if;
  if new.parent_offer_id is not null and not exists (
    select 1 from public.offers p where p.id = new.parent_offer_id
      and p.company_id = new.company_id and p.facility_id = new.facility_id
  ) then
    raise exception 'parent offer does not belong to facility' using errcode = '23503';
  end if;
  if tg_op = 'UPDATE' and old.status in ('sent', 'accepted', 'rejected') and (
    old.title is distinct from new.title or old.facility_id is distinct from new.facility_id or
    old.contact_id is distinct from new.contact_id or old.subtotal is distinct from new.subtotal or
    old.discount_type is distinct from new.discount_type or old.discount_value is distinct from new.discount_value or
    old.tax_rate is distinct from new.tax_rate or old.valid_until is distinct from new.valid_until or
    old.parent_offer_id is distinct from new.parent_offer_id or old.root_offer_id is distinct from new.root_offer_id or
    old.version is distinct from new.version or old.notes is distinct from new.notes
  ) then
    raise exception 'sent offers are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_offer_and_immutability on public.offers;
create trigger trg_validate_offer_and_immutability before insert or update on public.offers
for each row execute function public.validate_offer_and_immutability();

drop trigger if exists trg_calculate_offer_totals on public.offers;
create trigger trg_calculate_offer_totals before insert or update on public.offers
for each row execute function public.calculate_offer_totals();

create or replace function public.guard_offer_line_item_mutation()
returns trigger language plpgsql as $$
declare target_offer uuid := coalesce(new.offer_id, old.offer_id);
begin
  if exists (select 1 from public.offers where id = target_offer and status <> 'draft') then
    raise exception 'sent offer line items are immutable' using errcode = '23514';
  end if;
  if tg_op <> 'DELETE' then new.description := trim(new.description); return new; end if;
  return old;
end;
$$;

drop trigger if exists trg_guard_offer_line_items on public.offer_line_items;
create trigger trg_guard_offer_line_items before insert or update or delete on public.offer_line_items
for each row execute function public.guard_offer_line_item_mutation();

create or replace function public.update_offer_subtotal_on_line_item_change()
returns trigger language plpgsql as $$
declare target_offer uuid := coalesce(new.offer_id, old.offer_id);
begin
  update public.offers set subtotal = coalesce((
    select sum(amount) from public.offer_line_items where offer_id = target_offer
  ), 0) where id = target_offer;
  return null;
end;
$$;

drop trigger if exists trg_update_offer_subtotal on public.offer_line_items;
create trigger trg_update_offer_subtotal after insert or update or delete on public.offer_line_items
for each row execute function public.update_offer_subtotal_on_line_item_change();

create or replace function public.offer_actor_can_manage(
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

create or replace function public.insert_offer_line_items(p_offer_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'at least one line item is required' using errcode = '23514';
  end if;
  insert into public.offer_line_items(offer_id, description, amount, ordering)
  select p_offer_id, item->>'description', (item->>'amount')::numeric,
    coalesce((item->>'ordering')::integer, ordinality::integer - 1)
  from jsonb_array_elements(p_items) with ordinality as rows(item, ordinality);
end;
$$;

create or replace function public.create_offer_atomic(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_input jsonb
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare result public.offers;
begin
  if not public.offer_actor_can_manage(p_actor_id, p_company_id, p_facility_id) then
    raise exception 'offer access denied' using errcode = '42501';
  end if;
  insert into public.offers(company_id, facility_id, contact_id, created_by, title,
    discount_type, discount_value, tax_rate, valid_until, notes)
  values (p_company_id, p_facility_id, nullif(p_input->>'contact_id', '')::uuid, p_actor_id,
    p_input->>'title', 'fixed', 0, coalesce((p_input->>'tax_rate')::numeric, 15),
    (p_input->>'valid_until')::date, p_input->>'notes') returning * into result;
  perform public.insert_offer_line_items(result.id, p_input->'line_items');
  update public.offers set discount_type = (p_input->>'discount_type')::public.discount_type,
    discount_value = (p_input->>'discount_value')::numeric,
    tax_rate = coalesce((p_input->>'tax_rate')::numeric, 15)
  where id = result.id;
  select * into result from public.offers where id = result.id;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, p_facility_id, p_actor_id, 'offer_created',
    result.title || ' | ' || result.grand_total || ' SAR');
  return result;
end;
$$;

create or replace function public.update_offer_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid, p_input jsonb
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare current_row public.offers; result public.offers;
begin
  select * into current_row from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if current_row.id is null or current_row.status <> 'draft' or
     not public.offer_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id) then
    raise exception 'draft offer access denied' using errcode = '42501';
  end if;
  update public.offers set contact_id = nullif(p_input->>'contact_id', '')::uuid,
    title = p_input->>'title', discount_type = 'fixed', discount_value = 0,
    tax_rate = coalesce((p_input->>'tax_rate')::numeric, 15),
    valid_until = (p_input->>'valid_until')::date, notes = p_input->>'notes'
  where id = p_offer_id returning * into result;
  delete from public.offer_line_items where offer_id = p_offer_id;
  perform public.insert_offer_line_items(p_offer_id, p_input->'line_items');
  update public.offers set discount_type = (p_input->>'discount_type')::public.discount_type,
    discount_value = (p_input->>'discount_value')::numeric,
    tax_rate = coalesce((p_input->>'tax_rate')::numeric, 15)
  where id = p_offer_id;
  select * into result from public.offers where id = p_offer_id;
  return result;
end;
$$;

create or replace function public.send_offer_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare result public.offers;
begin
  select * into result from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if result.id is null or result.status <> 'draft' or result.subtotal <= 0 or
     not public.offer_actor_can_manage(p_actor_id, p_company_id, result.facility_id) then
    raise exception 'offer cannot be sent' using errcode = '42501';
  end if;
  update public.offers set status = 'sent', sent_at = now() where id = p_offer_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, result.facility_id, p_actor_id, 'offer_sent', result.title || ' | ' || result.grand_total || ' SAR');
  return result;
end;
$$;

create or replace function public.revise_offer_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare parent_row public.offers; result public.offers; root_id uuid; next_version integer;
begin
  select * into parent_row from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if parent_row.id is null or parent_row.status not in ('sent', 'rejected') or
     not public.offer_actor_can_manage(p_actor_id, p_company_id, parent_row.facility_id) then
    raise exception 'offer cannot be revised' using errcode = '42501';
  end if;
  root_id := coalesce(parent_row.root_offer_id, parent_row.id);
  perform pg_advisory_xact_lock(hashtextextended(root_id::text, 0));
  select coalesce(max(version), 0) + 1 into next_version from public.offers
    where company_id = p_company_id and (id = root_id or root_offer_id = root_id);
  insert into public.offers(company_id, facility_id, contact_id, created_by, root_offer_id,
    parent_offer_id, title, discount_type, discount_value, tax_rate, valid_until, version, notes)
  values (p_company_id, parent_row.facility_id, parent_row.contact_id, p_actor_id, root_id,
    parent_row.id, parent_row.title, 'fixed', 0,
    parent_row.tax_rate, parent_row.valid_until, next_version, parent_row.notes) returning * into result;
  insert into public.offer_line_items(offer_id, description, amount, ordering)
    select result.id, description, amount, ordering from public.offer_line_items where offer_id = parent_row.id;
  update public.offers set discount_type = parent_row.discount_type, discount_value = parent_row.discount_value
    where id = result.id;
  update public.offers set is_superseded = true where id = parent_row.id;
  select * into result from public.offers where id = result.id;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, result.facility_id, p_actor_id, 'offer_revised', result.title || ' | v' || result.version);
  return result;
end;
$$;

create or replace function public.decide_offer_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid, p_decision public.offer_status, p_note text default null
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare result public.offers; was_expired boolean;
begin
  if p_decision not in ('accepted', 'rejected') then raise exception 'invalid offer decision' using errcode = '23514'; end if;
  select * into result from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if result.id is null or result.status <> 'sent' or
     not public.offer_actor_can_manage(p_actor_id, p_company_id, result.facility_id) then
    raise exception 'offer decision access denied' using errcode = '42501';
  end if;
  was_expired := result.valid_until < (now() at time zone 'Asia/Riyadh')::date;
  update public.offers set status = p_decision, decision_at = now(), decision_note = nullif(trim(p_note), '')
    where id = p_offer_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, result.facility_id, p_actor_id,
    case when p_decision = 'accepted' then 'offer_accepted'::public.facility_activity_type else 'offer_rejected'::public.facility_activity_type end,
    result.title || ' | ' || result.grand_total || ' SAR' || case when was_expired then ' | expired' else '' end ||
      coalesce(' | ' || nullif(trim(p_note), ''), ''));
  return result;
end;
$$;

create or replace function public.set_offer_chain_active_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid, p_active boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare target public.offers; root_id uuid;
begin
  select * into target from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if target.id is null or not public.offer_actor_can_manage(p_actor_id, p_company_id, target.facility_id, p_active) then
    raise exception 'offer archive access denied' using errcode = '42501';
  end if;
  root_id := coalesce(target.root_offer_id, target.id);
  update public.offers set is_active = p_active, archived_at = case when p_active then null else now() end,
    archived_by = case when p_active then null else p_actor_id end
  where company_id = p_company_id and (id = root_id or root_offer_id = root_id);
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, target.facility_id, p_actor_id,
    case when p_active then 'offer_recovered'::public.facility_activity_type else 'offer_archived'::public.facility_activity_type end,
    target.title);
end;
$$;

revoke execute on function public.offer_actor_can_manage(uuid, uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.insert_offer_line_items(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.create_offer_atomic(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.update_offer_atomic(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.send_offer_atomic(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.revise_offer_atomic(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.decide_offer_atomic(uuid, uuid, uuid, public.offer_status, text) from public, anon, authenticated;
revoke execute on function public.set_offer_chain_active_atomic(uuid, uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.create_offer_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.update_offer_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.send_offer_atomic(uuid, uuid, uuid) to service_role;
grant execute on function public.revise_offer_atomic(uuid, uuid, uuid) to service_role;
grant execute on function public.decide_offer_atomic(uuid, uuid, uuid, public.offer_status, text) to service_role;
grant execute on function public.set_offer_chain_active_atomic(uuid, uuid, uuid, boolean) to service_role;


-- ===========================================================================
-- From 20260617000009_contract_management.sql
-- ===========================================================================

create or replace function public.generate_contract_reference_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare sequence_year integer; sequence_value integer;
begin
  sequence_year := extract(year from now() at time zone 'Asia/Riyadh');
  insert into public.contract_sequence_counters(company_id, year, current_value)
    values (new.company_id, sequence_year, 1)
    on conflict (company_id, year) do update
      set current_value = public.contract_sequence_counters.current_value + 1
    returning current_value into sequence_value;
  new.reference_number := 'CON-' || sequence_year || '-' || lpad(sequence_value::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists trg_generate_contract_reference_number on public.contracts;
create trigger trg_generate_contract_reference_number before insert on public.contracts
for each row when (new.reference_number is null or new.reference_number = '')
execute function public.generate_contract_reference_number();

create or replace function public.validate_contract_rules_and_immutability()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.start_date >= new.end_date then raise exception 'start date must precede end date' using errcode = '23514'; end if;
  if new.terminated_at is not null and new.terminated_at < new.start_date then raise exception 'invalid termination date' using errcode = '23514'; end if;
  if new.contact_id is not null and not exists (
    select 1 from public.contacts c where c.id = new.contact_id and c.facility_id = new.facility_id and c.company_id = new.company_id
  ) then raise exception 'contact does not belong to facility' using errcode = '23503'; end if;
  if new.offer_id is not null and not exists (
    select 1 from public.offers o where o.id = new.offer_id and o.facility_id = new.facility_id
      and o.company_id = new.company_id and o.status = 'accepted' and o.is_active
  ) then raise exception 'offer must be accepted and belong to facility' using errcode = '23503'; end if;
  if tg_op = 'UPDATE' and old.status in ('active','completed','terminated') and (
    old.title is distinct from new.title or old.value is distinct from new.value or
    old.start_date is distinct from new.start_date or old.end_date is distinct from new.end_date or
    old.offer_id is distinct from new.offer_id or old.contact_id is distinct from new.contact_id or
    old.facility_id is distinct from new.facility_id or old.parent_contract_id is distinct from new.parent_contract_id or
    old.root_contract_id is distinct from new.root_contract_id or old.version is distinct from new.version or
    old.notes is distinct from new.notes or old.payment_terms is distinct from new.payment_terms
  ) then raise exception 'active contract core fields are immutable' using errcode = '23514'; end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_contract_rules_and_immutability on public.contracts;
create trigger trg_validate_contract_rules_and_immutability before insert or update on public.contracts
for each row execute function public.validate_contract_rules_and_immutability();

create or replace function public.can_manage_contract_facility(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_management_only boolean default false
) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p join public.facilities f on f.id = p_facility_id and f.company_id = p_company_id
    where p.id = p_actor_id and p.status = 'active' and f.is_active
      and (p.role = 'super_admin' or p.company_id = p_company_id)
      and (p.role <> 'sales_user' or (not p_management_only and f.assigned_to = p_actor_id))
  )
$$;

create or replace function public.create_contract_atomic(p_company_id uuid, p_actor_id uuid, p_input jsonb)
returns public.contracts language plpgsql security definer set search_path = public as $$
declare result public.contracts; source_offer public.offers;
begin
  if not public.can_manage_contract_facility(p_company_id, (p_input->>'facility_id')::uuid, p_actor_id) then
    raise exception 'contract access denied' using errcode = '42501';
  end if;
  if nullif(p_input->>'offer_id','') is not null then
    select * into source_offer from public.offers where id = (p_input->>'offer_id')::uuid and company_id = p_company_id
      and facility_id = (p_input->>'facility_id')::uuid and status = 'accepted' and is_active;
    if not found then raise exception 'accepted offer not found' using errcode = '23503'; end if;
  end if;
  insert into public.contracts(company_id, facility_id, contact_id, offer_id, created_by, title, value,
    start_date, end_date, payment_terms, notes)
  values (p_company_id, (p_input->>'facility_id')::uuid,
    coalesce(nullif(p_input->>'contact_id','')::uuid, source_offer.contact_id), nullif(p_input->>'offer_id','')::uuid,
    p_actor_id, coalesce(nullif(trim(p_input->>'title'),''), source_offer.title),
    coalesce(nullif(p_input->>'value','')::numeric, source_offer.grand_total),
    (p_input->>'start_date')::date, (p_input->>'end_date')::date,
    nullif(trim(p_input->>'payment_terms'),''), nullif(trim(p_input->>'notes'),'')) returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contract_created', result.reference_number || ' | ' || result.value || ' SAR');
  return result;
end;
$$;

create or replace function public.update_draft_contract_atomic(p_company_id uuid, p_contract_id uuid, p_actor_id uuid, p_input jsonb)
returns public.contracts language plpgsql security definer set search_path = public as $$
declare current_row public.contracts; result public.contracts;
begin
  select * into current_row from public.contracts where id = p_contract_id and company_id = p_company_id for update;
  if not found or current_row.status <> 'draft' or not public.can_manage_contract_facility(p_company_id,current_row.facility_id,p_actor_id)
    then raise exception 'draft contract access denied' using errcode = '42501'; end if;
  update public.contracts set contact_id = nullif(p_input->>'contact_id','')::uuid, title = trim(p_input->>'title'),
    value = (p_input->>'value')::numeric, start_date = (p_input->>'start_date')::date,
    end_date = (p_input->>'end_date')::date, payment_terms = nullif(trim(p_input->>'payment_terms'),''),
    notes = nullif(trim(p_input->>'notes'),'') where id = p_contract_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contract_updated', result.reference_number);
  return result;
end;
$$;

create or replace function public.transition_contract_atomic(p_company_id uuid, p_contract_id uuid, p_actor_id uuid,
  p_transition text, p_terminated_at date default null, p_reason text default null)
returns public.contracts language plpgsql security definer set search_path = public as $$
declare current_row public.contracts; result public.contracts; management_only boolean;
begin
  select * into current_row from public.contracts where id = p_contract_id and company_id = p_company_id and is_active for update;
  management_only := p_transition in ('completed','terminated');
  if not found or not public.can_manage_contract_facility(p_company_id,current_row.facility_id,p_actor_id,management_only)
    then raise exception 'contract transition denied' using errcode = '42501'; end if;
  if current_row.status <> (case when p_transition = 'active' then 'draft'::public.contract_status else 'active'::public.contract_status end)
    then raise exception 'invalid contract transition' using errcode = '23514'; end if;
  if p_transition = 'active' and current_row.document_path is null then raise exception 'signed document required' using errcode = '23514'; end if;
  if p_transition = 'terminated' and (p_terminated_at is null or p_terminated_at < current_row.start_date or nullif(trim(p_reason),'') is null)
    then raise exception 'termination date and reason required' using errcode = '23514'; end if;
  update public.contracts set status = p_transition::public.contract_status,
    terminated_at = case when p_transition = 'terminated' then p_terminated_at else terminated_at end,
    terminated_reason = case when p_transition = 'terminated' then trim(p_reason) else terminated_reason end
    where id = p_contract_id returning * into result;
  insert into public.facility_activity(company_id,facility_id,actor_id,event_type,new_value) values (
    p_company_id,result.facility_id,p_actor_id,
    case p_transition when 'active' then 'contract_activated'::public.facility_activity_type
      when 'completed' then 'contract_completed'::public.facility_activity_type else 'contract_terminated'::public.facility_activity_type end,
    result.reference_number || coalesce(' | ' || nullif(trim(p_reason),''),'')
  );
  return result;
end;
$$;

create or replace function public.create_contract_addendum_atomic(p_company_id uuid,p_contract_id uuid,p_actor_id uuid)
returns public.contracts language plpgsql security definer set search_path = public as $$
declare parent public.contracts; result public.contracts; root_id uuid;
begin
  select * into parent from public.contracts where id = p_contract_id and company_id = p_company_id and status = 'active' and is_active for update;
  if not found or not public.can_manage_contract_facility(p_company_id,parent.facility_id,p_actor_id) then raise exception 'addendum denied' using errcode = '42501'; end if;
  root_id := coalesce(parent.root_contract_id,parent.id);
  insert into public.contracts(company_id,facility_id,contact_id,created_by,root_contract_id,parent_contract_id,title,value,
    start_date,end_date,payment_terms,version,notes)
  values(p_company_id,parent.facility_id,parent.contact_id,p_actor_id,root_id,parent.id,parent.title,parent.value,
    parent.start_date,parent.end_date,parent.payment_terms,parent.version + 1,parent.notes) returning * into result;
  update public.contracts set is_superseded = true where id = parent.id;
  insert into public.facility_activity(company_id,facility_id,actor_id,event_type,new_value)
    values(p_company_id,parent.facility_id,p_actor_id,'contract_addended',result.reference_number || ' | v' || result.version);
  return result;
end;
$$;

create or replace function public.set_contract_chain_active_atomic(p_company_id uuid,p_contract_id uuid,p_actor_id uuid,p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
declare target public.contracts; root_id uuid;
begin
  select * into target from public.contracts where id = p_contract_id and company_id = p_company_id;
  if not found or not public.can_manage_contract_facility(p_company_id,target.facility_id,p_actor_id,p_active)
    then raise exception 'contract archival denied' using errcode = '42501'; end if;
  root_id := coalesce(target.root_contract_id,target.id);
  update public.contracts set is_active = p_active, archived_at = case when p_active then null else now() end,
    archived_by = case when p_active then null else p_actor_id end
    where company_id = p_company_id and (id = root_id or root_contract_id = root_id);
  insert into public.facility_activity(company_id,facility_id,actor_id,event_type,new_value) values(
    p_company_id,target.facility_id,p_actor_id,
    case when p_active then 'contract_recovered'::public.facility_activity_type else 'contract_archived'::public.facility_activity_type end,
    target.reference_number);
end;
$$;

grant execute on function public.create_contract_atomic(uuid,uuid,jsonb) to authenticated;
grant execute on function public.update_draft_contract_atomic(uuid,uuid,uuid,jsonb) to authenticated;
grant execute on function public.transition_contract_atomic(uuid,uuid,uuid,text,date,text) to authenticated;
grant execute on function public.create_contract_addendum_atomic(uuid,uuid,uuid) to authenticated;
grant execute on function public.set_contract_chain_active_atomic(uuid,uuid,uuid,boolean) to authenticated;
