-- T003: Schema extensions, status columns, lockout prevention, audit triggers

-- ============================================================
-- Companies: add contact and status columns
-- ============================================================
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- Profiles: add display_name, status, updated_at
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- Audit Logs: add details jsonb column
-- ============================================================
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;

-- ============================================================
-- Last Active Super Admin Lockout Prevention Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION check_last_active_super_admin()
RETURNS trigger AS $$
DECLARE
  active_super_admins_count integer;
BEGIN
  PERFORM id FROM public.profiles
  WHERE role = 'super_admin' AND status = 'active'
  FOR UPDATE;

  SELECT count(*) INTO active_super_admins_count
  FROM public.profiles
  WHERE role = 'super_admin' AND status = 'active';

  IF active_super_admins_count = 0 THEN
    RAISE EXCEPTION 'يجب أن يكون هناك مشرف عام نشط واحد على الأقل في النظام'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_super_admin_lockout ON public.profiles;
CREATE TRIGGER tr_prevent_super_admin_lockout
AFTER UPDATE OF status, role ON public.profiles
FOR EACH ROW
WHEN (OLD.status = 'active' OR OLD.role = 'super_admin')
EXECUTE FUNCTION check_last_active_super_admin();

-- ============================================================
-- Field-Level Audit Log Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION audit_resource_changes()
RETURNS trigger AS $$
DECLARE
  diff jsonb := '{}'::jsonb;
  r RECORD;
  val_old text;
  val_new text;
BEGIN
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME AND table_schema = 'public'
      AND column_name NOT IN ('password_hash', 'invitation_token', 'updated_at', 'created_at')
  LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', r.column_name, r.column_name)
      USING OLD, NEW
      INTO val_old, val_new;

    IF val_old IS DISTINCT FROM val_new THEN
      diff := diff || jsonb_build_object(r.column_name, jsonb_build_object('old', val_old, 'new', val_new));
    END IF;
  END LOOP;

  IF diff != '{}'::jsonb THEN
    INSERT INTO public.audit_logs (
      actor_user_id,
      actor_company_id,
      event_type,
      target_company_id,
      details,
      timestamp
    ) VALUES (
      auth.uid(),
      (auth.jwt() ->> 'company_id')::uuid,
      TG_TABLE_NAME || '_update',
      COALESCE(NEW.company_id, NEW.id),
      diff,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_profiles_update ON public.profiles;
CREATE TRIGGER audit_profiles_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION audit_resource_changes();

DROP TRIGGER IF EXISTS audit_companies_update ON public.companies;
CREATE TRIGGER audit_companies_update
AFTER UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION audit_resource_changes();

-- ============================================================
-- RLS Policies for Feature 002
-- ============================================================

-- Companies INSERT/UPDATE: Super Admin only
DROP POLICY IF EXISTS companies_insert_policy ON public.companies;
CREATE POLICY companies_insert_policy ON public.companies
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

DROP POLICY IF EXISTS companies_update_policy ON public.companies;
CREATE POLICY companies_update_policy ON public.companies
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'super_admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

-- Profiles: Super Admin sees all, Company Admin sees own company, users see own
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() ->> 'role' = 'company_admin' AND company_id = public.get_active_company_id())
    OR id = auth.uid()
  );

DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() ->> 'role' = 'company_admin' AND company_id = (auth.jwt() ->> 'company_id')::uuid)
  );

DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() ->> 'role' = 'company_admin' AND company_id = (auth.jwt() ->> 'company_id')::uuid AND role != 'super_admin')
    OR id = auth.uid()
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() ->> 'role' = 'company_admin' AND company_id = (auth.jwt() ->> 'company_id')::uuid AND role != 'super_admin')
    OR id = auth.uid()
  );
