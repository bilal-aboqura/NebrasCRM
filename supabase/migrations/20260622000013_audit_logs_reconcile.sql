-- Reconcile audit_logs schema: ensure event_type and outcome columns can
-- accept all values used by the application code and triggers.
-- The production table may have TEXT columns with CHECK constraints instead
-- of the enum types the current code expects.

-- ---------------------------------------------------------------------------
-- 1. Ensure enum types have all needed values
-- ---------------------------------------------------------------------------
do $$ begin
  alter type public.audit_event add value if not exists 'company_create';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.audit_event add value if not exists 'company_update';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.audit_event add value if not exists 'user_invite';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.audit_event add value if not exists 'profile_update';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.audit_event add value if not exists 'unauthorized_admin_attempt';
exception when duplicate_object then null; end $$;

-- Ensure audit_outcome type exists with all values
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'audit_outcome') then
    create type public.audit_outcome as enum ('success', 'failure', 'throttled');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Add missing columns to audit_logs
-- ---------------------------------------------------------------------------
alter table public.audit_logs add column if not exists actor_user_id uuid;
alter table public.audit_logs add column if not exists actor_company_id uuid;
alter table public.audit_logs add column if not exists target_company_id uuid;
alter table public.audit_logs add column if not exists source_ip inet;
alter table public.audit_logs add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.audit_logs add column if not exists timestamp timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 3. Ensure event_type column exists and can hold all values
-- ---------------------------------------------------------------------------
do $$
begin
  -- If event_type doesn't exist at all, add it as the enum type
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'event_type') then
    alter table public.audit_logs add column event_type public.audit_event not null default 'login';
  end if;
end;
$$;

-- If event_type is TEXT with a CHECK constraint, convert it to the enum type.
-- This removes the restrictive CHECK constraint and uses the enum instead.
do $$
declare
  col_type text;
  constraint_name text;
  has_unknown_values boolean;
begin
  select data_type into col_type from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'event_type';

  if col_type = 'USER-DEFINED' then
    -- Already an enum type, nothing to do
    null;
  else
    -- It's text or varchar — drop any CHECK constraint on it, then convert
    -- Drop every legacy check involving event_type, regardless of its name.
    for constraint_name in
      select distinct con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      join pg_attribute att
        on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
      where nsp.nspname = 'public'
        and rel.relname = 'audit_logs'
        and con.contype = 'c'
        and att.attname = 'event_type'
    loop
      execute format('alter table public.audit_logs drop constraint %I', constraint_name);
    end loop;

    select exists (
      select 1
      from public.audit_logs logs
      where logs.event_type is not null
        and not exists (
          select 1
          from pg_enum enum_value
          join pg_type enum_type on enum_type.oid = enum_value.enumtypid
          join pg_namespace enum_schema on enum_schema.oid = enum_type.typnamespace
          where enum_schema.nspname = 'public'
            and enum_type.typname = 'audit_event'
            and enum_value.enumlabel = logs.event_type::text
        )
    ) into has_unknown_values;

    -- Keep unknown historical values as text instead of losing audit data.
    if not has_unknown_values then
      alter table public.audit_logs alter column event_type type public.audit_event
        using event_type::public.audit_event;
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Ensure outcome column exists and can hold all values
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'outcome') then
    alter table public.audit_logs add column outcome public.audit_outcome not null default 'success';
  end if;
end;
$$;

-- If outcome is TEXT, convert to enum when all historical values are valid.
do $$
declare
  col_type text;
  constraint_name text;
  has_unknown_values boolean;
begin
  select data_type into col_type from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'outcome';

  if col_type <> 'USER-DEFINED' then
    for constraint_name in
      select distinct con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      join pg_attribute att
        on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
      where nsp.nspname = 'public'
        and rel.relname = 'audit_logs'
        and con.contype = 'c'
        and att.attname = 'outcome'
    loop
      execute format('alter table public.audit_logs drop constraint %I', constraint_name);
    end loop;

    select exists (
      select 1
      from public.audit_logs logs
      where logs.outcome is not null
        and not exists (
          select 1
          from pg_enum enum_value
          join pg_type enum_type on enum_type.oid = enum_value.enumtypid
          join pg_namespace enum_schema on enum_schema.oid = enum_type.typnamespace
          where enum_schema.nspname = 'public'
            and enum_type.typname = 'audit_outcome'
            and enum_value.enumlabel = logs.outcome::text
        )
    ) into has_unknown_values;

    if not has_unknown_values then
      alter table public.audit_logs alter column outcome drop default;
      alter table public.audit_logs alter column outcome type public.audit_outcome
        using outcome::public.audit_outcome;
      alter table public.audit_logs alter column outcome set default 'success'::public.audit_outcome;
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Add index if missing
-- ---------------------------------------------------------------------------
create index if not exists audit_logs_company_time_idx
  on public.audit_logs (actor_company_id, timestamp desc);
