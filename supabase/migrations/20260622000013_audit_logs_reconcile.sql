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
declare col_type text;
begin
  select data_type into col_type from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'event_type';

  if col_type = 'USER-DEFINED' then
    -- Already an enum type, nothing to do
    null;
  else
    -- It's text or varchar — drop any CHECK constraint on it, then convert
    -- First drop the auto-named check constraint if present
    if exists (
      select 1 from information_schema.table_constraints
      where constraint_schema = 'public' and table_name = 'audit_logs'
        and constraint_name = 'audit_logs_event_type_check'
    ) then
      alter table public.audit_logs drop constraint audit_logs_event_type_check;
    end if;

    -- Convert to enum (values that don't match the enum will cause an error,
    -- but existing data should only contain valid values)
    begin
      alter table public.audit_logs alter column event_type type public.audit_event
        using event_type::public.audit_event;
    exception when others then
      -- If cast fails (bad data), keep as text but expand the check constraint
      alter table public.audit_logs add constraint audit_logs_event_type_check
        check (event_type in ('login', 'logout', 'failed_login', 'company_switch',
          'company_create', 'company_update', 'user_invite', 'profile_update',
          'unauthorized_admin_attempt'));
    end;
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

-- If outcome is TEXT, convert to enum
do $$
declare col_type text;
begin
  select data_type into col_type from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'outcome';

  if col_type <> 'USER-DEFINED' then
    if exists (
      select 1 from information_schema.table_constraints
      where constraint_schema = 'public' and table_name = 'audit_logs'
        and constraint_name = 'audit_logs_outcome_check'
    ) then
      alter table public.audit_logs drop constraint audit_logs_outcome_check;
    end if;

    begin
      alter table public.audit_logs alter column outcome type public.audit_outcome
        using outcome::public.audit_outcome;
    exception when others then
      alter table public.audit_logs add constraint audit_logs_outcome_check
        check (outcome in ('success', 'failure', 'throttled'));
    end;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Add index if missing
-- ---------------------------------------------------------------------------
create index if not exists audit_logs_company_time_idx
  on public.audit_logs (actor_company_id, timestamp desc);
