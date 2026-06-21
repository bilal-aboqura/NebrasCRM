create type public.import_batch_status as enum ('preview', 'confirmed', 'failed');

create table public.system_settings (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value)
values ('max_import_rows', '1000')
on conflict (key) do nothing;

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  filename text not null,
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  skipped_rows integer not null default 0 check (skipped_rows >= 0),
  error_rows integer not null default 0 check (error_rows >= 0),
  preview_rows jsonb not null default '[]'::jsonb check (jsonb_typeof(preview_rows) = 'array'),
  status public.import_batch_status not null default 'preview',
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_import_batches_company_created
  on public.import_batches(company_id, created_at desc);

alter table public.system_settings enable row level security;
alter table public.import_batches enable row level security;

create policy system_settings_select on public.system_settings
  for select to authenticated using (true);

create policy system_settings_modify on public.system_settings
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy import_batches_select on public.import_batches
  for select to authenticated using (
    company_id = coalesce(
      case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
      public.jwt_company_id()
    )
  );

create policy import_batches_insert on public.import_batches
  for insert to authenticated with check (
    uploaded_by = auth.uid()
    and public.jwt_role() in ('super_admin', 'company_admin', 'supervisor')
    and company_id = coalesce(
      case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
      public.jwt_company_id()
    )
  );

create or replace function public.confirm_bulk_facility_import(
  p_batch_id uuid,
  p_company_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  batch public.import_batches%rowtype;
  actor public.profiles%rowtype;
  item jsonb;
  inserted_id uuid;
  imported_count integer := 0;
  skipped_count integer := 0;
begin
  select * into actor from public.profiles where id = p_actor_id and active;
  if actor.id is null
     or actor.role not in ('super_admin', 'company_admin', 'supervisor')
     or (actor.role <> 'super_admin' and actor.company_id is distinct from p_company_id) then
    raise exception 'access denied' using errcode = '42501';
  end if;

  select * into batch from public.import_batches
    where id = p_batch_id and company_id = p_company_id and uploaded_by = p_actor_id
    for update;
  if batch.id is null then
    raise exception 'import batch not found' using errcode = 'P0002';
  end if;
  if batch.status <> 'preview' then
    raise exception 'import batch already processed' using errcode = '23514';
  end if;

  for item in select value from jsonb_array_elements(batch.preview_rows)
  loop
    if item->>'status' <> 'valid' then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    begin
      insert into public.facilities (
        company_id, name_ar, type, region_id, city_id, city_custom,
        primary_phone, secondary_phone, lead_source, assigned_to,
        status, notes, created_by
      ) values (
        p_company_id,
        item->'data'->>'name_ar',
        (item->'data'->>'type')::public.facility_type,
        (item->'data'->>'region_id')::uuid,
        (item->'data'->>'city_id')::uuid,
        nullif(item->'data'->>'city_custom', ''),
        item->'data'->>'primary_phone',
        nullif(item->'data'->>'secondary_phone', ''),
        'imported', null, 'new',
        nullif(item->'data'->>'notes', ''),
        p_actor_id
      ) returning id into inserted_id;

      insert into public.facility_activity (
        company_id, facility_id, actor_id, event_type, new_value
      ) values (
        p_company_id, inserted_id, p_actor_id, 'created', 'imported'
      );
      imported_count := imported_count + 1;
    exception when unique_violation then
      skipped_count := skipped_count + 1;
    end;
  end loop;

  update public.import_batches set
    status = 'confirmed',
    valid_rows = imported_count,
    skipped_rows = skipped_count,
    confirmed_at = now()
  where id = batch.id;

  return jsonb_build_object(
    'success', true,
    'importedCount', imported_count,
    'skippedCount', skipped_count
  );
end;
$$;

revoke all on function public.confirm_bulk_facility_import(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_bulk_facility_import(uuid, uuid, uuid) to service_role;

