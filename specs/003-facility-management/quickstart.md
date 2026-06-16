# Quickstart: Facility Management

This guide describes how to run, test, and verify the Facility Management features in your local environment.

---

## 1. Local Supabase Migrations & Seeds

The Facility Management feature adds database schema modifications, triggers, seeds, and unit tests under the `supabase/` folder.

1. Ensure Docker Desktop is running.
2. Apply migrations locally:
   ```bash
   supabase db reset
   ```
   *Note: This will recreate the database, run all migration SQL files (including the new `20260616000001_facility_management.sql`), and run seed files to populate standard tenants, user profiles, regions, cities, and initial facility leads.*

---

## 2. Seed Data Validation

The database seed will populate the following Saudi administrative regions and cities:
* **Regions**: Riyadh, Makkah, Madinah, Eastern Province, etc.
* **Cities**: Riyadh, Jeddah, Dammam, Mecca, Medina, etc.
* **Special Entry**: Each region contains an `"أخرى"` (Other) city record to allow free-text input fallbacks.

The seed script also creates initial mock facilities for testing:
* **Facility A** (Company A, owned by `sales_a@nebrasgoo.com`): Active lead, status: `new`.
* **Facility B** (Company A, unassigned): Active lead, status: `contacted`. Only visible to supervisors and admins of Company A.
* **Facility C** (Company B, owned by `sales_b@nebrasgoo.com`): Active lead, status: `new`. Only visible to Company B users.

---

## 3. Running Verification Tests

### 3.1 Database RLS & Constraint Testing (pgTAP)
To verify that tenant isolation, phone normalization triggers, partial uniqueness indexes, and RBAC rules are correctly enforced in the Postgres layer, run pgTAP tests:

```bash
supabase db test
```
All tests under `supabase/tests/` (including the new `003-facility-management.test.sql`) will execute and report pass/fail.

### 3.2 Integration & Server Action Tests
Verify that Server Actions, phone format normalizations, and input validations function correctly at the application layer:

```bash
npm run test:integration
```
This runs Vitest integration tests simulating multi-tenant users, testing for collision messages on duplicate phone submissions, and tracking history additions.

---

## 4. Local App Testing & UI Validation

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) and log in.
3. **Validate Sales User Scope**:
   * Log in as `sales_a@nebrasgoo.com` / `password123`.
   * Navigate to `http://localhost:3000/dashboard/facilities`.
   * Confirm you only see facilities assigned to `sales_a`. Verify that unassigned Facility B is hidden.
   * Try to access unassigned Facility B directly via URL (`/dashboard/facilities/[id_of_facility_b]`). Confirm you are denied with a permission error.
4. **Validate Management Scope**:
   * Log in as `supervisor_a@nebrasgoo.com` / `password123`.
   * Navigate to the facilities directory. Confirm you see both Facility A and Facility B.
   * Open the filter panel and select the `Show Archived` (عرض المؤرشف) toggle to display soft-deleted leads.
   * Go to Facility B's detail page, assign it to `sales_a`, and verify that the assignment is immediately visible on the chronological activity timeline at the bottom of the page.
5. **Validate Duplicate Warning**:
   * While logged in as `sales_a`, attempt to create a new facility using the phone number of Facility C (Company B). This must succeed because uniqueness is tenant-scoped.
   * Attempt to create a new facility using the phone number of Facility A (Company A, owned by `sales_a`). This must fail with the duplicate warning.
   * Attempt to create a new facility using the phone number of Facility B (Company A, unassigned, invisible to `sales_a`). This must fail with the generic supervisor routing message, preventing the user from discovering who owns the phone number.
