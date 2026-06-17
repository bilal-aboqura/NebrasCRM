do $$ begin
  create type public.followup_status as enum ('pending', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.followup_type as enum ('call', 'visit', 'email', 'whatsapp');
exception when duplicate_object then null; end $$;

create table if not exists public.followups (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  contact_id uuid references public.contacts(id),
  owner_id uuid not null references public.profiles(id),
  type public.followup_type not null,
  status public.followup_status not null default 'pending',
  due_at timestamptz not null,
  outcome text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists followups_one_pending_per_facility_type
on public.followups(facility_id, type) where status = 'pending';

create or replace function public.followups_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_followups_updated_at on public.followups;
create trigger trg_followups_updated_at before update on public.followups
for each row execute function public.followups_updated_at();

create or replace function public.facility_owner_cascade_followups()
returns trigger language plpgsql as $$
begin
  if new.owner_id is distinct from old.owner_id and new.owner_id is not null then
    update public.followups set owner_id = new.owner_id where facility_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_facility_owner_cascade on public.facilities;
create trigger trg_facility_owner_cascade after update on public.facilities
for each row execute function public.facility_owner_cascade_followups();

alter table public.followups enable row level security;
