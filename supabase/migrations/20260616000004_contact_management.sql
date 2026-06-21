alter type public.facility_activity_type add value if not exists 'contact_added';
alter type public.facility_activity_type add value if not exists 'contact_edited';
alter type public.facility_activity_type add value if not exists 'contact_archived';
alter type public.facility_activity_type add value if not exists 'contact_recovered';
alter type public.facility_activity_type add value if not exists 'primary_changed';
alter type public.facility_activity_type add value if not exists 'primary_cleared';

create unique index if not exists facilities_id_company_id_unique
  on public.facilities(id, company_id);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  name_ar varchar(150) not null check (length(trim(name_ar)) between 2 and 150),
  job_title varchar(100) not null check (length(trim(job_title)) between 2 and 100),
  primary_phone varchar(20) not null,
  primary_phone_normalized varchar(20) not null,
  secondary_phone varchar(20),
  email varchar(255) check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  is_primary boolean not null default false,
  notes text,
  is_archived boolean not null default false,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_facility_company_fk
    foreign key (facility_id, company_id) references public.facilities(id, company_id)
);

create index idx_contacts_company_id on public.contacts(company_id);
create index idx_contacts_facility_id on public.contacts(facility_id);
create unique index contacts_facility_primary_idx
  on public.contacts(facility_id) where is_primary and not is_archived;

create or replace function public.prepare_contact()
returns trigger language plpgsql as $$
begin
  new.name_ar := trim(new.name_ar);
  new.job_title := trim(new.job_title);
  new.primary_phone_normalized := public.normalize_saudi_phone(new.primary_phone);
  new.secondary_phone := nullif(trim(new.secondary_phone), '');
  new.email := nullif(lower(trim(new.email)), '');
  new.notes := nullif(trim(new.notes), '');
  if new.primary_phone_normalized !~ '^966(5[0-9]{8}|1[1-7][0-9]{7})$' then
    raise exception 'invalid Saudi phone' using errcode = '23514';
  end if;
  if new.is_archived then new.is_primary := false; end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger prepare_contact before insert or update on public.contacts
for each row execute function public.prepare_contact();

create or replace function public.contact_actor_can_manage(
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

create or replace function public.create_contact_atomic(
  p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_input jsonb
) returns public.contacts language plpgsql security definer set search_path = '' as $$
declare result public.contacts;
begin
  if not public.contact_actor_can_manage(p_actor_id, p_company_id, p_facility_id) then
    raise exception 'contact access denied' using errcode = '42501';
  end if;
  if coalesce((p_input->>'is_primary')::boolean, false) then
    update public.contacts set is_primary = false
      where facility_id = p_facility_id and company_id = p_company_id and is_primary;
  end if;
  insert into public.contacts (
    company_id, facility_id, name_ar, job_title, primary_phone, secondary_phone,
    email, is_primary, notes, created_by
  ) values (
    p_company_id, p_facility_id, p_input->>'name_ar', p_input->>'job_title',
    p_input->>'primary_phone', p_input->>'secondary_phone', p_input->>'email',
    coalesce((p_input->>'is_primary')::boolean, false), p_input->>'notes', p_actor_id
  ) returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, new_value)
    values (p_company_id, p_facility_id, p_actor_id, 'contact_added', result.name_ar || ' - ' || result.job_title);
  return result;
end;
$$;

create or replace function public.update_contact_atomic(
  p_company_id uuid, p_contact_id uuid, p_actor_id uuid, p_input jsonb
) returns public.contacts language plpgsql security definer set search_path = '' as $$
declare current_contact public.contacts; result public.contacts; old_primary text;
begin
  select * into current_contact from public.contacts
    where id = p_contact_id and company_id = p_company_id and not is_archived for update;
  if current_contact.id is null or not public.contact_actor_can_manage(p_actor_id, p_company_id, current_contact.facility_id) then
    raise exception 'contact access denied' using errcode = '42501';
  end if;
  if coalesce((p_input->>'is_primary')::boolean, current_contact.is_primary)
     and not current_contact.is_primary then
    select name_ar into old_primary from public.contacts
      where facility_id = current_contact.facility_id and is_primary and not is_archived for update;
    update public.contacts set is_primary = false
      where facility_id = current_contact.facility_id and company_id = p_company_id and is_primary;
  end if;
  update public.contacts set
    name_ar = coalesce(p_input->>'name_ar', name_ar),
    job_title = coalesce(p_input->>'job_title', job_title),
    primary_phone = coalesce(p_input->>'primary_phone', primary_phone),
    secondary_phone = case when p_input ? 'secondary_phone' then p_input->>'secondary_phone' else secondary_phone end,
    email = case when p_input ? 'email' then p_input->>'email' else email end,
    is_primary = coalesce((p_input->>'is_primary')::boolean, is_primary),
    notes = case when p_input ? 'notes' then p_input->>'notes' else notes end
  where id = p_contact_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contact_edited',
      jsonb_build_object('name_ar', current_contact.name_ar, 'job_title', current_contact.job_title,
        'primary_phone', current_contact.primary_phone, 'secondary_phone', current_contact.secondary_phone,
        'email', current_contact.email, 'notes', current_contact.notes)::text,
      jsonb_build_object('name_ar', result.name_ar, 'job_title', result.job_title,
        'primary_phone', result.primary_phone, 'secondary_phone', result.secondary_phone,
        'email', result.email, 'notes', result.notes)::text);
  if result.is_primary and not current_contact.is_primary then
    insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
      values (p_company_id, result.facility_id, p_actor_id, 'primary_changed', old_primary, result.name_ar);
  end if;
  return result;
end;
$$;

create or replace function public.archive_contact_atomic(
  p_company_id uuid, p_contact_id uuid, p_actor_id uuid
) returns public.contacts language plpgsql security definer set search_path = '' as $$
declare current_contact public.contacts; result public.contacts;
begin
  select * into current_contact from public.contacts
    where id = p_contact_id and company_id = p_company_id and not is_archived for update;
  if current_contact.id is null or not public.contact_actor_can_manage(p_actor_id, p_company_id, current_contact.facility_id) then
    raise exception 'contact access denied' using errcode = '42501';
  end if;
  update public.contacts set is_archived = true, is_primary = false,
    archived_at = now(), archived_by = p_actor_id where id = p_contact_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contact_archived', result.name_ar, 'مؤرشف');
  if current_contact.is_primary then
    insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
      values (p_company_id, result.facility_id, p_actor_id, 'primary_cleared', result.name_ar, null);
  end if;
  return result;
end;
$$;

create or replace function public.recover_contact_atomic(
  p_company_id uuid, p_contact_id uuid, p_actor_id uuid
) returns public.contacts language plpgsql security definer set search_path = '' as $$
declare current_contact public.contacts; result public.contacts;
begin
  select * into current_contact from public.contacts
    where id = p_contact_id and company_id = p_company_id and is_archived for update;
  if current_contact.id is null or not public.contact_actor_can_manage(p_actor_id, p_company_id, current_contact.facility_id, true) then
    raise exception 'contact recovery denied' using errcode = '42501';
  end if;
  update public.contacts set is_archived = false, is_primary = false,
    archived_at = null, archived_by = null where id = p_contact_id returning * into result;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
    values (p_company_id, result.facility_id, p_actor_id, 'contact_recovered', 'مؤرشف', result.name_ar);
  return result;
end;
$$;

alter table public.contacts enable row level security;
create policy contacts_select on public.contacts for select to authenticated using (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and (not is_archived or public.jwt_role() in ('super_admin', 'company_admin', 'supervisor'))
  and exists (
    select 1 from public.facilities f where f.id = contacts.facility_id and f.company_id = contacts.company_id
      and f.is_active and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid())
  )
);
create policy contacts_insert on public.contacts for insert to authenticated with check (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  ) and created_by = auth.uid()
  and exists (select 1 from public.facilities f where f.id = contacts.facility_id and f.company_id = contacts.company_id
    and f.is_active and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);
create policy contacts_update on public.contacts for update to authenticated using (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and (not is_archived or public.jwt_role() in ('super_admin', 'company_admin', 'supervisor'))
  and exists (select 1 from public.facilities f where f.id = contacts.facility_id and f.company_id = contacts.company_id
    and f.is_active and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
) with check (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and exists (select 1 from public.facilities f where f.id = contacts.facility_id and f.company_id = contacts.company_id
    and f.is_active and (public.jwt_role() <> 'sales_user' or f.assigned_to = auth.uid()))
);

revoke delete on public.contacts from authenticated, anon;
revoke execute on function public.contact_actor_can_manage(uuid, uuid, uuid, boolean) from public, authenticated, anon;
revoke execute on function public.create_contact_atomic(uuid, uuid, uuid, jsonb) from public, authenticated, anon;
revoke execute on function public.update_contact_atomic(uuid, uuid, uuid, jsonb) from public, authenticated, anon;
revoke execute on function public.archive_contact_atomic(uuid, uuid, uuid) from public, authenticated, anon;
revoke execute on function public.recover_contact_atomic(uuid, uuid, uuid) from public, authenticated, anon;
grant execute on function public.create_contact_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.update_contact_atomic(uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.archive_contact_atomic(uuid, uuid, uuid) to service_role;
grant execute on function public.recover_contact_atomic(uuid, uuid, uuid) to service_role;
