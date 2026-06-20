# Research: Bulk Import & Export (Feature 011)

This document outlines the design decisions, technology research, and rationale for the implementation of the Bulk Import & Export feature in NebrasCRM.

## 1. Excel/CSV Parsing & Generation Library

- **Decision**: Use `xlsx` (SheetJS) on the server-side (Next.js server-side action or route handler).
- **Rationale**: 
  - SheetJS is the industry standard for reading/writing Excel (.xlsx) and CSV files in JavaScript/TypeScript.
  - It supports both Node.js environment streams/buffers and is highly optimized.
  - It handles encoding issues and provides cell-by-cell parsing which is needed for validating columns, rows, and handling custom Arabic header mapping.
  - Doing all parsing on the server-side avoids exposing client-parsed/unvalidated data to mutations, respecting the security requirement to never trust the client.
- **Alternatives considered**:
  - `exceljs`: A great library for generating complex styled Excel files, but has a larger bundle footprint and slower parsing performance. SheetJS is faster and sufficient for template-based imports/exports.
  - Client-side parsing (e.g., PapaParse for CSV + SheetJS for XLSX): Rejected because we must enforce server-side validation and security checks, and keeping parsing logic on the server reduces client JS bundle size.

## 2. Setting storage (max_import_rows)

- **Decision**: Create a `system_settings` table in Supabase/PostgreSQL with `max_import_rows` stored as a database-driven config key (default to `1000` rows), queryable on the server.
- **Rationale**:
  - Allows admins/super_admins to adjust the limit without redeploying code or modifying environment variables on the production VPS.
  - Keeps the configuration centralized in the database.
- **Alternatives considered**:
  - Hardcoding the limit: Rejected per the explicit requirement that it must not be hardcoded.
  - Environment variable (`NEXT_PUBLIC_MAX_IMPORT_ROWS`): Rejected because changing it requires redeployment/restart of the Node.js server.

## 3. RLS and Authorization Model for Import/Export

- **Decision**:
  - **Import**: Check user's role on the server-side before parsing/saving. Restrict to `super_admin`, `company_admin`, and `supervisor`. Return 403/Forbidden if a `sales_user` attempts it. Create RLS policies on `import_batches` to scope insertions/selections by `company_id`.
  - **Export**: Reuse the existing Supabase RLS policies for `facilities`, `followups`, `offers`, and `contracts`. The server query uses the user's Supabase client session (inheriting the user's RLS policy context). For a `sales_user`, the query automatically returns only their assigned facilities. For `company_admin`/`supervisor`, it returns all company facilities.
- **Rationale**: Ensures complete, bulletproof tenant isolation at the database layer (Principle I & II of the Constitution) and avoids duplicating visibility rules in the code.
- **Alternatives considered**:
  - Manual code-level filters: Rejected because it is prone to developer errors and violates Principle I (Data isolation must live at the data-access layer).

## 4. Bulk Insert Transaction & Activity Logging

- **Decision**: Execute the import confirmation in a PostgreSQL transaction:
  1. Verify the import batch status is `preview` and belongs to the user's company.
  2. Bulk insert facilities (with `lead_source = 'imported'`, `status = 'new'`, `assigned_to = NULL`, and `company_id` matching the user's tenant).
  3. Bulk insert `facility_activity` records for each created facility referencing the batch id and setting `kind = 'import_created'`.
  4. Update `import_batches` status to `confirmed` with final counts.
- **Rationale**: Keeps database writes atomical. If any insert fails, the transaction is rolled back completely.
- **Alternatives considered**:
  - Non-transactional batching: Rejected because database insertion failures could leave the database in an inconsistent state (some facilities created without activity logs).
