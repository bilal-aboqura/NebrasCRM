-- T003: Sales Pipeline - lost_reason enum, status_changed_at column, trigger

CREATE TYPE IF NOT EXISTS lost_reason_type AS ENUM ('price', 'competitor', 'no_response', 'not_interested', 'other');

ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS lost_reason lost_reason_type,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_facility_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_facility_status_changed_at ON facilities;
CREATE TRIGGER trigger_facility_status_changed_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_status_changed_at();
