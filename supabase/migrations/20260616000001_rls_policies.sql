-- T019: RLS policies for tenant data isolation

-- ============================================================
-- Companies
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_select_policy ON public.companies
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR id = public.get_active_company_id()
  );

CREATE POLICY companies_insert_policy ON public.companies
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY companies_update_policy ON public.companies
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'super_admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY companies_delete_policy ON public.companies
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ============================================================
-- Profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() ->> 'role' IN ('company_admin', 'supervisor') AND company_id = public.get_active_company_id())
    OR id = auth.uid()
  );

-- ============================================================
-- Login Attempts
-- ============================================================
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Server-side service-role only; no client policies

-- ============================================================
-- Audit Logs
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select_policy ON public.audit_logs
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() ->> 'role' = 'company_admin' AND actor_company_id = public.get_active_company_id())
  );

CREATE POLICY audit_logs_insert_policy ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
