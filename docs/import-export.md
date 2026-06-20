# Bulk Import & Export — Feature 011

> **Stack**: Next.js App Router · TypeScript · SheetJS (`xlsx`) · PostgreSQL/Supabase + RLS

## Overview

Feature 011 adds bulk data management capabilities to NebrasCRM:

- **Import**: Company Admins, Supervisors, and Super Admins can upload Arabic-formatted Excel/CSV files to bulk-create facility leads with a preview-then-confirm workflow.
- **Export**: All authenticated roles can export filtered CRM data (Facilities, Follow-ups, Offers, Contracts) to RTL Arabic-labeled Excel files.

---

## Architecture

### New Source Files

```
src/lib/import-export/
├── parser.ts        # SheetJS file parser; Arabic header → field name mapping
├── generator.ts     # Excel template & export file generation (RTL, Arabic headers)
└── validator.ts     # Per-row validation; duplicate detection (DB + in-file)

src/lib/data/
└── import-batches.ts  # In-memory import batch store (mirrors import_batches table)

src/app/api/facilities/
├── import/
│   ├── template/route.ts   # GET  – Download blank Arabic template
│   ├── preview/route.ts    # POST – Upload file, validate rows, return preview
│   └── confirm/route.ts    # POST – Commit previewed batch to DB
└── export/route.ts         # GET  – Export filtered facilities list

src/app/api/followups/export/route.ts    # GET – Export follow-ups
src/app/api/offers/export/route.ts       # GET – Export offers
src/app/api/contracts/export/route.ts    # GET – Export contracts

src/app/(dashboard)/dashboard/facilities/components/
├── ImportModal.tsx     # 3-step import flow: upload → preview → confirm
├── ExportButton.tsx    # Reusable client button; triggers any export URL
└── FacilitiesToolbar.tsx  # Composes Import + Export controls for facilities page
```

### Database Changes

Migration: `supabase/migrations/20260620000000_bulk_import_export.sql`

| Table | Purpose |
|-------|---------|
| `system_settings` | Key/value store; `max_import_rows` (default 1000) |
| `import_batches` | Tracks import operations; status: `preview → confirmed / failed` |

---

## Import Flow

```
User uploads file
  → POST /api/facilities/import/preview
    → parseImportFile() [parser.ts]       reads xlsx/csv; maps Arabic headers
    → validateFacilityRows() [validator.ts] checks required fields, phone format, duplicates
    → Creates preview batch in import_batches
    → Returns batchId + summary + rows (status: valid / error / duplicate)

User reviews preview and clicks "Confirm"
  → POST /api/facilities/import/confirm { batchId }
    → Inserts only "valid" rows as facilities (status=new, ownerId=null)
    → Logs facility_activity record per facility (kind=import_created)
    → Updates import_batches.status = "confirmed"
    → Returns { success, importedCount, skippedCount }
```

## Export Flow

```
User clicks "تصدير Excel" on any list page
  → GET /api/{entity}/export[?filters...]
    → Applies company_id scoping + role visibility
    → generateExcelExport() [generator.ts] builds RTL xlsx
    → Returns binary download with Content-Disposition header
```

---

## RBAC Summary

| Action | super_admin | company_admin | supervisor | sales_user |
|--------|:-----------:|:-------------:|:----------:|:----------:|
| Download template | ✓ | ✓ | ✓ | ✗ |
| Upload & preview | ✓ | ✓ | ✓ | ✗ |
| Confirm import | ✓ | ✓ | ✓ | ✗ |
| Export facilities | ✓ (all) | ✓ (company) | ✓ (company) | ✓ (owned only) |
| Export followups | ✓ (all) | ✓ (company) | ✓ (company) | ✓ (owned only) |
| Export offers | ✓ (all) | ✓ (company) | ✓ (company) | ✓ (owned only) |
| Export contracts | ✓ (all) | ✓ (company) | ✓ (company) | ✓ (owned only) |

---

## Import File Format

The template (`/api/facilities/import/template`) produces an `.xlsx` with these RTL Arabic columns:

| اسم المنشأة | نوع المنشأة | المدينة | المنطقة | الهاتف الرئيسي | الهاتف الفرعي | مصدر العميل | ملاحظات |
|------------|------------|--------|--------|--------------|--------------|------------|--------|

- **الهاتف الرئيسي**: must be a valid Saudi mobile number (05xxxxxxxx / +9665xxxxxxxx)
- **مصدر العميل**: defaults to `imported` if blank

---

## Configuration

`max_import_rows` is stored in the `system_settings` table (default: 1000).

```sql
-- View current limit
SELECT value FROM public.system_settings WHERE key = 'max_import_rows';

-- Update limit (requires super_admin)
UPDATE public.system_settings SET value = '500' WHERE key = 'max_import_rows';
```

---

## Running Tests

```bash
npm test
# or run only import/export tests:
npx vitest run tests/integration/import-template.test.ts tests/integration/import-preview.test.ts tests/integration/import-confirm.test.ts tests/integration/export-facilities.test.ts tests/integration/export-other.test.ts
```
