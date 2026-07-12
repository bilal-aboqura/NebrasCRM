-- Fix audit_logs_event_type_all constraint to include user_invite and all required event types.
-- The previous migration only added the constraint when the column type was text,
-- but the column may be an enum (USER-DEFINED), leaving the old constraint intact.
-- This migration forcefully drops ALL check constraints on event_type and recreates
-- the correct one, regardless of column type.

-- 1. Drop the known constraint by name (if it exists)
alter table public.audit_logs drop constraint if exists audit_logs_event_type_all;
alter table public.audit_logs drop constraint if exists audit_logs_event_type_check;

-- 2. Drop any other lingering check constraint on the event_type column
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
    where nsp.nspname = 'public'
      and rel.relname = 'audit_logs'
      and con.contype = 'c'
      and att.attname = 'event_type'
  loop
    execute format('alter table public.audit_logs drop constraint %I', c.conname);
  end loop;
end;
$$;

-- 3. If the column is still plain text, add the corrected check constraint.
--    If it is already an enum, no check constraint is needed (the type enforces values).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'audit_logs'
      and column_name  = 'event_type'
      and data_type   <> 'USER-DEFINED'
  ) then
    alter table public.audit_logs
      add constraint audit_logs_event_type_all check (
        event_type in (
          'login', 'logout', 'failed_login', 'company_switch',
          'company_create', 'company_update', 'user_invite',
          'profile_update', 'unauthorized_admin_attempt'
        )
      );
  end if;
end;
$$;

-- 4. If the column IS an enum, ensure user_invite is a member of that enum.
do $$
declare
  v_enum_name text;
begin
  select t.typname into v_enum_name
  from pg_attribute a
  join pg_class c   on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_type t    on t.oid = a.atttypid
  where n.nspname = 'public'
    and c.relname = 'audit_logs'
    and a.attname = 'event_type'
    and t.typtype  = 'e';

  if v_enum_name is not null then
    -- Add missing enum values (safe to call even if they already exist in PG 14+)
    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = v_enum_name and e.enumlabel = 'user_invite'
    ) then
      execute format('alter type public.%I add value %L', v_enum_name, 'user_invite');
    end if;

    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = v_enum_name and e.enumlabel = 'profile_update'
    ) then
      execute format('alter type public.%I add value %L', v_enum_name, 'profile_update');
    end if;

    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = v_enum_name and e.enumlabel = 'unauthorized_admin_attempt'
    ) then
      execute format('alter type public.%I add value %L', v_enum_name, 'unauthorized_admin_attempt');
    end if;
  end if;
end;
$$;
