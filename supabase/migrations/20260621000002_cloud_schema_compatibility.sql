-- Reconcile production objects created by earlier revisions of migrations 003/008/009.
-- All changes are additive so existing CRM records remain intact.

create or replace function public.facility_owner_cascade_followups()
returns trigger language plpgsql as $$
begin
  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    update public.followups
      set assigned_to = new.assigned_to
      where facility_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

alter table public.companies add column if not exists name_ar text;
alter table public.companies add column if not exists active boolean;
alter table public.companies add column if not exists whatsapp_template text;
alter table public.companies add column if not exists settings jsonb not null default '{}'::jsonb;
update public.companies set name_ar = coalesce(name_ar, name), active = (status = 'active');

do $$
declare had_is_active boolean;
begin
  select exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'facilities' and column_name = 'is_active') into had_is_active;
  alter table public.facilities add column if not exists is_active boolean not null default true;
  alter table public.facilities add column if not exists is_archived boolean not null default false;
  if had_is_active then
    update public.facilities set is_archived = not is_active;
  else
    update public.facilities set is_active = not is_archived;
  end if;
end;
$$;

create or replace function public.sync_facility_archive_compatibility()
returns trigger language plpgsql as $$
begin
  if new.is_active is distinct from old.is_active then
    new.is_archived := not new.is_active;
  elsif new.is_archived is distinct from old.is_archived then
    new.is_active := not new.is_archived;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_facility_archive_compatibility on public.facilities;
create trigger sync_facility_archive_compatibility
before update of is_active, is_archived on public.facilities
for each row execute function public.sync_facility_archive_compatibility();

do $$
declare had_grand_total boolean;
begin
  select exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'offers' and column_name = 'grand_total') into had_grand_total;
  alter table public.offers add column if not exists grand_total numeric(15,2) not null default 0;
  alter table public.offers add column if not exists total numeric(15,2) not null default 0;
  if had_grand_total then
    update public.offers set total = grand_total;
  else
    update public.offers set grand_total = total;
  end if;
end;
$$;

create or replace function public.sync_offer_total_compatibility()
returns trigger language plpgsql as $$
begin
  if new.grand_total is distinct from old.grand_total then
    new.total := new.grand_total;
  elsif new.total is distinct from old.total then
    new.grand_total := new.total;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_offer_total_compatibility on public.offers;
create trigger sync_offer_total_compatibility
before update of grand_total, total on public.offers
for each row execute function public.sync_offer_total_compatibility();

alter table public.contracts add column if not exists is_superseded boolean not null default false;
