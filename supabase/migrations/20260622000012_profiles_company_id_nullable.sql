-- Allow NULL company_id on profiles so super_admin users (who are
-- cross-company) can be created without a company assignment.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'company_id' and is_nullable = 'NO'
  ) then
    alter table public.profiles alter column company_id drop not null;
  end if;
end;
$$;
