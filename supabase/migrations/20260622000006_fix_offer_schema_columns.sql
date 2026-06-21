-- ============================================================================
-- Fix offer schema column mismatches
-- ============================================================================
-- The live offers table was created with a different column naming convention
-- than what migration 20260617000008 expected. This migration bridges the gap:
--
--   Live DB column  ->  Expected column
--   discount        ->  discount_amount
--   tax             ->  tax_amount
--   owner_id        ->  created_by (inserted by functions as p_actor_id)
--
-- Strategy:
--   1. Add the new-name columns if missing (additive, safe)
--   2. Backfill them from old columns
--   3. Set owner_id default = created_by so inserts that omit owner_id work
--   4. Fix calculate_offer_totals to write to both old + new column names
-- ============================================================================

-- 1. Add canonical columns expected by the stored functions
alter table public.offers
  add column if not exists discount_amount numeric(15,2) not null default 0,
  add column if not exists tax_amount      numeric(15,2) not null default 0;

-- 2. Backfill new columns from old column values
update public.offers
set discount_amount = coalesce(discount, 0),
    tax_amount      = coalesce(tax, 0)
where discount_amount = 0 or tax_amount = 0;

-- 3. Make owner_id default to created_by so existing inserts keep working.
--    The create_offer_atomic function inserts `created_by = p_actor_id` but
--    the live table also needs owner_id (NOT NULL). Add a trigger to auto-fill it.
create or replace function public.sync_offer_owner_fields()
returns trigger language plpgsql as $$
begin
  -- If owner_id not supplied but created_by is, copy it across
  if new.owner_id is null and new.created_by is not null then
    new.owner_id := new.created_by;
  end if;
  -- If created_by not supplied but owner_id is, copy it across
  if new.created_by is null and new.owner_id is not null then
    new.created_by := new.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_offer_owner_fields on public.offers;
create trigger trg_sync_offer_owner_fields
  before insert on public.offers
  for each row execute function public.sync_offer_owner_fields();

-- 4. Replace calculate_offer_totals so it writes to both old and new columns
create or replace function public.calculate_offer_totals()
returns trigger language plpgsql as $$
begin
  new.title         := trim(new.title);
  new.notes         := nullif(trim(new.notes), '');
  new.decision_note := nullif(trim(new.decision_note), '');

  -- Calculate discount
  if new.discount_type = 'percentage' then
    if new.discount_value > 100 then
      raise exception 'percentage discount cannot exceed 100' using errcode = '23514';
    end if;
    new.discount_amount := round(new.subtotal * new.discount_value / 100, 2);
  else
    new.discount_amount := round(new.discount_value, 2);
  end if;

  if new.discount_amount > new.subtotal then
    raise exception 'discount cannot exceed subtotal' using errcode = '23514';
  end if;

  -- Keep legacy column name in sync
  new.discount := new.discount_amount;

  -- Calculate tax and totals
  new.tax_amount  := round((new.subtotal - new.discount_amount) * new.tax_rate / 100, 2);
  new.tax         := new.tax_amount;
  new.grand_total := round(new.subtotal - new.discount_amount + new.tax_amount, 2);
  new.total       := new.grand_total;
  new.updated_at  := now();

  return new;
end;
$$;
