-- ============================================================================
-- Reconcile contracts & contract_sequence_counters schema
-- ============================================================================
-- Purpose: These tables were created by an early revision of migration
--          20260617000009 which used different column names (owner_id instead
--          of created_by, termination_reason instead of terminated_reason) and
--          lacked many columns (version, contact_id, root_contract_id,
--          payment_terms, updated_at, etc.).  The contract_sequence_counters
--          table had a simple PK on company_id with no year column.
--
--          Later revisions of the migration file and restore_missing_functions
--          reference the new columns, causing runtime errors such as:
--          - "column 'year' of relation 'contract_sequence_counters' does not exist"
--          - "column 'created_by' of relation 'contracts' does not exist"
--
--          All statements are idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. contract_sequence_counters: add year column + change PK
-- ---------------------------------------------------------------------------
alter table public.contract_sequence_counters
  add column if not exists year integer not null default extract(year from now() at time zone 'Asia/Riyadh')::integer;

-- Drop the old single-column PK (company_id) if it exists, then create the
-- composite PK (company_id, year).  Both steps are guarded so the migration
-- is safe regardless of the current constraint state.
do $$
declare pk_name text;
begin
  select con.conname into pk_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
   where nsp.nspname = 'public' and rel.relname = 'contract_sequence_counters'
     and con.contype = 'p';
  if pk_name is not null and pk_name <> 'contract_sequence_counters_pkey' then
    execute format('alter table public.contract_sequence_counters drop constraint %I', pk_name);
  elsif pk_name is null then
    -- No PK at all — safe to create the composite one
    alter table public.contract_sequence_counters
      add constraint contract_sequence_counters_pkey primary key (company_id, year);
  end if;
end;
$$;

-- If the PK is still the old single-column one named differently, replace it
do $$
begin
  if exists (
    select 1 from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public' and rel.relname = 'contract_sequence_counters'
      and con.contype = 'p' and array_length(conkey, 1) = 1
  ) then
    alter table public.contract_sequence_counters drop constraint contract_sequence_counters_pkey;
    alter table public.contract_sequence_counters
      add constraint contract_sequence_counters_pkey primary key (company_id, year);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. contracts: add all missing columns
-- ---------------------------------------------------------------------------
alter table public.contracts add column if not exists created_by uuid;
alter table public.contracts add column if not exists contact_id uuid references public.contacts(id) on delete set null;
alter table public.contracts add column if not exists root_contract_id uuid references public.contracts(id) on delete set null;
alter table public.contracts add column if not exists payment_terms text;
alter table public.contracts add column if not exists terminated_at date;
alter table public.contracts add column if not exists terminated_reason text;
alter table public.contracts add column if not exists version integer not null default 1 check (version > 0);
alter table public.contracts add column if not exists is_superseded boolean not null default false;
alter table public.contracts add column if not exists archived_by uuid references public.profiles(id);
alter table public.contracts add column if not exists notes text;
alter table public.contracts add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 3. Backfill created_by from legacy owner_id
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'owner_id'
  ) then
    update public.contracts set created_by = owner_id where created_by is null;
  end if;
end;
$$;

-- If created_by is still null for some rows, try the facility's assigned_to
update public.contracts c
  set created_by = f.assigned_to
  from public.facilities f
  where c.created_by is null and f.id = c.facility_id and f.assigned_to is not null;

-- Add FK for created_by → profiles if not present
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public' and table_name = 'contracts'
      and constraint_name = 'contracts_created_by_fkey'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'created_by'
  ) then
    alter table public.contracts add constraint contracts_created_by_fkey
      foreign key (created_by) references public.profiles(id);
  end if;
end;
$$;

-- Enforce NOT NULL on created_by (safe after backfill)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts'
      and column_name = 'created_by' and is_nullable = 'YES'
  ) and not exists (
    select 1 from public.contracts where created_by is null
  ) then
    alter table public.contracts alter column created_by set not null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Backfill terminated_reason from legacy termination_reason
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'termination_reason'
  ) then
    update public.contracts set terminated_reason = termination_reason where terminated_reason is null and termination_reason is not null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Backfill updated_at from created_at
-- ---------------------------------------------------------------------------
update public.contracts set updated_at = created_at where updated_at is null or updated_at = created_at;

-- ---------------------------------------------------------------------------
-- 6. Widen value column from numeric(12,2) to numeric(15,2) if needed
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts'
      and column_name = 'value'
      and numeric_precision = 12 and numeric_scale = 2
  ) then
    alter table public.contracts alter column value type numeric(15,2);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Add composite unique constraint on (company_id, reference_number) if missing
--    The legacy table had a global unique on reference_number; the new schema
--    uses a per-company unique.  We add the per-company one but keep the
--    legacy global unique if present (it's stricter but harmless).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public' and table_name = 'contracts'
      and constraint_name = 'contracts_reference_number_uq'
  ) then
    alter table public.contracts
      add constraint contracts_reference_number_uq unique(company_id, reference_number);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Add composite unique constraint on (company_id, root_contract_id, version)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public' and table_name = 'contracts'
      and constraint_name = 'contracts_root_version_uq'
  ) then
    alter table public.contracts
      add constraint contracts_root_version_uq unique(company_id, root_contract_id, version);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Add missing indexes (idempotent)
-- ---------------------------------------------------------------------------
create index if not exists idx_contracts_company_id on public.contracts(company_id);
create index if not exists idx_contracts_facility_id on public.contracts(facility_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_contracts_end_date on public.contracts(end_date);
create index if not exists idx_contracts_root_contract_id on public.contracts(root_contract_id);
