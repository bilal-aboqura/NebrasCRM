-- ============================================================================
-- Reconcile call_logs table schema
-- ============================================================================
-- Purpose: The call_logs table was originally created by an early revision of
--          migration 20260616000007 which lacked many columns (version,
--          is_archived, created_by_id, etc.) and used different enum values.
--          Later revisions of that migration file added these columns, but
--          because Supabase only applies each migration once, the production
--          database never received the new columns.
--
--          This migration adds every missing column, enum value, constraint,
--          and index so the table matches what the application code and stored
--          functions (restore_missing_functions.sql) expect.
--
--          All statements are idempotent (IF NOT EXISTS) so this is safe to run
--          on databases that already have some or all of the columns.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add missing enum values
-- ---------------------------------------------------------------------------
-- communication_channel: original ('phone','whatsapp','email','visit')
--                        target   ('call','whatsapp')
do $$ begin
  alter type public.communication_channel add value if not exists 'call';
exception when duplicate_object then null; end $$;

-- communication_outcome: original ('answered','no_answer','callback','not_interested')
--                        target   ('answered','no_answer','busy','wrong_number','callback_requested','not_reachable')
do $$ begin
  alter type public.communication_outcome add value if not exists 'busy';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.communication_outcome add value if not exists 'wrong_number';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.communication_outcome add value if not exists 'callback_requested';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.communication_outcome add value if not exists 'not_reachable';
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Add missing columns
-- ---------------------------------------------------------------------------
alter table public.call_logs add column if not exists created_by_id uuid references public.profiles(id);
alter table public.call_logs add column if not exists duration_seconds integer check (duration_seconds is null or (duration_seconds between 0 and 86400));
alter table public.call_logs add column if not exists updated_at timestamptz not null default now();
alter table public.call_logs add column if not exists last_edited_by_id uuid references public.profiles(id);
alter table public.call_logs add column if not exists last_edited_at timestamptz;
alter table public.call_logs add column if not exists archived_at timestamptz;
alter table public.call_logs add column if not exists archived_by_id uuid references public.profiles(id);
alter table public.call_logs add column if not exists is_archived boolean not null default false;
alter table public.call_logs add column if not exists version integer not null default 1 check (version > 0);

-- ---------------------------------------------------------------------------
-- 3. Backfill data
-- ---------------------------------------------------------------------------
-- 3a. created_by_id: fall back to the facility's assigned_to or created_by
--     (created_by was the original column name used in early followups/contacts)
update public.call_logs
  set created_by_id = f.assigned_to
  from public.facilities f
  where call_logs.created_by_id is null
    and f.id = call_logs.facility_id
    and f.assigned_to is not null;

-- If there are still rows with null created_by_id, fall back to any active
-- admin in the same company so the NOT NULL constraint can be applied.
update public.call_logs cl
  set created_by_id = (
    select p.id from public.profiles p
    where p.company_id = cl.company_id
      and p.status = 'active'
      and p.role in ('super_admin', 'company_admin')
    order by p.created_at asc
    limit 1
  )
  where cl.created_by_id is null;

-- 3b. is_archived: derive from legacy is_active column if it exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'call_logs' and column_name = 'is_active'
  ) then
    update public.call_logs set is_archived = not is_active where is_active is not null;
  end if;
end;
$$;

-- 3c. updated_at: ensure every row has a sane value
update public.call_logs set updated_at = created_at where updated_at is null;

-- 3d. Enforce NOT NULL on created_by_id now that data is backfilled
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'call_logs'
      and column_name = 'created_by_id' and is_nullable = 'YES'
  ) and not exists (
    select 1 from public.call_logs where created_by_id is null
  ) then
    alter table public.call_logs alter column created_by_id set not null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Drop legacy is_active column if present (replaced by is_archived)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'call_logs' and column_name = 'is_active'
  ) then
    alter table public.call_logs drop column is_active;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Add composite FK (facility_id, company_id) if missing
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public' and table_name = 'call_logs'
      and constraint_name = 'call_logs_facility_company_fk'
  ) then
    alter table public.call_logs
      add constraint call_logs_facility_company_fk
      foreign key (facility_id, company_id)
      references public.facilities(id, company_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Add archive-state CHECK constraint if missing
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public' and table_name = 'call_logs'
      and constraint_name = 'call_logs_archive_state'
  ) then
    alter table public.call_logs
      add constraint call_logs_archive_state check (
        (is_archived and archived_at is not null and archived_by_id is not null)
        or (not is_archived and archived_at is null and archived_by_id is null)
      );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Add missing indexes (idempotent)
-- ---------------------------------------------------------------------------
create index if not exists idx_call_logs_company_id on public.call_logs(company_id);
create index if not exists idx_call_logs_facility_id on public.call_logs(facility_id);
create index if not exists idx_call_logs_occurred_at on public.call_logs(occurred_at desc);
create index if not exists idx_call_logs_facility_active_occurred
  on public.call_logs(facility_id, occurred_at desc) where not is_archived;
