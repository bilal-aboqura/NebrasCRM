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
        'imported',
        null,
        coalesce(nullif(item->'data'->>'status', ''), 'new')::public.facility_status,
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
