# Quickstart: Follow-up Management

This guide describes how to run, test, and verify the Follow-up Management features in your local environment.

---

## 1. Local Supabase Migrations & Seeds

The Follow-up Management feature adds database schema modifications, triggers, seeds, and unit tests under the `supabase/` folder.

1. Ensure Docker Desktop is running.
2. Apply migrations locally:
   ```bash
   supabase db reset
   ```
   *Note: This will recreate the database, apply `20260616000004_followup_management.sql`, and populate initial seed data for follow-ups.*

---

## 2. Seed Data Validation

The database seed will populate the following mock follow-up records:
* **Follow-up A** (Company A, linked to Facility A, assigned to `sales_a@nebrasgoo.com`): Status: `pending`, due date: tomorrow at 10:00 AM (Upcoming).
* **Follow-up B** (Company A, linked to Facility A, assigned to `sales_a@nebrasgoo.com`): Status: `pending`, due date: yesterday at 2:00 PM (Overdue).
* **Follow-up C** (Company B, linked to Facility C, assigned to `sales_b@nebrasgoo.com`): Status: `pending`, due date: yesterday (Isolated from Company A).

---

## 3. Running Verification Tests

### 3.1 Database RLS, Cascade, & Constraint Testing (pgTAP)
To verify that tenant isolation, composite unique constraint checks for contacts, and owner-change triggers are functioning, run:

```bash
supabase db test
```
All pgTAP tests under `supabase/tests/` (including `006-followup-management.test.sql`) will execute and report pass/fail.

### 3.2 Integration & Server Action Tests
Verify Server Actions, outcomes selection logic, and timezone handling:

```bash
npm run test:integration
```
Runs Vitest integration tests to verify the atomic cascade, validation rules on contact mapping, and facility timeline logging.

---

## 4. Local App Testing & UI Validation

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) and log in.
3. **Validate Dedicated "المتابعات" View**:
   * Log in as `sales_a@nebrasgoo.com` / `password123`.
   * Navigate to `http://localhost:3000/dashboard/followups`.
   * Verify the default view is "المهام المعلقة" (All Pending), showing Follow-up B (Overdue) at the top in red, followed by Follow-up A (Upcoming).
   * Confirm you cannot see Follow-up C (Company B).
4. **Validate Reassignment Cascade**:
   * Log in as `supervisor_a@nebrasgoo.com` / `password123`.
   * Navigate to Facility A detail page. Reassign the facility from `sales_a` to another sales rep.
   * Verify on the activity timeline that all pending follow-ups belonging to `sales_a` have been atomically transferred to the new owner, and that timeline events were generated.
