-- Legacy production has constraints with the expected names that PostgREST
-- cannot use as foreign-key relationships. Rebuild them explicitly.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'offers' and column_name = 'created_by'
  ) then
    alter table public.offers drop constraint if exists offers_created_by_fkey;
    alter table public.offers
      add constraint offers_created_by_fkey foreign key (created_by)
      references public.profiles(id) not valid;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'offers' and column_name = 'contact_id'
  ) then
    alter table public.offers drop constraint if exists offers_contact_id_fkey;
    alter table public.offers
      add constraint offers_contact_id_fkey foreign key (contact_id)
      references public.contacts(id) on delete set null not valid;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'created_by'
  ) then
    alter table public.contracts drop constraint if exists contracts_created_by_fkey;
    alter table public.contracts
      add constraint contracts_created_by_fkey foreign key (created_by)
      references public.profiles(id) not valid;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'contact_id'
  ) then
    alter table public.contracts drop constraint if exists contracts_contact_id_fkey;
    alter table public.contracts
      add constraint contracts_contact_id_fkey foreign key (contact_id)
      references public.contacts(id) on delete set null not valid;
  end if;
end $$;

notify pgrst, 'reload schema';
