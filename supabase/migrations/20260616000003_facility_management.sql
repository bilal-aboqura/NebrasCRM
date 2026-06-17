do $$ begin
  create type public.facility_status as enum ('new', 'contacted', 'qualified', 'proposal', 'contract', 'lost');
exception when duplicate_object then null; end $$;

create table if not exists public.regions (id text primary key, name_ar text not null);
create table if not exists public.cities (id text primary key, region_id text references public.regions(id), name_ar text not null);

create table if not exists public.facilities (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  name text not null,
  type text not null,
  city text not null,
  region text not null,
  primary_phone text not null,
  secondary_phone text,
  owner_id uuid references public.profiles(id),
  status public.facility_status not null default 'new',
  is_active boolean not null default true,
  lost_reason text,
  status_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, primary_phone)
);

create table if not exists public.facility_activity (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  kind text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.normalize_saudi_phone(value text)
returns text language sql immutable as $$
  select case
    when regexp_replace(value, '\D', '', 'g') like '966%' then '+' || regexp_replace(value, '\D', '', 'g')
    when regexp_replace(value, '\D', '', 'g') like '05%' then '+966' || substr(regexp_replace(value, '\D', '', 'g'), 2)
    else '+' || regexp_replace(value, '\D', '', 'g')
  end
$$;

create or replace function public.facilities_before_write()
returns trigger language plpgsql as $$
begin
  new.primary_phone := public.normalize_saudi_phone(new.primary_phone);
  new.updated_at := now();
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_facilities_before_write on public.facilities;
create trigger trg_facilities_before_write before insert or update on public.facilities
for each row execute function public.facilities_before_write();

alter table public.facilities enable row level security;
alter table public.facility_activity enable row level security;
