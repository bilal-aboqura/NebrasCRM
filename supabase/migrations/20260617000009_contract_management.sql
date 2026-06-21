alter type public.facility_activity_type add value if not exists 'contract_created';
alter type public.facility_activity_type add value if not exists 'contract_updated';
alter type public.facility_activity_type add value if not exists 'contract_activated';
alter type public.facility_activity_type add value if not exists 'contract_completed';
alter type public.facility_activity_type add value if not exists 'contract_terminated';
alter type public.facility_activity_type add value if not exists 'contract_addended';
alter type public.facility_activity_type add value if not exists 'contract_document_uploaded';
alter type public.facility_activity_type add value if not exists 'contract_document_viewed';
alter type public.facility_activity_type add value if not exists 'contract_archived';
alter type public.facility_activity_type add value if not exists 'contract_recovered';

create type public.contract_status as enum ('draft', 'active', 'completed', 'terminated');

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  offer_id uuid unique references public.offers(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  root_contract_id uuid references public.contracts(id) on delete set null,
  parent_contract_id uuid references public.contracts(id) on delete set null,
  reference_number text not null default '',
  title text not null check (char_length(trim(title)) >= 2),
  value numeric(15,2) not null check (value > 0),
  start_date date not null,
  end_date date not null,
  status public.contract_status not null default 'draft',
  payment_terms text,
  terminated_at date,
  terminated_reason text,
  document_path text,
  version integer not null default 1 check (version > 0),
  is_superseded boolean not null default false,
  is_active boolean not null default true,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_reference_number_uq unique(company_id, reference_number),
  constraint contracts_root_version_uq unique(company_id, root_contract_id, version),
  constraint contracts_dates_check check (start_date < end_date),
  constraint contracts_termination_check check (terminated_at is null or terminated_at >= start_date),
  constraint contracts_activation_document_check check (status = 'draft' or document_path is not null)
);

create table public.contract_sequence_counters (
  company_id uuid not null references public.companies(id) on delete cascade,
  year integer not null,
  current_value integer not null default 0 check (current_value >= 0),
  primary key(company_id, year)
);

create index idx_contracts_company_id on public.contracts(company_id);
create index idx_contracts_facility_id on public.contracts(facility_id);
create index idx_contracts_status on public.contracts(status);
create index idx_contracts_end_date on public.contracts(end_date);
create index idx_contracts_root_contract_id on public.contracts(root_contract_id);

create or replace function public.generate_contract_reference_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare sequence_year integer; sequence_value integer;
begin
  sequence_year := extract(year from now() at time zone 'Asia/Riyadh');
  insert into public.contract_sequence_counters(company_id, year, current_value)
    values (new.company_id, sequence_year, 1)
    on conflict (company_id, year) do update
      set current_value = public.contract_sequence_counters.current_value + 1
    returning current_value into sequence_value;
  new.reference_number := 'CON-' || sequence_year || '-' || lpad(sequence_value::text, 4, '0');
  return new;
end;
$$;

create trigger trg_generate_contract_reference_number before insert on public.contracts
for each row when (new.reference_number is null or new.reference_number = '')
execute function public.generate_contract_reference_number();

create or replace function public.validate_contract_rules_and_immutability()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.start_date >= new.end_date then raise exception 'start date must precede end date' using errcode = '23514'; end if;
  if new.terminated_at is not null and new.terminated_at < new.start_date then raise exception 'invalid termination date' using errcode = '23514'; end if;
  if new.contact_id is not null and not exists (
    select 1 from public.contacts c where c.id = new.contact_id and c.facility_id = new.facility_id and c.company_id = new.company_id
  ) then raise exception 'contact does not belong to facility' using errcode = '23503'; end if;
  if new.offer_id is not null and not exists (
    select 1 from public.offers o where o.id = new.offer_id and o.facility_id = new.facility_id
      and o.company_id = new.company_id and o.status = 'accepted' and o.is_active
  ) then raise exception 'offer must be accepted and belong to facility' using errcode = '23503'; end if;
  if tg_op = 'UPDATE' and old.status in ('active','completed','terminated') and (
    old.title is distinct from new.title or old.value is distinct from new.value or
    old.start_date is distinct from new.start_date or old.end_date is distinct from new.end_date or
    old.offer_id is distinct from new.offer_id or old.contact_id is distinct from new.contact_id or
    old.facility_id is distinct from new.facility_id or old.parent_contract_id is distinct from new.parent_contract_id or
    old.root_contract_id is distinct from new.root_contract_id or old.version is distinct from new.version or
    old.notes is distinct from new.notes or old.payment_terms is distinct from new.payment_terms
  ) then raise exception 'active contract core fields are immutable' using errcode = '23514'; end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_validate_contract_rules_and_immutability before insert or update on public.contracts
for each row execute function public.validate_contract_rules_and_immutability();

create or replace function public.can_manage_contract_facility(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_management_only boolean default false
) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p join public.facilities f on f.id = p_facility_id and f.company_id = p_company_id
    where p.id = p_actor_id and p.status = 'active' and f.is_active
      and (p.role = 'super_admin' or p.company_id = p_company_id)
      and (p.role <> 'sales_user' or (not p_management_only and f.assigned_to = p_actor_id))
  )
$$;

create or replace function public.create_contract_atomic(p_company_id uuid, p_actor_id uuid, p_input jsonb)
returns public.contracts language plpgsql security definer set search_path = public as $$
declare result public.contracts; source_offer public.offers;
begin
  if not public.can_manage_contract_facility(p_company_id, (p_input->>'facility_id')::uuid, p_actor_id) then
    raise exception 'contract access denied' using errcode = '42501';
  end if;
  if nullif(p_input->>'offer_id','') is not null then
    select * into source_offer from public.offers where id = (p_input->>'offer_id')::uuid and company_id = p_company_id
      and facility_id = (p_input->>'facility_id')::uuid and status = 'accepted' and is_active;
    if not found then raise exception 'accepted offer not found' using errcode = '23503'; end if;
  end if;
  insert into public.contracts(company_id, facility_id, contact_id, offer_id, created_by, title, value,
    start_date, end_date, payment_terms, notes)
  values (p_company_id, (p_input->>'facility_id')::uuid,
    coalesce(nullif(p_input->>'contact_id','')::uuid, source_offer.contact_id), nullif(p_input->>'offer_id','')::uuid,
    p_actor_id, coalesce(nullif(trim(p_input->>'title'),''), source_offer.title),
    coalesce(nullif(p_input->>'value','')::numeric, source_offer.grand_total),
    (p_input->>'start_date')::date, (p_input->>'end_date')::date,
    nullif(trim(p_input->>'payment_terms'),''), nullif(trim(p_input->>'notes'),'')) returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contract_created', result.reference_number || ' | ' || result.value || ' SAR');
  return result;
end;
$$;

create or replace function public.update_draft_contract_atomic(p_company_id uuid, p_contract_id uuid, p_actor_id uuid, p_input jsonb)
returns public.contracts language plpgsql security definer set search_path = public as $$
declare current_row public.contracts; result public.contracts;
begin
  select * into current_row from public.contracts where id = p_contract_id and company_id = p_company_id for update;
  if not found or current_row.status <> 'draft' or not public.can_manage_contract_facility(p_company_id,current_row.facility_id,p_actor_id)
    then raise exception 'draft contract access denied' using errcode = '42501'; end if;
  update public.contracts set contact_id = nullif(p_input->>'contact_id','')::uuid, title = trim(p_input->>'title'),
    value = (p_input->>'value')::numeric, start_date = (p_input->>'start_date')::date,
    end_date = (p_input->>'end_date')::date, payment_terms = nullif(trim(p_input->>'payment_terms'),''),
    notes = nullif(trim(p_input->>'notes'),'') where id = p_contract_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contract_updated', result.reference_number);
  return result;
end;
$$;

create or replace function public.transition_contract_atomic(p_company_id uuid, p_contract_id uuid, p_actor_id uuid,
  p_transition text, p_terminated_at date default null, p_reason text default null)
returns public.contracts language plpgsql security definer set search_path = public as $$
declare current_row public.contracts; result public.contracts; management_only boolean;
begin
  select * into current_row from public.contracts where id = p_contract_id and company_id = p_company_id and is_active for update;
  management_only := p_transition in ('completed','terminated');
  if not found or not public.can_manage_contract_facility(p_company_id,current_row.facility_id,p_actor_id,management_only)
    then raise exception 'contract transition denied' using errcode = '42501'; end if;
  if current_row.status <> (case when p_transition = 'active' then 'draft'::public.contract_status else 'active'::public.contract_status end)
    then raise exception 'invalid contract transition' using errcode = '23514'; end if;
  if p_transition = 'active' and current_row.document_path is null then raise exception 'signed document required' using errcode = '23514'; end if;
  if p_transition = 'terminated' and (p_terminated_at is null or p_terminated_at < current_row.start_date or nullif(trim(p_reason),'') is null)
    then raise exception 'termination date and reason required' using errcode = '23514'; end if;
  update public.contracts set status = p_transition::public.contract_status,
    terminated_at = case when p_transition = 'terminated' then p_terminated_at else terminated_at end,
    terminated_reason = case when p_transition = 'terminated' then trim(p_reason) else terminated_reason end
    where id = p_contract_id returning * into result;
  insert into public.facility_activity(company_id,facility_id,actor_id,event_type,new_value) values (
    p_company_id,result.facility_id,p_actor_id,
    case p_transition when 'active' then 'contract_activated'::public.facility_activity_type
      when 'completed' then 'contract_completed'::public.facility_activity_type else 'contract_terminated'::public.facility_activity_type end,
    result.reference_number || coalesce(' | ' || nullif(trim(p_reason),''),'')
  );
  return result;
end;
$$;

create or replace function public.create_contract_addendum_atomic(p_company_id uuid,p_contract_id uuid,p_actor_id uuid)
returns public.contracts language plpgsql security definer set search_path = public as $$
declare parent public.contracts; result public.contracts; root_id uuid;
begin
  select * into parent from public.contracts where id = p_contract_id and company_id = p_company_id and status = 'active' and is_active for update;
  if not found or not public.can_manage_contract_facility(p_company_id,parent.facility_id,p_actor_id) then raise exception 'addendum denied' using errcode = '42501'; end if;
  root_id := coalesce(parent.root_contract_id,parent.id);
  insert into public.contracts(company_id,facility_id,contact_id,created_by,root_contract_id,parent_contract_id,title,value,
    start_date,end_date,payment_terms,version,notes)
  values(p_company_id,parent.facility_id,parent.contact_id,p_actor_id,root_id,parent.id,parent.title,parent.value,
    parent.start_date,parent.end_date,parent.payment_terms,parent.version + 1,parent.notes) returning * into result;
  update public.contracts set is_superseded = true where id = parent.id;
  insert into public.facility_activity(company_id,facility_id,actor_id,event_type,new_value)
    values(p_company_id,parent.facility_id,p_actor_id,'contract_addended',result.reference_number || ' | v' || result.version);
  return result;
end;
$$;

create or replace function public.set_contract_chain_active_atomic(p_company_id uuid,p_contract_id uuid,p_actor_id uuid,p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
declare target public.contracts; root_id uuid;
begin
  select * into target from public.contracts where id = p_contract_id and company_id = p_company_id;
  if not found or not public.can_manage_contract_facility(p_company_id,target.facility_id,p_actor_id,p_active)
    then raise exception 'contract archival denied' using errcode = '42501'; end if;
  root_id := coalesce(target.root_contract_id,target.id);
  update public.contracts set is_active = p_active, archived_at = case when p_active then null else now() end,
    archived_by = case when p_active then null else p_actor_id end
    where company_id = p_company_id and (id = root_id or root_contract_id = root_id);
  insert into public.facility_activity(company_id,facility_id,actor_id,event_type,new_value) values(
    p_company_id,target.facility_id,p_actor_id,
    case when p_active then 'contract_recovered'::public.facility_activity_type else 'contract_archived'::public.facility_activity_type end,
    target.reference_number);
end;
$$;

alter table public.contracts enable row level security;
alter table public.contract_sequence_counters enable row level security;

create policy contracts_select on public.contracts for select to authenticated using (
  company_id = coalesce(case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id',true),'')::uuid end,public.jwt_company_id())
  and exists(select 1 from public.facilities f where f.id = contracts.facility_id and f.company_id = contracts.company_id
    and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);
create policy contracts_insert on public.contracts for insert to authenticated with check (
  status = 'draft' and created_by = auth.uid() and company_id = coalesce(case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id',true),'')::uuid end,public.jwt_company_id())
  and exists(select 1 from public.facilities f where f.id = contracts.facility_id and f.company_id = contracts.company_id and f.is_active
    and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);
create policy contracts_update on public.contracts for update to authenticated using (
  company_id = coalesce(case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id',true),'')::uuid end,public.jwt_company_id())
  and exists(select 1 from public.facilities f where f.id = contracts.facility_id and f.company_id = contracts.company_id and f.is_active
    and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and contracts.status = 'draft' and contracts.created_by = auth.uid())))
) with check (company_id = coalesce(case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id',true),'')::uuid end,public.jwt_company_id()));
revoke delete on public.contracts from authenticated,anon;
revoke all on public.contract_sequence_counters from authenticated,anon;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('contracts','contracts',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy contract_documents_select on storage.objects for select to authenticated using (
  bucket_id = 'contracts' and name like 'company_' || public.jwt_company_id()::text || '/contracts/%'
  and exists(select 1 from public.contracts c join public.facilities f on f.id = c.facility_id
    where c.id = substring(name from '^company_[^/]+/contracts/([0-9a-f-]{36})/')::uuid
      and c.company_id = public.jwt_company_id() and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);
create policy contract_documents_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'contracts' and name like 'company_' || public.jwt_company_id()::text || '/contracts/%'
  and exists(select 1 from public.contracts c join public.facilities f on f.id = c.facility_id
    where c.id = substring(name from '^company_[^/]+/contracts/([0-9a-f-]{36})/')::uuid
      and c.company_id = public.jwt_company_id() and c.status = 'draft'
      and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and c.created_by = auth.uid())))
);
create policy contract_documents_update on storage.objects for update to authenticated using (
  bucket_id = 'contracts' and name like 'company_' || public.jwt_company_id()::text || '/contracts/%'
  and exists(select 1 from public.contracts c join public.facilities f on f.id = c.facility_id
    where c.id = substring(name from '^company_[^/]+/contracts/([0-9a-f-]{36})/')::uuid
      and c.company_id = public.jwt_company_id() and c.status = 'draft'
      and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and c.created_by = auth.uid())))
) with check (
  bucket_id = 'contracts' and name like 'company_' || public.jwt_company_id()::text || '/contracts/%'
  and exists(select 1 from public.contracts c join public.facilities f on f.id = c.facility_id
    where c.id = substring(name from '^company_[^/]+/contracts/([0-9a-f-]{36})/')::uuid
      and c.company_id = public.jwt_company_id() and c.status = 'draft'
      and (public.jwt_role() <> 'sales_user' or (f.assigned_to = auth.uid() and c.created_by = auth.uid())))
);
revoke delete on storage.objects from authenticated,anon;

grant execute on function public.create_contract_atomic(uuid,uuid,jsonb) to authenticated;
grant execute on function public.update_draft_contract_atomic(uuid,uuid,uuid,jsonb) to authenticated;
grant execute on function public.transition_contract_atomic(uuid,uuid,uuid,text,date,text) to authenticated;
grant execute on function public.create_contract_addendum_atomic(uuid,uuid,uuid) to authenticated;
grant execute on function public.set_contract_chain_active_atomic(uuid,uuid,uuid,boolean) to authenticated;
