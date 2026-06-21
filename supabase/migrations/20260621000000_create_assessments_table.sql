-- Migration: Create assessments table
-- Date: 2026-06-21

CREATE TABLE IF NOT EXISTS assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id),
    facility_id uuid NOT NULL REFERENCES facilities(id),
    assessed_by uuid NOT NULL REFERENCES profiles(id),
    facility_type_assessed text NOT NULL CHECK (facility_type_assessed IN ('general', 'dental')),
    overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    readiness_tier text NOT NULL CHECK (readiness_tier IN ('high', 'medium', 'low')),
    answers jsonb NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    archived_at timestamptz,
    archived_by uuid REFERENCES profiles(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_company_id ON assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_assessments_facility_id ON assessments(facility_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);

-- Immutability Check Trigger
CREATE OR REPLACE FUNCTION check_assessment_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.overall_score IS DISTINCT FROM NEW.overall_score OR
     OLD.readiness_tier IS DISTINCT FROM NEW.readiness_tier OR
     OLD.answers IS DISTINCT FROM NEW.answers OR
     OLD.facility_type_assessed IS DISTINCT FROM NEW.facility_type_assessed OR
     OLD.assessed_by IS DISTINCT FROM NEW.assessed_by OR
     OLD.company_id IS DISTINCT FROM NEW.company_id OR
     OLD.facility_id IS DISTINCT FROM NEW.facility_id OR
     OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'This assessment record is immutable and cannot be updated.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_assessment_immutability
BEFORE UPDATE ON assessments
FOR EACH ROW
EXECUTE FUNCTION check_assessment_immutability();

-- Row Level Security (RLS)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Select Policy: Inherits facility visibility
CREATE POLICY select_assessment_policy ON assessments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.facilities f
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE f.id = assessments.facility_id
      AND f.company_id = assessments.company_id
      AND assessments.company_id = CASE
        WHEN p.role = 'super_admin' THEN nullif(current_setting('request.cookies.active_company_id', true), '')::uuid
        ELSE p.company_id
      END
      AND (p.role <> 'sales_user' OR f.assigned_to = auth.uid())
  )
);

-- Insert Policy: Follows facility edit rights
CREATE POLICY insert_assessment_policy ON assessments
FOR INSERT TO authenticated
WITH CHECK (
  assessed_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.facilities f
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE f.id = assessments.facility_id
      AND f.company_id = assessments.company_id
      AND f.is_active
      AND assessments.company_id = CASE
        WHEN p.role = 'super_admin' THEN nullif(current_setting('request.cookies.active_company_id', true), '')::uuid
        ELSE p.company_id
      END
      AND (p.role <> 'sales_user' OR f.assigned_to = auth.uid())
  )
);

-- Update Policy (Only for soft archiving by supervisor/admin)
CREATE POLICY update_assessment_policy ON assessments
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('super_admin', 'company_admin', 'supervisor')
      AND assessments.company_id = CASE
        WHEN p.role = 'super_admin' THEN nullif(current_setting('request.cookies.active_company_id', true), '')::uuid
        ELSE p.company_id
      END
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('super_admin', 'company_admin', 'supervisor')
      AND assessments.company_id = CASE
        WHEN p.role = 'super_admin' THEN nullif(current_setting('request.cookies.active_company_id', true), '')::uuid
        ELSE p.company_id
      END
  )
);
