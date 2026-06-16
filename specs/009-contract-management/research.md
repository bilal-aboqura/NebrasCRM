# Research: Contract Management

This document details the architectural decisions, rationales, and alternatives considered for implementing Contract Management in the NEBRASGOO CRM.

---

## 1. Concurrency-Safe, Tenant-Scoped Unique Reference Generation

### Decision
Implement unique contract reference numbers formatted as `CON-YYYY-XXXX` (where YYYY is the calendar year and XXXX is a 4-digit zero-padded sequence). The sequence is scoped per `company_id` and calendar year. Generate the numbers atomically at the database level using a locked sequence counter table.

* **Database Design**:
  Create a sequence counter table to track values safely:
  ```sql
  CREATE TABLE public.contract_sequence_counters (
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    year integer NOT NULL,
    current_value integer NOT NULL DEFAULT 0,
    PRIMARY KEY (company_id, year)
  );
  ```

* **Atomic Generator Trigger**:
  Implement a `BEFORE INSERT ON public.contracts` trigger:
  ```sql
  CREATE OR REPLACE FUNCTION generate_contract_reference_number()
  RETURNS TRIGGER AS $$
  DECLARE
    v_year integer;
    v_seq integer;
  BEGIN
    -- Extract current year in Riyadh time
    v_year := EXTRACT(YEAR FROM NOW() AT TIME ZONE 'Asia/Riyadh');

    -- Row-lock the counter for the specific company and year (insert if missing)
    INSERT INTO public.contract_sequence_counters (company_id, year, current_value)
    VALUES (NEW.company_id, v_year, 1)
    ON CONFLICT (company_id, year)
    DO UPDATE SET current_value = public.contract_sequence_counters.current_value + 1
    RETURNING current_value INTO v_seq;

    -- Format reference number (e.g. CON-2026-0001)
    NEW.reference_number := 'CON-' || v_year || '-' || LPAD(v_seq::text, 4, '0');
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

### Rationale
Using a row lock (`DO UPDATE` on conflict) avoids gaps and duplicate generation in highly concurrent environments. It guarantees that even if two contracts are created simultaneously, they will get sequential, non-colliding reference numbers. Scoping by `company_id` enables tenant isolation: Company A and Company B can independently have `CON-2026-0001`.

---

## 2. Secure Supabase Storage and On-Demand URL Generation

### Decision
Store contract documents in a private Supabase Storage bucket named `contracts`. Organize files using tenant-scoped paths (`company_[id]/contracts/[contract_id]/[file_name]`). Enforce document access exclusively via Server Actions that check contract visibility and issue short-lived signed URLs (15-minute TTL).

* **Private Storage Paths**:
  Reps upload PDF/images via Next.js Server Actions. The Server Action re-validates the user's role and company context, then uploads the document payload using the admin service-role client to:
  `contracts/company_[company_id]/contracts/[contract_id]/[filename]`

* **On-Demand URL Generation**:
  To view or download the document, the client invokes a Server Action `getSignedDocumentUrl(contractId)`. The server:
  1. Re-verifies tenant isolation (`company_id` matching JWT custom claims) and role visibility.
  2. Generates a signed URL with a 15-minute TTL via Supabase Storage SDK:
     ```typescript
     const { data, error } = await supabase.storage
       .from('contracts')
       .createSignedUrl(filePath, signedUrlTtlSeconds);
     ```
  3. Returns the URL to open in a new browser tab. The link is never saved in the database or embedded statically in pages.

### Rationale
Using a private bucket prevents external access. Restricting document retrieval to Server Actions guarantees that no user can bypass tenant or RBAC authorization via direct storage links. Generating signed URLs on demand ensures that links expire quickly (15 minutes), mitigating the risk of leakages.

---

## 3. Active Contract Immutability and Version Addenda

### Decision
Enforce strict immutability on active, completed, or terminated contracts at the database level. Modifications to pricing, scope, or durations must generate a new contract revision (addendum) linked to the same root contract.

* **Database Immutability Trigger**:
  ```sql
  CREATE OR REPLACE FUNCTION check_contract_immutability()
  RETURNS TRIGGER AS $$
  BEGIN
    IF OLD.status IN ('active', 'completed', 'terminated') THEN
      -- Block updates to financial value, start/end dates, linked offer, and contacts
      IF OLD.value IS DISTINCT FROM NEW.value OR
         OLD.start_date IS DISTINCT FROM NEW.start_date OR
         OLD.end_date IS DISTINCT FROM NEW.end_date OR
         OLD.offer_id IS DISTINCT FROM NEW.offer_id OR
         OLD.contact_id IS DISTINCT FROM NEW.contact_id OR
         OLD.facility_id IS DISTINCT FROM NEW.facility_id THEN
        RAISE EXCEPTION 'Cannot modify financial value or period of an active contract.'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

* **Addendum Version Chain**:
  Changes to active contracts are made by creating a new contract record:
  - Sets `parent_contract_id` to the current contract.
  - Inherits `root_contract_id` from the predecessor.
  - Sets `version = predecessor.version + 1`.
  - The database UNIQUE constraint `UNIQUE (company_id, root_contract_id, version)` prevents concurrent version clashes.

### Rationale
Ensures audited financial records. Once a contract is signed and active, changing its values directly corrupts historical billing and revenue records. Force-creating a new linked addendum maintains a clear audit trail of all scope changes.

---

## 4. Server-Side Calculations of Derived Expiring States

### Decision
Expiring Soon and Expired states are calculated dynamically at query time using the server's time in the `Asia/Riyadh` timezone, referencing the warning threshold from company settings.

* **Calculation Logic**:
  - `Warning Threshold`: Retrieved from `companies.settings ->> 'contract_warning_threshold_days'` (defaults to `60` if null).
  - `Expired`: `status = 'active' AND end_date < CURRENT_DATE` (in Riyadh time).
  - `Expiring Soon`: `status = 'active' AND end_date >= CURRENT_DATE AND end_date <= CURRENT_DATE + (settings.contract_warning_threshold_days * INTERVAL '1 day')`.

### Rationale
Prevents out-of-sync status values in the database. As dates advance, status changes occur automatically without requiring background cron jobs to update database status columns. Calculating in the local Saudi timezone (`Asia/Riyadh`) aligns with Saudi commercial practices.
