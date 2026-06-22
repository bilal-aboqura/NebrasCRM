-- Fix insert_offer_line_items and revise_offer_atomic to work with live DB
-- where offer_line_items.amount is a GENERATED column (quantity * unit_price).
-- Inserting into a generated column directly raises:
--   "cannot insert a non-DEFAULT value into column amount"
-- Fix: insert unit_price = amount_value, quantity = 1 instead.

create or replace function public.insert_offer_line_items(p_offer_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'at least one line item is required' using errcode = '23514';
  end if;
  insert into public.offer_line_items(offer_id, description, unit_price, quantity, ordering)
  select
    p_offer_id,
    trim(item->>'description'),
    (item->>'amount')::numeric,
    1,
    coalesce((item->>'ordering')::integer, ordinality::integer - 1)
  from jsonb_array_elements(p_items) with ordinality as rows(item, ordinality);
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
  -- Copy line items using unit_price/quantity so generated 'amount' column is computed automatically
  insert into public.offer_line_items(offer_id, description, unit_price, quantity, ordering)
    select result.id, description,
      coalesce(unit_price, amount), coalesce(quantity, 1), coalesce(ordering, 0)
    from public.offer_line_items where offer_id = parent_row.id;
  update public.offers set discount_type = parent_row.discount_type, discount_value = parent_row.discount_value
    where id = result.id;
  update public.offers set is_superseded = true where id = parent_row.id;
  select * into result from public.offers where id = result.id;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, result.facility_id, p_actor_id, 'offer_revised', result.title || ' | v' || result.version);
  return result;
end;
$$;
