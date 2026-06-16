# Data Model Design: Sales Pipeline Board

This document defines the schema changes, database triggers, and security parameters needed for the pipeline board (Feature 005).

---

## 1. Database Schema Extension (Supabase Migrations)

A new versioned migration file `supabase/migrations/20260616000003_pipeline_lost_reason.sql` will implement the following changes:

```sql
-- Create Enum for Lost Reason
CREATE TYPE lost_reason_type AS ENUM ('price', 'competitor', 'no_response', 'not_interested', 'other');

-- Alter Facilities Table to add lost_reason and status_changed_at
ALTER TABLE facilities
  ADD COLUMN lost_reason lost_reason_type NULL,
  ADD COLUMN status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create trigger function to update status_changed_at automatically on lifecycle_status edits
CREATE OR REPLACE FUNCTION update_facility_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lifecycle_status IS DISTINCT FROM OLD.lifecycle_status THEN
    NEW.status_changed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to facilities table
CREATE TRIGGER trigger_facility_status_changed_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_status_changed_at();
```

---

## 2. Updated Entity Structure

### `facilities` (reused from Feature 003)
- `id` (uuid, primary key)
- `company_id` (uuid, foreign key, tenant isolator)
- `name_ar` (text)
- `type` (enum)
- `city` (text)
- `region` (text)
- `primary_phone` (text)
- `secondary_phone` (text)
- `lead_source` (enum)
- `lifecycle_status` (enum: `'new'`, `'contacted'`, `'interested'`, `'offer'`, `'negotiation'`, `'contract'`, `'lost'`)
- `lost_reason` (enum: `'price'`, `'competitor'`, `'no_response'`, `'not_interested'`, `'other'`, nullable)
- `status_changed_at` (timestamptz, automatically updated by trigger)
- `assigned_owner_id` (uuid, foreign key to user profile)
- `is_active` (boolean, archived facilities are `is_active = false`)

### `FacilityActivity` (reused from Feature 003)
When moving a facility card, a new row is appended to this table:
- `id` (uuid, primary key)
- `facility_id` (uuid, foreign key)
- `actor_id` (uuid, foreign key to active user)
- `event_type` (text, set to `'status_change'`)
- `old_value` (text representation, e.g. `'contacted'`)
- `new_value` (text representation, e.g. `'lost'`)
- `created_at` (timestamptz, defaults to `now()`)

*Note: For transitions to `'lost'`, the `FacilityActivity` entry will capture the `lost_reason` inside a structured format or notes column if available, or concatenated into `new_value` (e.g. `'lost ( competitor )'`) to preserve history.*

---

## 3. RLS and Security Access

No new PostgreSQL Row Level Security (RLS) policies are introduced because all reads and writes flow through the existing `facilities` table RLS rules created in Feature 003:
- **Select Policy**: Authenticated users can select facilities matching their tenant scope (`company_id`). Sales Users are further restricted to records where `assigned_owner_id` matches their own auth user ID.
- **Update Policy**: Enforces the same company scoping. Sales Users are allowed to execute updates only on facilities assigned to them.
- **Server Action Enforcement**: The Next.js Server Action acts as an authorization boundary, verifying the user's role and tenant membership before committing any database updates.
