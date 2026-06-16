# Quickstart: Contact Management

This guide explains how to set up, run, and test the contact management system locally.

## Prerequisite Setup

Ensure your local development environment has the Supabase CLI installed and running:
```bash
supabase start
```

## 1. Database Migrations

Apply the migrations containing the contacts schema, constraints, and policies:
```bash
supabase migration up
```
This applies the migration file located at [20260616000002_contact_management.sql](file:///F:/CodingProjects/NebrasCRM/supabase/migrations/20260616000002_contact_management.sql).

## 2. Seed Data

To populate mock data for testing contacts:
```bash
supabase db reset
```
This resets the database and runs the default seed script, which includes companies, users, assigned facilities, and mock contacts.

## 3. Running Database Tests (pgTAP)

To run the database-level tenant isolation, RBAC, and primary-contact unique index validation tests:
```bash
supabase db test --db-url "postgresql://postgres:postgres@localhost:54322/postgres"
```
This runs the unit tests located at [004-contact-management.test.sql](file:///F:/CodingProjects/NebrasCRM/supabase/tests/004-contact-management.test.sql).

## 4. Running Application Tests

Run frontend component tests and Server Action integration tests:

* **Unit & Action Tests**:
  ```bash
  npm run test
  ```

* **End-to-End & RLS Integration Tests (Playwright)**:
  ```bash
  npm run test:integration
  ```

## 5. UI Verification

1. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
2. Open the browser to `http://localhost:3000/dashboard/facilities`.
3. Select an assigned facility to view the detail page.
4. Interact with the contacts section to create, edit, archive, and swap primary flags.
5. Click the phone and WhatsApp communication triggers to verify normalized link hrefs.
