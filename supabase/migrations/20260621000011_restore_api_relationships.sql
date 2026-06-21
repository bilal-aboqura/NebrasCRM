-- Restore relationship metadata omitted by older production schemas.
-- NOT VALID preserves existing legacy rows while enforcing the relationship
-- for new writes and making it visible to PostgREST's schema cache.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'offers' and column_name = 'created_by'
  ) and not exists (
    select 1 from pg_constraint where conrelid = 'public.offers'::regclass and conname = 'offers_created_by_fkey'
  ) then
    alter table public.offers
      add constraint offers_created_by_fkey foreign key (created_by)
      references public.profiles(id) not valid;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'offers' and column_name = 'contact_id'
  ) and not exists (
    select 1 from pg_constraint where conrelid = 'public.offers'::regclass and conname = 'offers_contact_id_fkey'
  ) then
    alter table public.offers
      add constraint offers_contact_id_fkey foreign key (contact_id)
      references public.contacts(id) on delete set null not valid;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'created_by'
  ) and not exists (
    select 1 from pg_constraint where conrelid = 'public.contracts'::regclass and conname = 'contracts_created_by_fkey'
  ) then
    alter table public.contracts
      add constraint contracts_created_by_fkey foreign key (created_by)
      references public.profiles(id) not valid;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'contact_id'
  ) and not exists (
    select 1 from pg_constraint where conrelid = 'public.contracts'::regclass and conname = 'contracts_contact_id_fkey'
  ) then
    alter table public.contracts
      add constraint contracts_contact_id_fkey foreign key (contact_id)
      references public.contacts(id) on delete set null not valid;
  end if;
end $$;

notify pgrst, 'reload schema';
