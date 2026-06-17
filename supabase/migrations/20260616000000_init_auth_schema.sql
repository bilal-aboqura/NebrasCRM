create extension if not exists "uuid-ossp";

do $$ begin
  create type public.app_role as enum ('super_admin', 'company_admin', 'supervisor', 'sales_user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.company_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('invited', 'active', 'inactive');
exception when duplicate_object then null; end $$;

create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  status public.company_status not null default 'active',
  city text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  company_id uuid references public.companies(id),
  email text not null unique,
  display_name text not null,
  role public.app_role not null default 'sales_user',
  status public.user_status not null default 'invited',
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.login_attempts (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid,
  actor_id uuid,
  entity_table text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_app_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', 'sales_user')
$$;

create or replace function public.current_company_id()
returns uuid language sql stable as $$
  select nullif(coalesce(auth.jwt() -> 'app_metadata' ->> 'company_id', auth.jwt() ->> 'company_id'), '')::uuid
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable as $$
  select public.current_app_role() = 'super_admin'
$$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, company_id, email, display_name, role, status)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'company_id', '')::uuid,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'sales_user')::public.app_role,
    'active'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  claims jsonb;
  profile_row public.profiles;
begin
  select * into profile_row from public.profiles where id = (event ->> 'user_id')::uuid;
  claims := event -> 'claims';
  if profile_row.id is not null then
    claims := jsonb_set(claims, '{company_id}', to_jsonb(profile_row.company_id));
    claims := jsonb_set(claims, '{role}', to_jsonb(profile_row.role));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;
