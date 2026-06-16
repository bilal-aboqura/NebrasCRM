-- T006: Initial database schema
-- T007: Profiles table trigger (sync from auth.users on insert)
-- T008: Custom JWT claims hook to cache company_id and role

-- ============================================================
-- T006: Tables
-- ============================================================

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'company_admin', 'supervisor', 'sales_user')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  successful boolean NOT NULL
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('login', 'logout', 'failed_login', 'company_switch')),
  target_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  source_ip inet,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'throttled')),
  timestamp timestamptz DEFAULT now()
);

-- ============================================================
-- T007: Trigger to auto-create profile on auth.users insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, company_id, email, role)
  VALUES (
    NEW.id,
    (SELECT id FROM public.companies LIMIT 1),
    NEW.email,
    'sales_user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- T008: Custom JWT claims hook
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  user_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO user_profile FROM public.profiles WHERE id = (event ->> 'user_id')::uuid;
  IF user_profile.id IS NOT NULL THEN
    event := jsonb_set(event, '{claims, company_id}', to_jsonb(user_profile.company_id::text));
    event := jsonb_set(event, '{claims, role}', to_jsonb(user_profile.role));
  END IF;
  RETURN event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Helper: get_active_company_id for RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_active_company_id()
RETURNS uuid AS $$
BEGIN
  IF auth.jwt() ->> 'role' = 'super_admin' THEN
    RETURN NULLIF(current_setting('request.cookies.active_company_id', true), '')::uuid;
  END IF;
  RETURN (auth.jwt() ->> 'company_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- T027: Super Admin bypass rules (moved here for completeness)
-- However, the main RLS policies are in 20260616000001_rls_policies.sql
-- This function supports the super_admin company override
-- ============================================================
