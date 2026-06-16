# Data Model: User and Company Administration

This document describes the schema extensions, RLS policies, and database triggers for Feature 002, building upon the foundational schema established in Feature 001.

---

## 1. Schema Extensions (Migrations)

### 1.1 `public.companies`
Extended to support status and contact information.
```sql
ALTER TABLE public.companies 
ADD COLUMN contact_email text,
ADD COLUMN contact_phone text,
ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN updated_at timestamptz DEFAULT now();
```

### 1.2 `public.profiles`
Extended to support display names, active status, and timestamps.
```sql
ALTER TABLE public.profiles
ADD COLUMN display_name text NOT NULL DEFAULT '',
ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
ADD COLUMN updated_at timestamptz DEFAULT now();
```

### 1.3 `public.audit_logs`
Extended to hold detailed before/after field changes.
```sql
ALTER TABLE public.audit_logs
ADD COLUMN details jsonb DEFAULT '{}'::jsonb;
```

---

## 2. Database Functions & Triggers

### 2.1 Last Active Super Admin Lockout Prevention Trigger
This trigger executes on updates to the `profiles` or `companies` status to ensure that there is always at least one active Super Admin.
```sql
CREATE OR REPLACE FUNCTION check_last_active_super_admin()
RETURNS trigger AS $$
DECLARE
  active_super_admins_count integer;
BEGIN
  -- Row-level lock on active super admins to prevent concurrent deactivations
  PERFORM id FROM public.profiles 
  WHERE role = 'super_admin' AND status = 'active'
  FOR UPDATE;

  -- Count remaining active super admins
  SELECT count(*) INTO active_super_admins_count
  FROM public.profiles
  WHERE role = 'super_admin' AND status = 'active';

  -- If this update would result in 0 active super admins, block it
  IF active_super_admins_count = 0 THEN
    RAISE EXCEPTION 'يجب أن يكون هناك مشرف عام نشط واحد على الأقل في النظام'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile updates
CREATE TRIGGER tr_prevent_super_admin_lockout
AFTER UPDATE OF status, role ON public.profiles
FOR EACH ROW
WHEN (OLD.status = 'active' OR OLD.role = 'super_admin')
EXECUTE FUNCTION check_last_active_super_admin();
```

### 2.2 Field-Level Audit Log Trigger
This trigger automatically captures field-level updates on `companies` and `profiles` and inserts them into `public.audit_logs`.
```sql
CREATE OR REPLACE FUNCTION audit_resource_changes()
RETURNS trigger AS $$
DECLARE
  diff jsonb := '{}'::jsonb;
  r RECORD;
  val_old text;
  val_new text;
BEGIN
  -- Determine changed fields (excluding password/hashes/keys)
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

  -- Write to audit log if changes detected
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
      COALESCE(NEW.company_id, NEW.id), -- Uses company_id for user profiles, id for companies
      diff,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind triggers
CREATE TRIGGER audit_profiles_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION audit_resource_changes();

CREATE TRIGGER audit_companies_update
AFTER UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION audit_resource_changes();
```

---

## 3. Row Level Security (RLS) Policies

### 3.1 `public.companies`
- **SELECT**:
  - `auth.jwt() ->> 'role' = 'super_admin'` OR `id = get_active_company_id()`
- **INSERT / UPDATE**:
  - `auth.jwt() ->> 'role' = 'super_admin'` (Only Super Admins can manage companies)

### 3.2 `public.profiles`
- **SELECT**:
  - `auth.jwt() ->> 'role' = 'super_admin'` (Sees all users)
  - `auth.jwt() ->> 'role' = 'company_admin' AND company_id = get_active_company_id()` (Sees own company's users)
  - `id = auth.uid()` (Sees own profile)
- **INSERT**:
  - `auth.jwt() ->> 'role' = 'super_admin'` (Creates any user)
  - `auth.jwt() ->> 'role' = 'company_admin' AND company_id = (auth.jwt() ->> 'company_id')::uuid` (Creates users for own company only)
- **UPDATE**:
  - `auth.jwt() ->> 'role' = 'super_admin'` (Updates any user)
  - `auth.jwt() ->> 'role' = 'company_admin' AND company_id = (auth.jwt() ->> 'company_id')::uuid AND role != 'super_admin'` (Updates own company users, cannot elevate to Super Admin)
  - `id = auth.uid()` (Updates own display name)
