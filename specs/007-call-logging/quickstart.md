# Quickstart: Call and Communication Logging

This guide describes how to run, test, and verify the Call and Communication Logging features in your local environment.

---

## 1. Local Supabase Migrations & Seeds

The Call and Communication Logging feature adds database schema modifications, validation triggers, seed data, and unit tests under the `supabase/` folder.

1. Ensure Docker Desktop is running.
2. Apply migrations locally:
   ```bash
   supabase db reset
   ```
   *Note: This will recreate the database, apply `20260616000005_call_logging.sql`, and populate initial seed data for call logs and mock facilities.*

---

## 2. Seed Data Validation

The database seed will populate the following mock call log records:
* **Call Log A** (Company A, linked to Facility A, created by `sales_a@nebrasgoo.com`): Created 2 hours ago. Status: Active. Editable by the creator.
* **Call Log B** (Company A, linked to Facility A, created by `sales_a@nebrasgoo.com`): Created 3 days ago. Status: Active. Locked for editing by the creator (past 24 hours), but editable by supervisor.
* **Call Log C** (Company B, linked to Facility C, created by `sales_b@nebrasgoo.com`): Active. (Isolated from Company A).

---

## 3. Running Verification Tests

### 3.1 Database RLS & Validation Testing (pgTAP)
To verify that tenant isolation, cross-facility contact/follow-up validation, and the 24-hour edit-window locks are functioning at the database level, run:

```bash
supabase db test
```
All pgTAP tests under `supabase/tests/` (including `007-call-logging.test.sql`) will execute and report pass/fail.

### 3.2 Integration & Server Action Tests
Verify Server Actions, atomic follow-up completions, and timeline logging:

```bash
npm run test:integration
```
Runs Vitest integration tests to verify validation rules, 24-hour lock calculations, and timeline entries.

---

## 4. Local App Testing & UI Validation

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) and log in.

### 4.1 Validate Quick-Log Banner
* Log in as `sales_a@nebrasgoo.com` / `password123`.
* Navigate to Facility A detail page.
* Click the phone call icon or WhatsApp icon next to a contact.
* Switch to another window/tab, then return to the CRM tab.
* Verify that a non-intrusive floating banner appears at the bottom/top of the screen prompting you to log the outcome.
* Fill in the notes and outcome, and click save. Verify that the banner disappears, the log appears in the history list, and the timeline is updated.

### 4.2 Validate 24-Hour Edit Lock
* On Facility A detail page, look at the call logs list.
* Locate **Call Log A** (created 2 hours ago). Click the "Edit" (تعديل) button. Update notes and save.
* Locate **Call Log B** (created 3 days ago). Note that the "Edit" button is disabled/hidden for you.
* Log out and log back in as `supervisor_a@nebrasgoo.com` / `password123`.
* Navigate to Facility A detail page. Verify that both **Call Log A** and **Call Log B** have active "Edit" buttons, allowing the supervisor to modify them.
