alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.login_attempts enable row level security;
alter table public.audit_logs enable row level security;

create policy companies_select on public.companies for select to authenticated
  using (public.is_super_admin() or id = public.jwt_company_id());
create policy companies_manage on public.companies for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy profiles_select on public.profiles for select to authenticated
  using (
    public.is_super_admin()
    or id = auth.uid()
    or (public.jwt_role() in ('company_admin', 'supervisor') and company_id = public.jwt_company_id())
  );

create policy audit_logs_select on public.audit_logs for select to authenticated
  using (public.is_super_admin() or (public.jwt_role() = 'company_admin' and actor_company_id = public.jwt_company_id()));
create policy audit_logs_insert on public.audit_logs for insert to authenticated
  with check (actor_user_id = auth.uid() and (public.is_super_admin() or actor_company_id = public.jwt_company_id()));

revoke update, delete on public.audit_logs from authenticated, anon;

