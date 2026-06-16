-- T003-T005: Follow-up Management - schema, enums, triggers, RLS

-- Extend facility_activity_type enum with followup events
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'followup_create';
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'followup_complete';
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'followup_reschedule';
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'followup_cancel';
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'followup_reassign';

-- Followup type enum
DO $$ BEGIN
  CREATE TYPE followup_type AS ENUM ('call', 'visit', 'send_offer', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Followup status enum
DO $$ BEGIN
  CREATE TYPE followup_status AS ENUM ('pending', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Followup outcome enum
DO $$ BEGIN
  CREATE TYPE followup_outcome AS ENUM (
    'answered', 'no_answer', 'callback_requested', 'not_interested',
    'met_decision_maker', 'no_show', 'rescheduled', 'followup_needed',
    'offer_sent', 'feedback_received', 'offer_rejected', 'offer_accepted',
    'task_completed', 'postponed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Contacts: add unique constraint for composite FK (T003)
-- ============================================================
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS uniq_contacts_facility_and_id;
ALTER TABLE public.contacts
  ADD CONSTRAINT uniq_contacts_facility_and_id UNIQUE (facility_id, id);

-- ============================================================
-- Followups table (T003)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  contact_id uuid,
  assigned_to uuid NOT NULL REFERENCES public.profiles(id),
  type followup_type NOT NULL,
  due_at timestamptz NOT NULL,
  status followup_status NOT NULL DEFAULT 'pending',
  notes text,
  outcome followup_outcome,
  outcome_note text,
  cancel_reason text,
  completed_by uuid REFERENCES public.profiles(id),
  completed_at timestamptz,
  cancelled_by uuid REFERENCES public.profiles(id),
  cancelled_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Composite FK: contact must belong to same facility (T003)
ALTER TABLE public.followups DROP CONSTRAINT IF EXISTS fk_followups_facility_contact;
ALTER TABLE public.followups
  ADD CONSTRAINT fk_followups_facility_contact
  FOREIGN KEY (facility_id, contact_id)
  REFERENCES public.contacts(facility_id, id)
  ON DELETE SET NULL;

-- ============================================================
-- Indexes (T003)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_followups_company_id ON public.followups(company_id);
CREATE INDEX IF NOT EXISTS idx_followups_facility_id ON public.followups(facility_id);
CREATE INDEX IF NOT EXISTS idx_followups_assigned_to ON public.followups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_followups_status_due_at ON public.followups(status, due_at);

-- ============================================================
-- Trigger: updated_at (T004)
-- ============================================================
DROP TRIGGER IF EXISTS trg_followups_updated_at ON public.followups;
CREATE TRIGGER trg_followups_updated_at
  BEFORE UPDATE ON public.followups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Trigger: facility owner cascade for pending followups (T005)
-- ============================================================
CREATE OR REPLACE FUNCTION reassign_pending_followups_on_owner_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    UPDATE public.followups
    SET assigned_to = NEW.assigned_to
    WHERE facility_id = NEW.id
      AND status = 'pending'
      AND assigned_to = OLD.assigned_to;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_facility_owner_cascade ON public.facilities;
CREATE TRIGGER trg_facility_owner_cascade
  AFTER UPDATE OF assigned_to ON public.facilities
  FOR EACH ROW
  EXECUTE FUNCTION reassign_pending_followups_on_owner_change();

-- ============================================================
-- RLS (T003)
-- ============================================================
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- SELECT: Sales sees own assigned; management sees all company
DROP POLICY IF EXISTS followups_select_policy ON public.followups;
CREATE POLICY followups_select_policy ON public.followups
  FOR SELECT
  USING (
    company_id = public.get_active_company_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.facilities
        WHERE facilities.id = followups.facility_id
          AND (facilities.assigned_to = auth.uid() OR current_setting('app.user_role', true) IN ('super_admin', 'company_admin', 'supervisor'))
      )
    )
  );

-- INSERT: Sales can only create for own facilities; all must be in company
DROP POLICY IF EXISTS followups_insert_policy ON public.followups;
CREATE POLICY followups_insert_policy ON public.followups
  FOR INSERT
  WITH CHECK (
    company_id = public.get_active_company_id()
    AND (
      current_setting('app.user_role', true) IN ('super_admin', 'company_admin', 'supervisor')
      OR EXISTS (
        SELECT 1 FROM public.facilities
        WHERE facilities.id = followups.facility_id
          AND facilities.assigned_to = auth.uid()
          AND facilities.is_archived = false
      )
    )
  );

-- UPDATE: Sales only own followups; management all company
DROP POLICY IF EXISTS followups_update_policy ON public.followups;
CREATE POLICY followups_update_policy ON public.followups
  FOR UPDATE
  USING (
    company_id = public.get_active_company_id()
    AND (
      current_setting('app.user_role', true) IN ('super_admin', 'company_admin', 'supervisor')
      OR (
        assigned_to = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.facilities
          WHERE facilities.id = followups.facility_id
            AND facilities.assigned_to = auth.uid()
            AND facilities.is_archived = false
        )
      )
    )
  );

-- DELETE denied
DROP POLICY IF EXISTS followups_delete_policy ON public.followups;
CREATE POLICY followups_delete_policy ON public.followups
  FOR DELETE
  USING (false);
