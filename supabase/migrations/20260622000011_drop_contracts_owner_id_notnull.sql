-- Drop NOT NULL on legacy contracts.owner_id so inserts that use created_by work.
-- Data was already backfilled from owner_id → created_by in migration 010.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts'
      and column_name = 'owner_id' and is_nullable = 'NO'
  ) then
    alter table public.contracts alter column owner_id drop not null;
  end if;
end;
$$;
