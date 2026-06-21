# Implementation Plan: Bulk Import & Export

**Branch**: `011-bulk-import-export` | **Date**: 2026-06-20 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/011-bulk-import-export/spec.md)
**Input**: Feature specification from `/specs/011-bulk-import-export/spec.md`

## Summary

This feature adds bulk import capabilities (allowing Company Admins, Supervisors, and Super Admins to upload Excel/CSV spreadsheets to preview and bulk-create facility leads) and bulk export capabilities (allowing all roles to export filtered, scope-authorized CRM data tables: facilities, follow-ups, offers, and contracts to Arabic-labeled Excel files). SheetJS (`xlsx`) is utilized server-side for file parsing and generation to guarantee security and respect tenant isolation (RLS).

## Technical Context

**Language/Version**: Next.js (App Router), TypeScript (Node.js v20+)  
**Primary Dependencies**: `xlsx` (SheetJS)  
**Storage**: PostgreSQL (Supabase) + RLS policies  
**Testing**: Playwright (E2E & Integration testing)  
**Target Platform**: VPS Node.js server behind Nginx  
**Project Type**: Web Application (Next.js)  
**Performance Goals**: File upload preview processing < 3 seconds for 500-row file; Excel export generation < 3 seconds  
**Constraints**: 
- Configurable maximum upload rows `max_import_rows` (default 1000, read from `system_settings` table).
- Strict server-side RBAC validation (deny by default, Sales users blocked from importing).
- Complete tenant data isolation (`company_id` scoped queries).
**Scale/Scope**: Up to 1000 rows per import, supporting Facilities import; exporting Facilities, Follow-ups, Offers, and Contracts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Principle I: Multi-Tenant Data Isolation** - Confirm all data queries and writes are scoped by `company_id` at the data-access layer.
- [ ] **Principle II: Role-Based Access Control** - Confirm server-side RBAC validation (deny-by-default) is enforced.
- [ ] **Principle III: Arabic-First, RTL, Bilingual** - Confirm UI renders correctly in RTL using the Tajawal font.

## Project Structure

### Documentation (this feature)

```text
specs/011-bulk-import-export/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── import-export-api.md
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260620000000_bulk_import_export.sql    # Database schema updates (import_batches, settings)

src/
├── app/
│   ├── api/
│   │   └── facilities/
│   │       ├── import/
│   │       │   ├── template/route.ts        # Download Arabic Excel template
│   │       │   ├── preview/route.ts         # Validate & preview uploaded spreadsheet
│   │       │   └── confirm/route.ts         # Bulk-insert verified rows inside a transaction
│   │       └── export/route.ts              # Export facilities matching active filters/RLS
│   │   ├── followups/export/route.ts        # Export follow-ups list
│   │   ├── offers/export/route.ts           # Export offers list
│   │   └── contracts/export/route.ts        # Export contracts list
│   └── (dashboard)/
│       └── dashboard/
│           └── facilities/
│               └── components/
│                   ├── ImportModal.tsx      # Modal for upload, preview, and confirmation
│                   └── ExportButton.tsx     # Generic button triggering Excel export action
└── lib/
    └── import-export/
        ├── parser.ts                        # SheetJS parser (Server actions/API routes helper)
        ├── validator.ts                     # Facility field validator and duplicate checker
        └── generator.ts                     # Excel generator using SheetJS
```

**Structure Decision**: A single-project layout integrated directly into the existing Next.js App Router workspace, deploying new route handlers for imports and exports, adding reusable client buttons/modals, and writing database schema migrations under `supabase/migrations`.

## Complexity Tracking

*No violations of the Constitution were made. Data isolation, RBAC, and Arabic-first principles are strictly adhered to.*
