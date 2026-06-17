do $$ begin
  create type public.contract_status as enum ('draft', 'active', 'completed', 'terminated', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.contract_sequence_counters (
  company_id uuid primary key references public.companies(id),
  current_value integer not null default 0
);

create table if not exists public.contracts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  facility_id uuid not null references public.facilities(id),
  offer_id uuid references public.offers(id),
  owner_id uuid not null references public.profiles(id),
  parent_contract_id uuid references public.contracts(id),
  reference_number text not null unique,
  title text,
  status public.contract_status not null default 'draft',
  value numeric(12,2) not null,
  start_date date,
  end_date date,
  document_path text,
  is_active boolean not null default true,
  termination_reason text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique(offer_id)
);

create or replace function public.generate_contract_reference_number()
returns trigger language plpgsql as $$
declare next_value integer;
begin
  insert into public.contract_sequence_counters(company_id, current_value) values (new.company_id, 0)
  on conflict (company_id) do nothing;
  update public.contract_sequence_counters set current_value = current_value + 1 where company_id = new.company_id returning current_value into next_value;
  new.reference_number := coalesce(new.reference_number, 'CON-' || extract(year from now())::int || '-' || lpad(next_value::text, 4, '0'));
  return new;
end;
$$;

drop trigger if exists trg_generate_contract_reference_number on public.contracts;
create trigger trg_generate_contract_reference_number before insert on public.contracts
for each row execute function public.generate_contract_reference_number();

create or replace function public.validate_contract_rules_and_immutability()
returns trigger language plpgsql as $$
begin
  if new.end_date is not null and new.start_date is not null and new.end_date <= new.start_date then
    raise exception 'end date must be after start date';
  end if;
  if tg_op = 'UPDATE' and old.status = 'active' and (old.value is distinct from new.value or old.start_date is distinct from new.start_date or old.end_date is distinct from new.end_date) then
    raise exception 'active contracts are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_contract_rules_and_immutability on public.contracts;
create trigger trg_validate_contract_rules_and_immutability before insert or update on public.contracts
for each row execute function public.validate_contract_rules_and_immutability();

insert into storage.buckets (id, name, public) values ('contracts', 'contracts', false)
on conflict (id) do nothing;

alter table public.contracts enable row level security;
