# Data Model: Assessment Persistence and CRM Linking

## Table: `assessments`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the assessment. |
| `company_id` | `uuid` | `REFERENCES companies(id)`, `NOT NULL` | Denormalized tenant identifier for RLS isolation. |
| `facility_id` | `uuid` | `REFERENCES facilities(id)`, `NOT NULL` | FK to the associated medical facility. |
| `assessed_by` | `uuid` | `REFERENCES profiles(id)`, `NOT NULL` | FK to the profile of the consultant who performed the audit. |
| `facility_type_assessed` | `text` | `CHECK (facility_type_assessed IN ('general', 'dental'))` | The CBAHI questionnaire type. |
| `overall_score` | `integer` | `CHECK (overall_score >= 0 AND overall_score <= 100)` | The server-calculated score percentage. |
| `readiness_tier` | `text` | `CHECK (readiness_tier IN ('high', 'medium', 'low'))` | The calculated tier. |
| `answers` | `jsonb` | `NOT NULL` | Array of `{ item_code, status, notes }`. |
| `is_active` | `boolean` | `DEFAULT true`, `NOT NULL` | Soft archiving flag. |
| `archived_at` | `timestamptz`| `NULL` | Timestamp when the assessment was archived. |
| `archived_by` | `uuid` | `REFERENCES profiles(id)`, `NULL` | Admin profile who performed the archiving. |
| `created_at` | `timestamptz`| `DEFAULT now()`, `NOT NULL` | Timestamp of assessment save. |

## Database Triggers & Functions

### Immutability Check
A trigger on the `assessments` table prevents updates to immutable fields.

```sql
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
```

## Row Level Security (RLS)

```sql
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Select Policy: Inherits facility visibility
CREATE POLICY select_assessment_policy ON assessments
FOR SELECT
USING (
  company_id = (select company_id from profiles where id = auth.uid())
  AND (
    (select role from profiles where id = auth.uid()) IN ('supervisor', 'company_admin')
    OR (select owner_id from facilities where id = facility_id) = auth.uid()
  )
);

-- Insert Policy: Follows facility edit rights
CREATE POLICY insert_assessment_policy ON assessments
FOR INSERT
WITH CHECK (
  company_id = (select company_id from profiles where id = auth.uid())
  AND (
    (select role from profiles where id = auth.uid()) IN ('supervisor', 'company_admin')
    OR (select owner_id from facilities where id = facility_id) = auth.uid()
  )
);

-- Update Policy (Only for soft archiving by supervisor/admin)
CREATE POLICY update_assessment_policy ON assessments
FOR UPDATE
USING (
  company_id = (select company_id from profiles where id = auth.uid())
  AND (select role from profiles where id = auth.uid()) IN ('supervisor', 'company_admin')
)
WITH CHECK (
  company_id = (select company_id from profiles where id = auth.uid())
  AND (select role from profiles where id = auth.uid()) IN ('supervisor', 'company_admin')
);
```
