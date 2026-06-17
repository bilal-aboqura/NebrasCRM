alter table public.companies enable row level security;
alter table public.profiles enable row level security;

drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
for select using (public.is_super_admin() or id = public.current_company_id());

drop policy if exists companies_modify_super_admin on public.companies;
create policy companies_modify_super_admin on public.companies
for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select using (public.is_super_admin() or company_id = public.current_company_id() or id = auth.uid());

drop policy if exists profiles_modify_admin on public.profiles;
create policy profiles_modify_admin on public.profiles
for all using (public.is_super_admin() or company_id = public.current_company_id()) with check (public.is_super_admin() or company_id = public.current_company_id());
