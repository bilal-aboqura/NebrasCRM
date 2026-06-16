-- T003-T005: Call Logging - schema, enums, triggers, RLS

-- Extend facility_activity_type enum
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'call_logged';
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'call_log_edited';
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'call_log_archived';
ALTER TYPE facility_activity_type ADD VALUE IF NOT EXISTS 'call_log_recovered';

-- Enums
DO $$ BEGIN
  CREATE TYPE communication_channel AS ENUM ('call', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE communication_direction AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE communication_outcome AS ENUM ('answered', 'no_answer', 'busy', 'wrong_number', 'callback_requested', 'not_reachable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Call logs table
CREATE TABLE IF NOT EXISTS public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  followup_id uuid REFERENCES public.followups(id) ON DELETE SET NULL,
  created_by_id uuid NOT NULL REFERENCES public.profiles(id),
  channel communication_channel NOT NULL,
  direction communication_direction NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  outcome communication_outcome NOT NULL,
  duration_seconds integer,
  notes text,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  archived_by_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_edited_by_id uuid REFERENCES public.profiles(id),
  last_edited_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_company_id ON public.call_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_facility_id ON public.call_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_occurred_at ON public.call_logs(occurred_at DESC);

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_call_logs_updated_at ON public.call_logs;
CREATE TRIGGER trg_call_logs_updated_at
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Validation trigger (T004)
CREATE OR REPLACE FUNCTION validate_call_log_insertion_or_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.occurred_at > NOW() + INTERVAL '1 minute' THEN
    RAISE EXCEPTION 'The communication date/time cannot be in the future.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.contact_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = NEW.contact_id AND facility_id = NEW.facility_id
    ) THEN
      RAISE EXCEPTION 'The selected contact must belong to the associated facility.'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;

  IF NEW.followup_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.followups
      WHERE id = NEW.followup_id
        AND facility_id = NEW.facility_id
        AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'The selected follow-up must belong to the associated facility and company.'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_call_log ON public.call_logs;
CREATE TRIGGER trg_validate_call_log
  BEFORE INSERT OR UPDATE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION validate_call_log_insertion_or_update();

-- 24-hour edit lock trigger (T026)
CREATE OR REPLACE FUNCTION check_call_log_edit_window()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  user_role := auth.jwt() ->> 'role';

  IF user_role IN ('supervisor', 'company_admin', 'super_admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Editing this call log is locked after 24 hours.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.occurred_at IS DISTINCT FROM NEW.occurred_at
     OR OLD.channel IS DISTINCT FROM NEW.channel
     OR OLD.direction IS DISTINCT FROM NEW.direction THEN
    RAISE EXCEPTION 'Immutable fields (occurred_at, channel, direction) cannot be edited.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_call_log_edit_window ON public.call_logs;
CREATE TRIGGER trg_call_log_edit_window
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_call_log_edit_window();

-- RLS (T005)
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS call_logs_select_policy ON public.call_logs;
CREATE POLICY call_logs_select_policy ON public.call_logs
  FOR SELECT
  USING (
    company_id = public.get_active_company_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.facilities
        WHERE facilities.id = call_logs.facility_id
          AND (facilities.assigned_to = auth.uid() OR current_setting('app.user_role', true) IN ('super_admin', 'company_admin', 'supervisor'))
      )
    )
  );

DROP POLICY IF EXISTS call_logs_insert_policy ON public.call_logs;
CREATE POLICY call_logs_insert_policy ON public.call_logs
  FOR INSERT
  WITH CHECK (
    company_id = public.get_active_company_id()
    AND created_by_id = auth.uid()
    AND (
      current_setting('app.user_role', true) IN ('super_admin', 'company_admin', 'supervisor')
      OR EXISTS (
        SELECT 1 FROM public.facilities
        WHERE facilities.id = call_logs.facility_id
          AND facilities.assigned_to = auth.uid()
          AND facilities.is_archived = false
      )
    )
  );

DROP POLICY IF EXISTS call_logs_update_policy ON public.call_logs;
CREATE POLICY call_logs_update_policy ON public.call_logs
  FOR UPDATE
  USING (
    company_id = public.get_active_company_id()
    AND (
      current_setting('app.user_role', true) IN ('super_admin', 'company_admin', 'supervisor')
      OR (
        created_by_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.facilities
          WHERE facilities.id = call_logs.facility_id
            AND facilities.assigned_to = auth.uid()
            AND facilities.is_archived = false
        )
      )
    )
  );

DROP POLICY IF EXISTS call_logs_delete_policy ON public.call_logs;
CREATE POLICY call_logs_delete_policy ON public.call_logs
  FOR DELETE
  USING (false);
