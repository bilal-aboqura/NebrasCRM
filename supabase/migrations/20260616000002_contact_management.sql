-- T002: Contact Management - schema, indexes, RLS

-- ============================================================
-- Contacts table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name_ar varchar(150) NOT NULL,
  job_title varchar(100) NOT NULL,
  primary_phone varchar(20) NOT NULL,
  primary_phone_normalized varchar(20) NOT NULL,
  secondary_phone varchar(20),
  email varchar(255),
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  archived_by uuid REFERENCES public.profiles(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_facility_id ON public.contacts(facility_id);

-- Partial unique index: at most one active primary contact per facility
CREATE UNIQUE INDEX IF NOT EXISTS contacts_facility_primary_idx
  ON public.contacts(facility_id)
  WHERE (is_primary = true AND is_archived = false);

-- ============================================================
-- Updated At Trigger
-- ============================================================
DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_select_policy ON public.contacts;
CREATE POLICY contacts_select_policy ON public.contacts
  FOR SELECT
  USING (
    company_id = public.get_active_company_id()
    AND EXISTS (
      SELECT 1 FROM public.facilities
      WHERE facilities.id = contacts.facility_id
    )
  );

DROP POLICY IF EXISTS contacts_insert_policy ON public.contacts;
CREATE POLICY contacts_insert_policy ON public.contacts
  FOR INSERT
  WITH CHECK (
    company_id = public.get_active_company_id()
    AND EXISTS (
      SELECT 1 FROM public.facilities
      WHERE facilities.id = contacts.facility_id
    )
  );

DROP POLICY IF EXISTS contacts_update_policy ON public.contacts;
CREATE POLICY contacts_update_policy ON public.contacts
  FOR UPDATE
  USING (
    company_id = public.get_active_company_id()
    AND EXISTS (
      SELECT 1 FROM public.facilities
      WHERE facilities.id = contacts.facility_id
    )
  );

DROP POLICY IF EXISTS contacts_delete_policy ON public.contacts;
CREATE POLICY contacts_delete_policy ON public.contacts
  FOR DELETE
  USING (false);
