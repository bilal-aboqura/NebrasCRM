alter type public.facility_activity_type add value if not exists 'offer_document_uploaded';
alter type public.facility_activity_type add value if not exists 'offer_document_viewed';

alter table public.offers
  add column if not exists document_path text;

create or replace function public.insert_offer_line_items(p_offer_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'line items payload must be an array' using errcode = '23514';
  end if;

  if jsonb_array_length(p_items) = 0 then
    return;
  end if;

  insert into public.offer_line_items(offer_id, description, amount, ordering)
  select p_offer_id, item->>'description', (item->>'amount')::numeric,
    coalesce((item->>'ordering')::integer, ordinality::integer - 1)
  from jsonb_array_elements(p_items) with ordinality as rows(item, ordinality);
end;
$$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('offers', 'offers', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict(id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists offer_documents_select on storage.objects;
create policy offer_documents_select on storage.objects for select to authenticated using (
  bucket_id = 'offers' and name like 'company_' || public.jwt_company_id()::text || '/offers/%'
  and exists(
    select 1 from public.offers o
    join public.facilities f on f.id = o.facility_id
    where o.id = substring(name from '^company_[^/]+/offers/([0-9a-f-]{36})/')::uuid
      and o.company_id = public.jwt_company_id()
      and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid())
  )
);

drop policy if exists offer_documents_insert on storage.objects;
create policy offer_documents_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'offers' and name like 'company_' || public.jwt_company_id()::text || '/offers/%'
  and exists(
    select 1 from public.offers o
    join public.facilities f on f.id = o.facility_id
    where o.id = substring(name from '^company_[^/]+/offers/([0-9a-f-]{36})/')::uuid
      and o.company_id = public.jwt_company_id()
      and o.status = 'draft'
      and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and o.created_by = auth.uid()))
  )
);

drop policy if exists offer_documents_update on storage.objects;
create policy offer_documents_update on storage.objects for update to authenticated using (
  bucket_id = 'offers' and name like 'company_' || public.jwt_company_id()::text || '/offers/%'
  and exists(
    select 1 from public.offers o
    join public.facilities f on f.id = o.facility_id
    where o.id = substring(name from '^company_[^/]+/offers/([0-9a-f-]{36})/')::uuid
      and o.company_id = public.jwt_company_id()
      and o.status = 'draft'
      and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and o.created_by = auth.uid()))
  )
) with check (
  bucket_id = 'offers' and name like 'company_' || public.jwt_company_id()::text || '/offers/%'
  and exists(
    select 1 from public.offers o
    join public.facilities f on f.id = o.facility_id
    where o.id = substring(name from '^company_[^/]+/offers/([0-9a-f-]{36})/')::uuid
      and o.company_id = public.jwt_company_id()
      and o.status = 'draft'
      and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and o.created_by = auth.uid()))
  )
);
