-- Migration: 20260620000000_bulk_import_export.sql
-- Feature: 011 Bulk Import & Export
-- Creates: system_settings, import_batches tables with RLS policies

-- ============================================================
-- 1. system_settings table
-- ============================================================
create table if not exists public.system_settings (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: Enabled. Readable by all authenticated users, writable only by super_admin.
alter table public.system_settings enable row level security;

create policy system_settings_select on public.system_settings
  for select using (auth.role() = 'authenticated');

create policy system_settings_modify on public.system_settings
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Default seed: max import rows limit
insert into public.system_settings (key, value)
values ('max_import_rows', '1000')
on conflict (key) do nothing;

-- ============================================================
-- 2. import_batch_status enum
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'import_batch_status') then
    create type public.import_batch_status as enum ('preview', 'confirmed', 'failed');
  end if;
end$$;

-- ============================================================
-- 3. import_batches table
-- ============================================================
create table if not exists public.import_batches (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  filename text not null,
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  skipped_rows integer not null default 0,
  error_rows integer not null default 0,
  status public.import_batch_status not null default 'preview',
  created_at timestamptz not null default now()
);

-- RLS: Enabled. Scoped to user's company_id.
alter table public.import_batches enable row level security;

create policy import_batches_select on public.import_batches
  for select using (
    public.is_super_admin() or
    company_id = public.current_company_id()
  );

create policy import_batches_insert on public.import_batches
  for insert with check (
    (public.is_super_admin() or company_id = public.current_company_id()) and
    (public.current_app_role() in ('super_admin', 'company_admin', 'supervisor'))
  );

create policy import_batches_update on public.import_batches
  for update using (
    public.is_super_admin() or
    company_id = public.current_company_id()
  ) with check (
    public.current_app_role() in ('super_admin', 'company_admin', 'supervisor')
  );
