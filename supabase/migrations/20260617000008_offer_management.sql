alter type public.facility_activity_type add value if not exists 'offer_created';
alter type public.facility_activity_type add value if not exists 'offer_sent';
alter type public.facility_activity_type add value if not exists 'offer_revised';
alter type public.facility_activity_type add value if not exists 'offer_accepted';
alter type public.facility_activity_type add value if not exists 'offer_rejected';
alter type public.facility_activity_type add value if not exists 'offer_archived';
alter type public.facility_activity_type add value if not exists 'offer_recovered';

create type public.offer_status as enum ('draft', 'sent', 'accepted', 'rejected');
create type public.discount_type as enum ('percentage', 'fixed');

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  root_offer_id uuid references public.offers(id) on delete set null,
  parent_offer_id uuid references public.offers(id) on delete set null,
  title text not null check (length(trim(title)) between 2 and 200),
  currency text not null default 'SAR' check (currency = 'SAR'),
  status public.offer_status not null default 'draft',
  subtotal numeric(15,2) not null default 0 check (subtotal >= 0),
  discount_type public.discount_type not null default 'fixed',
  discount_value numeric(15,2) not null default 0 check (discount_value >= 0),
  discount_amount numeric(15,2) not null default 0 check (discount_amount >= 0),
  tax_rate numeric(5,2) not null default 15 check (tax_rate in (0, 15)),
  tax_amount numeric(15,2) not null default 0 check (tax_amount >= 0),
  grand_total numeric(15,2) not null default 0 check (grand_total >= 0),
  valid_until date not null,
  sent_at timestamptz,
  decision_at timestamptz,
  decision_note text,
  version integer not null default 1 check (version > 0),
  is_superseded boolean not null default false,
  is_active boolean not null default true,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_facility_company_fk foreign key (facility_id, company_id)
    references public.facilities(id, company_id),
  constraint offers_parent_not_self check (parent_offer_id is null or parent_offer_id <> id),
  constraint offers_root_not_self check (root_offer_id is null or root_offer_id <> id),
  constraint offers_root_version_uq unique (company_id, root_offer_id, version)
);

create table public.offer_line_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  description text not null check (length(trim(description)) between 2 and 500),
  amount numeric(15,2) not null check (amount > 0),
  ordering integer not null default 0 check (ordering >= 0),
  created_at timestamptz not null default now()
);

create index idx_offers_company_id on public.offers(company_id);
create index idx_offers_facility_id on public.offers(facility_id);
create index idx_offers_root_offer_id on public.offers(root_offer_id);
create index idx_offers_status on public.offers(status);
create index idx_offers_valid_until on public.offers(valid_until);
create index idx_offer_line_items_offer_id on public.offer_line_items(offer_id);

create or replace function public.calculate_offer_totals()
returns trigger language plpgsql as $$
begin
  new.title := trim(new.title);
  new.notes := nullif(trim(new.notes), '');
  new.decision_note := nullif(trim(new.decision_note), '');
  if new.discount_type = 'percentage' then
    if new.discount_value > 100 then
      raise exception 'percentage discount cannot exceed 100' using errcode = '23514';
    end if;
    new.discount_amount := round(new.subtotal * new.discount_value / 100, 2);
  else
    new.discount_amount := round(new.discount_value, 2);
  end if;
  if new.discount_amount > new.subtotal then
    raise exception 'discount cannot exceed subtotal' using errcode = '23514';
  end if;
  new.tax_amount := round((new.subtotal - new.discount_amount) * new.tax_rate / 100, 2);
  new.grand_total := round(new.subtotal - new.discount_amount + new.tax_amount, 2);
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.validate_offer_and_immutability()
returns trigger language plpgsql as $$
begin
  if new.contact_id is not null and not exists (
    select 1 from public.contacts c
    where c.id = new.contact_id and c.facility_id = new.facility_id
      and c.company_id = new.company_id and not c.is_archived
  ) then
    raise exception 'contact does not belong to facility' using errcode = '23503';
  end if;
  if new.parent_offer_id is not null and not exists (
    select 1 from public.offers p where p.id = new.parent_offer_id
      and p.company_id = new.company_id and p.facility_id = new.facility_id
  ) then
    raise exception 'parent offer does not belong to facility' using errcode = '23503';
  end if;
  if tg_op = 'UPDATE' and old.status in ('sent', 'accepted', 'rejected') and (
    old.title is distinct from new.title or old.facility_id is distinct from new.facility_id or
    old.contact_id is distinct from new.contact_id or old.subtotal is distinct from new.subtotal or
    old.discount_type is distinct from new.discount_type or old.discount_value is distinct from new.discount_value or
    old.tax_rate is distinct from new.tax_rate or old.valid_until is distinct from new.valid_until or
    old.parent_offer_id is distinct from new.parent_offer_id or old.root_offer_id is distinct from new.root_offer_id or
    old.version is distinct from new.version or old.notes is distinct from new.notes
  ) then
    raise exception 'sent offers are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trg_validate_offer_and_immutability before insert or update on public.offers
for each row execute function public.validate_offer_and_immutability();
create trigger trg_calculate_offer_totals before insert or update on public.offers
for each row execute function public.calculate_offer_totals();

create or replace function public.guard_offer_line_item_mutation()
returns trigger language plpgsql as $$
declare target_offer uuid := coalesce(new.offer_id, old.offer_id);
begin
  if exists (select 1 from public.offers where id = target_offer and status <> 'draft') then
    raise exception 'sent offer line items are immutable' using errcode = '23514';
  end if;
  if tg_op <> 'DELETE' then new.description := trim(new.description); return new; end if;
  return old;
end;
$$;
create trigger trg_guard_offer_line_items before insert or update or delete on public.offer_line_items
for each row execute function public.guard_offer_line_item_mutation();

create or replace function public.update_offer_subtotal_on_line_item_change()
returns trigger language plpgsql as $$
declare target_offer uuid := coalesce(new.offer_id, old.offer_id);
begin
  update public.offers set subtotal = coalesce((
    select sum(amount) from public.offer_line_items where offer_id = target_offer
  ), 0) where id = target_offer;
  return null;
end;
$$;
create trigger trg_update_offer_subtotal after insert or update or delete on public.offer_line_items
for each row execute function public.update_offer_subtotal_on_line_item_change();

create or replace function public.offer_actor_can_manage(
  p_actor_id uuid, p_company_id uuid, p_facility_id uuid, p_management_only boolean default false
) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.facilities f on f.id = p_facility_id and f.company_id = p_company_id
    where p.id = p_actor_id and p.status = 'active' and f.is_active
      and (p.role = 'super_admin' or p.company_id = p_company_id)
      and (p.role <> 'sales_user' or (not p_management_only and f.assigned_to = p_actor_id))
  )
$$;

create or replace function public.insert_offer_line_items(p_offer_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'at least one line item is required' using errcode = '23514';
  end if;
  insert into public.offer_line_items(offer_id, description, amount, ordering)
  select p_offer_id, item->>'description', (item->>'amount')::numeric,
    coalesce((item->>'ordering')::integer, ordinality::integer - 1)
  from jsonb_array_elements(p_items) with ordinality as rows(item, ordinality);
end;
$$;

create or replace function public.create_offer_atomic(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_input jsonb
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare result public.offers;
begin
  if not public.offer_actor_can_manage(p_actor_id, p_company_id, p_facility_id) then
    raise exception 'offer access denied' using errcode = '42501';
  end if;
  insert into public.offers(company_id, facility_id, contact_id, created_by, title,
    discount_type, discount_value, tax_rate, valid_until, notes)
  values (p_company_id, p_facility_id, nullif(p_input->>'contact_id', '')::uuid, p_actor_id,
    p_input->>'title', 'fixed', 0, coalesce((p_input->>'tax_rate')::numeric, 15),
    (p_input->>'valid_until')::date, p_input->>'notes') returning * into result;
  perform public.insert_offer_line_items(result.id, p_input->'line_items');
  update public.offers set discount_type = (p_input->>'discount_type')::public.discount_type,
    discount_value = (p_input->>'discount_value')::numeric,
    tax_rate = coalesce((p_input->>'tax_rate')::numeric, 15)
  where id = result.id;
  select * into result from public.offers where id = result.id;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, p_facility_id, p_actor_id, 'offer_created',
    result.title || ' | ' || result.grand_total || ' SAR');
  return result;
end;
$$;

create or replace function public.update_offer_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid, p_input jsonb
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare current_row public.offers; result public.offers;
begin
  select * into current_row from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if current_row.id is null or current_row.status <> 'draft' or
     not public.offer_actor_can_manage(p_actor_id, p_company_id, current_row.facility_id) then
    raise exception 'draft offer access denied' using errcode = '42501';
  end if;
  update public.offers set contact_id = nullif(p_input->>'contact_id', '')::uuid,
    title = p_input->>'title', discount_type = 'fixed', discount_value = 0,
    tax_rate = coalesce((p_input->>'tax_rate')::numeric, 15),
    valid_until = (p_input->>'valid_until')::date, notes = p_input->>'notes'
  where id = p_offer_id returning * into result;
  delete from public.offer_line_items where offer_id = p_offer_id;
  perform public.insert_offer_line_items(p_offer_id, p_input->'line_items');
  update public.offers set discount_type = (p_input->>'discount_type')::public.discount_type,
    discount_value = (p_input->>'discount_value')::numeric,
    tax_rate = coalesce((p_input->>'tax_rate')::numeric, 15)
  where id = p_offer_id;
  select * into result from public.offers where id = p_offer_id;
  return result;
end;
$$;

create or replace function public.send_offer_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare result public.offers;
begin
  select * into result from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if result.id is null or result.status <> 'draft' or result.subtotal <= 0 or
     not public.offer_actor_can_manage(p_actor_id, p_company_id, result.facility_id) then
    raise exception 'offer cannot be sent' using errcode = '42501';
  end if;
  update public.offers set status = 'sent', sent_at = now() where id = p_offer_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, result.facility_id, p_actor_id, 'offer_sent', result.title || ' | ' || result.grand_total || ' SAR');
  return result;
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
  insert into public.offer_line_items(offer_id, description, amount, ordering)
    select result.id, description, amount, ordering from public.offer_line_items where offer_id = parent_row.id;
  update public.offers set discount_type = parent_row.discount_type, discount_value = parent_row.discount_value
    where id = result.id;
  update public.offers set is_superseded = true where id = parent_row.id;
  select * into result from public.offers where id = result.id;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, result.facility_id, p_actor_id, 'offer_revised', result.title || ' | v' || result.version);
  return result;
end;
$$;

create or replace function public.decide_offer_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid, p_decision public.offer_status, p_note text default null
) returns public.offers language plpgsql security definer set search_path = '' as $$
declare result public.offers; was_expired boolean;
begin
  if p_decision not in ('accepted', 'rejected') then raise exception 'invalid offer decision' using errcode = '23514'; end if;
  select * into result from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if result.id is null or result.status <> 'sent' or
     not public.offer_actor_can_manage(p_actor_id, p_company_id, result.facility_id) then
    raise exception 'offer decision access denied' using errcode = '42501';
  end if;
  was_expired := result.valid_until < (now() at time zone 'Asia/Riyadh')::date;
  update public.offers set status = p_decision, decision_at = now(), decision_note = nullif(trim(p_note), '')
    where id = p_offer_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, result.facility_id, p_actor_id,
    case when p_decision = 'accepted' then 'offer_accepted'::public.facility_activity_type else 'offer_rejected'::public.facility_activity_type end,
    result.title || ' | ' || result.grand_total || ' SAR' || case when was_expired then ' | expired' else '' end ||
      coalesce(' | ' || nullif(trim(p_note), ''), ''));
  return result;
end;
$$;

create or replace function public.set_offer_chain_active_atomic(
  p_company_id uuid, p_offer_id uuid, p_actor_id uuid, p_active boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare target public.offers; root_id uuid;
begin
  select * into target from public.offers where id = p_offer_id and company_id = p_company_id for update;
  if target.id is null or not public.offer_actor_can_manage(p_actor_id, p_company_id, target.facility_id, p_active) then
    raise exception 'offer archive access denied' using errcode = '42501';
  end if;
  root_id := coalesce(target.root_offer_id, target.id);
  update public.offers set is_active = p_active, archived_at = case when p_active then null else now() end,
    archived_by = case when p_active then null else p_actor_id end
  where company_id = p_company_id and (id = root_id or root_offer_id = root_id);
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
  values (p_company_id, target.facility_id, p_actor_id,
    case when p_active then 'offer_recovered'::public.facility_activity_type else 'offer_archived'::public.facility_activity_type end,
    target.title);
end;
$$;

alter table public.offers enable row level security;
alter table public.offer_line_items enable row level security;

create policy offers_select on public.offers for select to authenticated using (
  company_id = coalesce(case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end, public.jwt_company_id())
  and exists (select 1 from public.facilities f where f.id = offers.facility_id and f.company_id = offers.company_id
    and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);
create policy offers_insert on public.offers for insert to authenticated with check (
  company_id = coalesce(case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end, public.jwt_company_id())
  and created_by = auth.uid() and exists (select 1 from public.facilities f where f.id = offers.facility_id
    and f.company_id = offers.company_id and f.is_active and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);
create policy offers_update on public.offers for update to authenticated using (
  company_id = coalesce(case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end, public.jwt_company_id())
  and exists (select 1 from public.facilities f where f.id = offers.facility_id and f.company_id = offers.company_id
    and f.is_active and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
) with check (
  company_id = coalesce(case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end, public.jwt_company_id())
);
create policy offer_items_select on public.offer_line_items for select to authenticated using (
  exists (select 1 from public.offers o where o.id = offer_line_items.offer_id)
);
create policy offer_items_insert on public.offer_line_items for insert to authenticated with check (
  exists (select 1 from public.offers o where o.id = offer_line_items.offer_id and o.status = 'draft')
);
create policy offer_items_update on public.offer_line_items for update to authenticated using (
  exists (select 1 from public.offers o where o.id = offer_line_items.offer_id and o.status = 'draft')
);
create policy offer_items_delete on public.offer_line_items for delete to authenticated using (
  exists (select 1 from public.offers o where o.id = offer_line_items.offer_id and o.status = 'draft')
);

revoke delete on public.offers from public, anon, authenticated;
revoke execute on function public.offer_actor_can_manage(uuid, uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.insert_offer_line_items(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.create_offer_atomic(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.update_offer_atomic(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.send_offer_atomic(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.revise_offer_atomic(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.decide_offer_atomic(uuid, uuid, uuid, public.offer_status, text) from public, anon, authenticated;
revoke execute on function public.set_offer_chain_active_atomic(uuid, uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.create_offer_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.update_offer_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.send_offer_atomic(uuid, uuid, uuid) to service_role;
grant execute on function public.revise_offer_atomic(uuid, uuid, uuid) to service_role;
grant execute on function public.decide_offer_atomic(uuid, uuid, uuid, public.offer_status, text) to service_role;
grant execute on function public.set_offer_chain_active_atomic(uuid, uuid, uuid, boolean) to service_role;
