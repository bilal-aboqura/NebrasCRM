create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  name text not null,
  title text not null,
  phone text not null,
  email text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contacts_one_primary_per_facility
on public.contacts(facility_id) where is_primary and is_active;

create or replace function public.contacts_before_write()
returns trigger language plpgsql as $$
begin
  new.phone := public.normalize_saudi_phone(new.phone);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_contacts_before_write on public.contacts;
create trigger trg_contacts_before_write before insert or update on public.contacts
for each row execute function public.contacts_before_write();

alter table public.contacts enable row level security;
