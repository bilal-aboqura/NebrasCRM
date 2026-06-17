do $$ begin
  create type public.offer_status as enum ('draft', 'sent', 'accepted', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.discount_type as enum ('fixed', 'percentage');
exception when duplicate_object then null; end $$;

create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  facility_id uuid not null references public.facilities(id),
  contact_id uuid references public.contacts(id),
  owner_id uuid not null references public.profiles(id),
  root_offer_id uuid references public.offers(id),
  parent_offer_id uuid references public.offers(id),
  title text not null,
  version integer not null default 1,
  status public.offer_status not null default 'draft',
  discount_type public.discount_type not null default 'fixed',
  discount_value numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 15,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  valid_until date not null,
  notes text,
  is_superseded boolean not null default false,
  is_active boolean not null default true,
  sent_at timestamptz,
  decision_at timestamptz,
  decision_note text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique(company_id, root_offer_id, version)
);

create table if not exists public.offer_line_items (
  id uuid primary key default uuid_generate_v4(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) generated always as (quantity * unit_price) stored
);

create or replace function public.update_offer_subtotal_on_line_item_change()
returns trigger language plpgsql as $$
declare target_offer uuid;
begin
  target_offer := coalesce(new.offer_id, old.offer_id);
  update public.offers set subtotal = coalesce((select sum(amount) from public.offer_line_items where offer_id = target_offer), 0) where id = target_offer;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_update_offer_subtotal on public.offer_line_items;
create trigger trg_update_offer_subtotal after insert or update or delete on public.offer_line_items
for each row execute function public.update_offer_subtotal_on_line_item_change();

create or replace function public.calculate_offer_totals()
returns trigger language plpgsql as $$
begin
  new.discount := case when new.discount_type = 'percentage' then new.subtotal * (new.discount_value / 100) else new.discount_value end;
  if new.discount > new.subtotal then raise exception 'Discount amount cannot exceed subtotal'; end if;
  new.tax := (new.subtotal - new.discount) * (new.tax_rate / 100);
  new.total := new.subtotal - new.discount + new.tax;
  return new;
end;
$$;

drop trigger if exists trg_calculate_offer_totals on public.offers;
create trigger trg_calculate_offer_totals before insert or update on public.offers
for each row execute function public.calculate_offer_totals();

create or replace function public.validate_offer_and_immutability()
returns trigger language plpgsql as $$
begin
  if new.contact_id is not null and not exists (select 1 from public.contacts where id = new.contact_id and facility_id = new.facility_id) then
    raise exception 'contact must belong to facility';
  end if;
  if tg_op = 'UPDATE' and old.status <> 'draft' and (
    old.title is distinct from new.title or old.subtotal is distinct from new.subtotal or old.discount_value is distinct from new.discount_value or old.tax_rate is distinct from new.tax_rate
  ) then
    raise exception 'Cannot modify priced or core content of an offer that has already been sent.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_offer_and_immutability on public.offers;
create trigger trg_validate_offer_and_immutability before insert or update on public.offers
for each row execute function public.validate_offer_and_immutability();

alter table public.offers enable row level security;
alter table public.offer_line_items enable row level security;
