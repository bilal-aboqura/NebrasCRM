# Quickstart Guide: Sales Pipeline Board

This guide outlines the commands to set up the local development database schema, run the Next.js development server, and execute tests for the Sales Pipeline Board (Feature 005).

---

## 1. Database Schema Set Up

Ensure you have the Supabase CLI installed and running locally.

1. **Generate the Migration File**:
   ```bash
   npx supabase db diff -f pipeline_lost_reason
   ```
   Alternatively, create a new blank migration file:
   ```bash
   npx supabase migration new pipeline_lost_reason
   ```
   Paste the schema modifications defined in [data-model.md](file:///F:/CodingProjects/NebrasCRM/specs/005-sales-pipeline/data-model.md) into the newly created `.sql` file under `supabase/migrations/`.

2. **Apply Migrations Locally**:
   ```bash
   npx supabase db reset
   ```
   This command resets the local database, applies all schema migrations in order, and runs the database seed script `supabase/seed.sql`.

---

## 2. Seed Data Validation

Verify that `supabase/seed.sql` includes:
- Facilities at multiple pipeline stages (e.g., `new`, `contacted`, `interested`, `negotiation`, `contract`, `lost`).
- A mixture of facilities assigned to `Sales Users` and some left `unassigned` (to test Admin/Supervisor viewpoints).
- Two distinct companies (e.g., Company A: "نبراس الجودة", Company B: "تقنية الارتقاء") to validate multi-tenant isolation.

---

## 3. Running the Dev Server

1. **Install Dependencies** (if new ones were added):
   ```bash
   npm install
   ```

2. **Start Next.js Development Server**:
   ```bash
   npm run dev
   ```
   Access the CRM at `http://localhost:3000` (or the local dev port) and navigate to the dashboard pipeline route: `/dashboard/pipeline`.

---

## 4. Running the Tests

### Database pgTAP Unit Tests
Run the pgTAP unit tests to verify RLS policy enforcement and tenant isolation:
```bash
npx supabase test db tests/005-sales-pipeline.test.sql
```
*Note: This test file validates that Sales Users cannot drag cards belonging to other users or other companies, and checks that database status triggers execute correctly.*

### Frontend Integration Tests (Playwright / Vitest)
Run the E2E and component-level tests:
```bash
# Run Vitest component tests
npm run test

# Run Playwright E2E browser tests
npx playwright test
```
The Playwright suite verifies that dragging a card into "contract" or "lost" triggers a confirmation modal, and that mobile screen sizes display the tabbed column layout.
