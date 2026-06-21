# Quickstart: Reports Module

This document helps you set up the environment and run the Reports Module.

---

## 1. Prerequisites Migration

Before starting the Next.js server, apply the database schema fixes:

1. **Locate Migration File**:
   [20260621000001_reports_prerequisites.sql](file:///F:/CodingProjects/NebrasCRM/supabase/migrations/20260621000001_reports_prerequisites.sql)
2. **Apply Migration**:
   Run the migration using Supabase CLI or execute the SQL commands directly in the Supabase SQL Editor:
   ```bash
   npx supabase db push
   ```

---

## 2. Running the Development Server

Start the local development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 3. Viewing the Reports

1. Log in with an authorized account (e.g. Supervisor/Admin or Sales User).
2. Locate the "التقارير" (Reports) navigation item in the sidebar.
3. Click to open the reports Selection index:
   - **Sales Users**: Can access 5 reports (Pipeline, Conversion/Loss, Follow-ups, Communications, Offers).
   - **Managers (Supervisor/Admin)**: Can access all 6 reports, including the Team Comparison Report.

---

## 4. Running Verification Tests

Run the test suites:
```bash
npm run test
```
To run specific verification tests:
```bash
npx vitest run src/tests/reports.test.ts
```
