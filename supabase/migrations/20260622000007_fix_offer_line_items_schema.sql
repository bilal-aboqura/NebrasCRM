-- ============================================================================
-- Fix offer_line_items schema column mismatches
-- ============================================================================
-- The live offer_line_items table was created with a different schema:
--   - Missing 'ordering' column (used by insert_offer_line_items for sort order)
--   - Missing 'created_at' column
--   - 'amount' is a GENERATED column (quantity * unit_price), not a plain column
--
-- Strategy:
--   1. Add missing ordering + created_at columns (idempotent)
--   2. Replace insert_offer_line_items to insert unit_price=amount_value,
--      quantity=1 instead of inserting amount directly (generated columns
--      cannot be set explicitly)
-- ============================================================================

do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'offer_line_items'
                 and column_name = 'ordering') then
    alter table public.offer_line_items add column ordering integer not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'offer_line_items'
                 and column_name = 'created_at') then
    alter table public.offer_line_items add column created_at timestamptz not null default now();
  end if;
end $$;
