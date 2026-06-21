# Data Model: Reports Module Prerequisites

This document outlines the database schema updates required to support the Reports Module.

---

## 1. Schema Changes

We will create a migration `20260621000001_reports_prerequisites.sql` to perform the following operations:

### 1.1 `public.followup_type` Enum Update
The existing enum:
```sql
CREATE TYPE public.followup_type AS ENUM ('call', 'visit', 'email', 'whatsapp');
```
Will be altered to:
```sql
CREATE TYPE public.followup_type AS ENUM ('call', 'visit', 'send_offer', 'other');
```
Since PostgreSQL does not support removing values from an enum in a single statement, the migration will:
1. Rename the existing enum.
2. Create the new enum with corrected values.
3. Update any existing `public.followups.type` column references:
   - Map `'email'` to `'other'`
   - Map `'whatsapp'` to `'other'`
4. Drop the old enum type.

---

### 1.2 `public.facility_activity` Structured Fields
To track status transitions cleanly without parsing text logs, the `facility_activity` table will be updated:
1. Create enum `public.facility_activity_type` if it does not exist:
   ```sql
   CREATE TYPE public.facility_activity_type AS ENUM ('status_change', 'owner_change', 'archived', 'recovered', 'created', 'edited');
   ```
2. Add columns:
   - `event_type` (`public.facility_activity_type`)
   - `old_value` (`text`)
   - `new_value` (`text`)
3. Populate these fields for existing records:
   - Map existing records where `kind = 'status_change'` to `event_type = 'status_change'`, and extract `new_value` from the status change message if possible.
4. Drop the `kind` column (or keep it as a fallback/compatibility field, but migrate its usage). We will rename/transition it to `event_type`.
5. Update the `log_facility_status_change` trigger on `public.facilities` to write structured data:
   ```sql
   CREATE OR REPLACE FUNCTION public.log_facility_status_change()
   RETURNS trigger LANGUAGE plpgsql AS $$
   BEGIN
     IF old.status IS DISTINCT FROM new.status THEN
       INSERT INTO public.facility_activity (company_id, facility_id, actor_id, event_type, old_value, new_value, message)
       VALUES (
         new.company_id, 
         new.id, 
         auth.uid(), 
         'status_change', 
         old.status::text, 
         new.status::text, 
         'Facility status changed from ' || old.status::text || ' to ' || new.status::text
       );
     END IF;
     RETURN new;
   END;
   $$;
   ```

---

## 2. RLS & Security

No new tables are introduced, and all queries are run against existing tables. All report queries will respect the existing RLS policies on `facilities`, `facility_activity`, `followups`, `call_logs`, `offers`, and `contracts`.
- For Sales Users, all selects are filtered at the database level by RLS to only return records they own (`owner_id = auth.uid()` or assigned to facilities they own).
- For Supervisors/Admins, data is scoped by `company_id = get_active_company_id()`.
