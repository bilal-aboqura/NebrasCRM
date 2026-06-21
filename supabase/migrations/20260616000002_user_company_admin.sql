alter type public.audit_event add value if not exists 'company_create';
alter type public.audit_event add value if not exists 'company_update';
alter type public.audit_event add value if not exists 'user_invite';
alter type public.audit_event add value if not exists 'profile_update';
alter type public.audit_event add value if not exists 'unauthorized_admin_attempt';

alter table public.companies
  add column name_ar text,
  add column contact_email text,
  add column contact_phone text,
  add column status text not null default 'active' check (status in ('active', 'inactive')),
  add column updated_at timestamptz not null default now();
update public.companies set name_ar = name, status = case when active then 'active' else 'inactive' end;
alter table public.companies alter column name_ar set not null;
create unique index companies_name_ar_unique on public.companies (lower(name_ar));

alter table public.profiles
  add column display_name text,
  add column status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  add column updated_at timestamptz not null default now();
update public.profiles set display_name = full_name, status = case when active then 'active' else 'inactive' end;
alter table public.profiles alter column display_name set not null;

alter table public.audit_logs add column details jsonb not null default '{}'::jsonb;

create table public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.user_invitations enable row level security;

create or replace function public.sync_admin_fields()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_table_name = 'companies' then
    new.name_ar := coalesce(new.name_ar, new.name);
    new.name := new.name_ar;
    new.active := new.status = 'active';
  else
    new.display_name := coalesce(new.display_name, new.full_name);
    new.full_name := new.display_name;
    new.active := new.status = 'active';
  end if;
  return new;
end;
$$;

create trigger sync_company_admin_fields before insert or update on public.companies
for each row execute function public.sync_admin_fields();
create trigger sync_profile_admin_fields before insert or update on public.profiles
for each row execute function public.sync_admin_fields();

create or replace function public.prevent_last_super_admin_lockout()
returns trigger language plpgsql security definer set search_path = '' as $$
declare active_count integer;
begin
  if old.role = 'super_admin' and old.status = 'active'
     and (new.role <> 'super_admin' or new.status <> 'active') then
    perform id from public.profiles where role = 'super_admin' and status = 'active' for update;
    select count(*) into active_count from public.profiles
      where role = 'super_admin' and status = 'active' and id <> old.id;
    if active_count = 0 then
      raise exception 'يجب أن يكون هناك مشرف عام نشط واحد على الأقل في النظام' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger prevent_super_admin_lockout before update of status, role on public.profiles
for each row execute function public.prevent_last_super_admin_lockout();

create or replace function public.enforce_profile_update_boundary()
returns trigger language plpgsql security definer set search_path = '' as $$
declare caller_role text := coalesce(auth.jwt() ->> 'user_role', auth.jwt() -> 'user_metadata' ->> 'role');
declare caller_company uuid := nullif(coalesce(auth.jwt() ->> 'company_id', auth.jwt() -> 'user_metadata' ->> 'company_id'), '')::uuid;
begin
  if auth.role() = 'service_role' then return new; end if;
  if auth.uid() = old.id and caller_role not in ('super_admin', 'company_admin') then
    if new.company_id is distinct from old.company_id or new.role is distinct from old.role
       or new.status is distinct from old.status or new.email is distinct from old.email then
      raise exception 'profile privilege fields cannot be changed' using errcode = '42501';
    end if;
  elsif caller_role = 'company_admin' then
    if old.company_id is distinct from caller_company or new.company_id is distinct from old.company_id
       or new.role = 'super_admin' or old.role = 'super_admin' then
      raise exception 'cross-tenant or privileged profile update denied' using errcode = '42501';
    end if;
  elsif caller_role <> 'super_admin' then
    raise exception 'profile update denied' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger enforce_profile_update before update on public.profiles
for each row execute function public.enforce_profile_update_boundary();

create or replace function public.audit_admin_resource_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_data jsonb := to_jsonb(old) - array['created_at','updated_at'];
declare new_data jsonb := to_jsonb(new) - array['created_at','updated_at'];
declare key text;
declare diff jsonb := '{}'::jsonb;
declare tenant_id uuid;
begin
  for key in select jsonb_object_keys(new_data) loop
    if old_data -> key is distinct from new_data -> key then
      diff := diff || jsonb_build_object(key, jsonb_build_object('old', old_data -> key, 'new', new_data -> key));
    end if;
  end loop;
  if diff <> '{}'::jsonb then
    if tg_table_name = 'companies' then
      tenant_id := new.id;
    else
      tenant_id := new.company_id;
    end if;
    insert into public.audit_logs (actor_user_id, actor_company_id, event_type, target_company_id, outcome, details)
    values (
      auth.uid(),
      nullif(coalesce(auth.jwt() ->> 'company_id', auth.jwt() -> 'user_metadata' ->> 'company_id'), '')::uuid,
      case when tg_table_name = 'companies' then 'company_update'::public.audit_event else 'profile_update'::public.audit_event end,
      tenant_id, 'success', diff
    );
  end if;
  return new;
end;
$$;
create trigger audit_company_changes after update on public.companies
for each row execute function public.audit_admin_resource_change();
create trigger audit_profile_changes after update on public.profiles
for each row execute function public.audit_admin_resource_change();

create or replace function public.revoke_user_sessions(target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service role required' using errcode = '42501'; end if;
  delete from auth.refresh_tokens where user_id = target_user_id::text;
  delete from auth.sessions where user_id = target_user_id;
end;
$$;
revoke execute on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  public.is_super_admin()
  or id = auth.uid()
  or (public.jwt_role() in ('company_admin', 'supervisor') and company_id = public.jwt_company_id())
);
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_super_admin() or (public.jwt_role() = 'company_admin' and company_id = public.jwt_company_id()))
  with check (public.is_super_admin() or (public.jwt_role() = 'company_admin' and company_id = public.jwt_company_id() and role <> 'super_admin'));
