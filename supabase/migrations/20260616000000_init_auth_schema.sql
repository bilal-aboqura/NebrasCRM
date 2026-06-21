create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin', 'company_admin', 'supervisor', 'sales_user');
create type public.audit_event as enum ('login', 'logout', 'failed_login', 'company_switch');
create type public.audit_outcome as enum ('success', 'failure', 'throttled');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id),
  email text not null unique,
  full_name text not null default '',
  role public.app_role not null default 'sales_user',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint non_super_admin_has_company check (role = 'super_admin' or company_id is not null)
);

create table public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_address inet,
  attempted_at timestamptz not null default now(),
  successful boolean not null
);
create index login_attempts_cooldown_idx on public.login_attempts (lower(email), attempted_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_company_id uuid references public.companies(id) on delete set null,
  event_type public.audit_event not null,
  target_company_id uuid references public.companies(id) on delete set null,
  source_ip inet,
  outcome public.audit_outcome not null,
  timestamp timestamptz not null default now()
);
create index audit_logs_company_time_idx on public.audit_logs (actor_company_id, timestamp desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, company_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_id', '')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'sales_user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  claims jsonb;
  profile public.profiles%rowtype;
begin
  select * into profile from public.profiles where id = (event ->> 'user_id')::uuid;
  claims := event -> 'claims';
  if profile.id is not null then
    claims := jsonb_set(claims, '{company_id}', coalesce(to_jsonb(profile.company_id), 'null'::jsonb));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(profile.role::text));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

create or replace function public.jwt_role()
returns public.app_role
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'user_role', auth.jwt() -> 'user_metadata' ->> 'role')::public.app_role
$$;

create or replace function public.jwt_company_id()
returns uuid
language sql stable
as $$
  select nullif(coalesce(auth.jwt() ->> 'company_id', auth.jwt() -> 'user_metadata' ->> 'company_id'), '')::uuid
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable as $$ select public.jwt_role() = 'super_admin' $$;
