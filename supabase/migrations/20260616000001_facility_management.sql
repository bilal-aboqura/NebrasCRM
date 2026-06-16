-- T003/T004: Facility Management - schema, triggers, RLS, seed data

-- ============================================================
-- Custom ENUM types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE facility_type AS ENUM ('medical_complex', 'dental_complex', 'lab', 'radiology', 'hospital');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM ('manual', 'website_form', 'imported');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE facility_status AS ENUM ('new', 'contacted', 'interested', 'offer', 'negotiation', 'contract', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE facility_activity_type AS ENUM ('status_change', 'owner_change', 'archived', 'recovered', 'created', 'edited');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Regions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text UNIQUE NOT NULL,
  name_en text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Cities table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.regions(id),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Facilities table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name_ar text NOT NULL,
  type facility_type NOT NULL,
  region_id uuid NOT NULL REFERENCES public.regions(id),
  city_id uuid NOT NULL REFERENCES public.cities(id),
  city_custom text,
  primary_phone text NOT NULL,
  primary_phone_normalized text NOT NULL,
  secondary_phone text,
  lead_source lead_source NOT NULL DEFAULT 'manual',
  assigned_to uuid REFERENCES public.profiles(id),
  status facility_status NOT NULL DEFAULT 'new',
  notes text,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  archived_by uuid REFERENCES public.profiles(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- Facility Activity table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.facility_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  event_type facility_activity_type NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_facilities_company_id ON public.facilities(company_id);
CREATE INDEX IF NOT EXISTS idx_facilities_assigned_to ON public.facilities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_facilities_status ON public.facilities(status);
CREATE INDEX IF NOT EXISTS idx_facilities_region_city ON public.facilities(region_id, city_id);
CREATE INDEX IF NOT EXISTS idx_facility_activity_facility_id ON public.facility_activity(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_activity_company_id ON public.facility_activity(company_id);

-- ============================================================
-- Partial Unique Index for phone per company
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_facilities_phone_unique_per_company
  ON public.facilities (company_id, primary_phone_normalized)
  WHERE (is_archived = false AND primary_phone_normalized IS NOT NULL);

-- ============================================================
-- Phone Normalization Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION normalize_phone_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.primary_phone_normalized := (
    SELECT regexp_replace(
      CASE
        WHEN NEW.primary_phone ~ '^00' THEN substring(NEW.primary_phone FROM 3)
        WHEN NEW.primary_phone ~ '^\+' THEN substring(NEW.primary_phone FROM 2)
        ELSE NEW.primary_phone
      END,
      '\D', '', 'g'
    )
  );
  IF NEW.primary_phone_normalized ~ '^0' THEN
    NEW.primary_phone_normalized := '966' || substring(NEW.primary_phone_normalized FROM 2);
  END IF;
  IF NEW.primary_phone_normalized !~ '^966' THEN
    NEW.primary_phone_normalized := '966' || NEW.primary_phone_normalized;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_normalize_phone ON public.facilities;
CREATE TRIGGER tr_normalize_phone
  BEFORE INSERT OR UPDATE OF primary_phone ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION normalize_phone_trigger();

-- ============================================================
-- Updated At Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_facilities_updated_at ON public.facilities;
CREATE TRIGGER tr_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Activity logging trigger for facilities
-- ============================================================
CREATE OR REPLACE FUNCTION log_facility_activity()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.facility_activity (company_id, facility_id, actor_id, event_type)
    VALUES (NEW.company_id, NEW.id, NEW.created_by, 'created');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.facility_activity (company_id, facility_id, actor_id, event_type, old_value, new_value)
      VALUES (NEW.company_id, NEW.id, auth.uid(), 'status_change', OLD.status::text, NEW.status::text);
    END IF;
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO public.facility_activity (company_id, facility_id, actor_id, event_type, old_value, new_value)
      VALUES (NEW.company_id, NEW.id, auth.uid(), 'owner_change', OLD.assigned_to::text, NEW.assigned_to::text);
    END IF;
    IF OLD.is_archived IS DISTINCT FROM NEW.is_archived THEN
      INSERT INTO public.facility_activity (company_id, facility_id, actor_id, event_type)
      VALUES (NEW.company_id, NEW.id, auth.uid(), CASE WHEN NEW.is_archived THEN 'archived' ELSE 'recovered' END);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_facility_activity ON public.facilities;
CREATE TRIGGER tr_facility_activity
  AFTER INSERT OR UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION log_facility_activity();

-- ============================================================
-- RLS: Facilities
-- ============================================================
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS facilities_select_policy ON public.facilities;
CREATE POLICY facilities_select_policy ON public.facilities
  FOR SELECT
  USING (
    company_id = public.get_active_company_id()
    AND (
      (auth.jwt() ->> 'role' IN ('super_admin', 'company_admin', 'supervisor'))
      OR (auth.jwt() ->> 'role' = 'sales_user' AND assigned_to = auth.uid() AND is_archived = false)
    )
  );

DROP POLICY IF EXISTS facilities_insert_policy ON public.facilities;
CREATE POLICY facilities_insert_policy ON public.facilities
  FOR INSERT
  WITH CHECK (
    company_id = (auth.jwt() ->> 'company_id')::uuid
  );

DROP POLICY IF EXISTS facilities_update_policy ON public.facilities;
CREATE POLICY facilities_update_policy ON public.facilities
  FOR UPDATE
  USING (
    company_id = public.get_active_company_id()
    AND (
      (auth.jwt() ->> 'role' IN ('super_admin', 'company_admin', 'supervisor'))
      OR (auth.jwt() ->> 'role' = 'sales_user' AND assigned_to = auth.uid() AND is_archived = false)
    )
  );

-- ============================================================
-- RLS: Facility Activity
-- ============================================================
ALTER TABLE public.facility_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS facility_activity_select_policy ON public.facility_activity;
CREATE POLICY facility_activity_select_policy ON public.facility_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.facilities
      WHERE facilities.id = facility_activity.facility_id
    )
  );

DROP POLICY IF EXISTS facility_activity_insert_policy ON public.facility_activity;
CREATE POLICY facility_activity_insert_policy ON public.facility_activity
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.facilities
      WHERE facilities.id = facility_activity.facility_id
      AND facilities.company_id = public.get_active_company_id()
    )
  );

-- ============================================================
-- Seed: Saudi Regions
-- ============================================================
INSERT INTO public.regions (id, name_ar, name_en) VALUES
  ('r1000000-0000-0000-0000-000000000001', 'الرياض', 'Riyadh'),
  ('r1000000-0000-0000-0000-000000000002', 'مكة المكرمة', 'Makkah'),
  ('r1000000-0000-0000-0000-000000000003', 'المدينة المنورة', 'Madinah'),
  ('r1000000-0000-0000-0000-000000000004', 'المنطقة الشرقية', 'Eastern Province'),
  ('r1000000-0000-0000-0000-000000000005', 'القصيم', 'Al-Qassim'),
  ('r1000000-0000-0000-0000-000000000006', 'عسير', 'Asir'),
  ('r1000000-0000-0000-0000-000000000007', 'تبوك', 'Tabuk'),
  ('r1000000-0000-0000-0000-000000000008', 'حائل', 'Hail'),
  ('r1000000-0000-0000-0000-000000000009', 'نجران', 'Najran'),
  ('r1000000-0000-0000-0000-000000000010', 'جازان', 'Jazan'),
  ('r1000000-0000-0000-0000-000000000011', 'الحدود الشمالية', 'Northern Borders'),
  ('r1000000-0000-0000-0000-000000000012', 'الجوف', 'Al-Jouf'),
  ('r1000000-0000-0000-0000-000000000013', 'الباحة', 'Al-Baha')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed: Cities
-- ============================================================
INSERT INTO public.cities (id, region_id, name_ar, name_en) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 'الرياض', 'Riyadh'),
  ('c1000000-0000-0000-0000-000000000002', 'r1000000-0000-0000-0000-000000000001', 'الخرج', 'Al-Kharj'),
  ('c1000000-0000-0000-0000-000000000003', 'r1000000-0000-0000-0000-000000000001', 'أخرى', 'Other'),
  ('c1000000-0000-0000-0000-000000000004', 'r1000000-0000-0000-0000-000000000002', 'جدة', 'Jeddah'),
  ('c1000000-0000-0000-0000-000000000005', 'r1000000-0000-0000-0000-000000000002', 'مكة المكرمة', 'Mecca'),
  ('c1000000-0000-0000-0000-000000000006', 'r1000000-0000-0000-0000-000000000002', 'الطائف', 'Taif'),
  ('c1000000-0000-0000-0000-000000000007', 'r1000000-0000-0000-0000-000000000002', 'أخرى', 'Other'),
  ('c1000000-0000-0000-0000-000000000008', 'r1000000-0000-0000-0000-000000000003', 'المدينة المنورة', 'Madinah'),
  ('c1000000-0000-0000-0000-000000000009', 'r1000000-0000-0000-0000-000000000003', 'ينبع', 'Yanbu'),
  ('c1000000-0000-0000-0000-000000000010', 'r1000000-0000-0000-0000-000000000003', 'أخرى', 'Other'),
  ('c1000000-0000-0000-0000-000000000011', 'r1000000-0000-0000-0000-000000000004', 'الدمام', 'Dammam'),
  ('c1000000-0000-0000-0000-000000000012', 'r1000000-0000-0000-0000-000000000004', 'الخبر', 'Al-Khobar'),
  ('c1000000-0000-0000-0000-000000000013', 'r1000000-0000-0000-0000-000000000004', 'الأحساء', 'Al-Ahsa'),
  ('c1000000-0000-0000-0000-000000000014', 'r1000000-0000-0000-0000-000000000004', 'أخرى', 'Other')
ON CONFLICT (id) DO NOTHING;
