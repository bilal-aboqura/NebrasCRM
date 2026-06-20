# Feature Specification: Bulk Import & Export

**Feature Branch**: `011-bulk-import-export`  
**Created**: 2026-06-18  
**Status**: Draft  
**Input**: User description: "Build bulk import and export for the NEBRASGOO CRM: upload an Excel/CSV file to create multiple facilities at once, and export the current filtered list of facilities to an Excel file. It builds on Features 001–009 (auth, tenant isolation, roles, facility management with phone normalization and duplicate-uniqueness rules, the facility_activity timeline) and must respect all of their rules."

## Clarifications

### Session 2026-06-20

- Q: Should the bulk import activity be logged only as a single aggregate entry in a global/company activity log, or should each newly created facility also receive an individual "Created via Import" timeline entry in its own history? → A: Both Aggregate & Individual Entries. A single entry in the global log, plus an individual `FacilityActivity` entry for every imported facility (`event_type = 'create'`, `new_value = 'imported'`).
- Q: What is the maximum number of rows allowed in a single upload file to prevent server performance issues? → A: Max 1,000 rows. Sufficient for typical offline lists, keeps preview parsing extremely fast, and prevents server timeouts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download Import Template (Priority: P1)

Authorized users (Company Admin, Supervisor, Super Admin) download a pre-formatted Arabic-labeled Excel template to ensure their offline data matches the expected schema.

**Why this priority**: Crucial first step. Users need to know the exact fields and structure expected by the system to successfully prepare their data.

**Independent Test**:
Log in as a `Company Admin`. Navigate to the "استيراد المنشآت" (Import Facilities) page. Click the "تحميل نموذج البيانات" (Download Template) button. Verify that a `.xlsx` file downloads immediately without requiring any file upload. Open the template and verify that the column headers are in Arabic and match the required schema.

**Acceptance Scenarios**:

1. **Given** a logged-in `Company Admin`, `Supervisor`, or `Super Admin`, **When** they request to download the template, **Then** the system serves a downloadable Excel (.xlsx) file.
2. **Given** the downloaded template, **When** opened, **Then** it must contain the following exact Arabic headers in the first row (from right-to-left):
   - اسم المنشأة (Facility Name - Required)
   - نوع المنشأة (Facility Type - Required)
   - المدينة (City - Required)
   - المنطقة (Region - Required)
   - الهاتف الرئيسي (Primary Phone - Required)
   - الهاتف الفرعي (Secondary Phone - Optional)
   - مصدر العميل (Lead Source - Optional)
   - ملاحظات (Notes - Optional)

---

### User Story 2 - Upload & Preview Import (Priority: P1)

Authorized users upload an Excel or CSV file and preview the parsed data, validation errors, and duplicates before committing any records to the database.

**Why this priority**: Core safety constraint. Prevents corrupted or duplicate data from being written directly to the database and allows users to self-correct files.

**Independent Test**:
Log in as a `Supervisor`. Navigate to the Import page and upload a test CSV file containing 10 rows: 5 valid rows, 2 rows with invalid phone formats, 1 row missing the facility name, and 2 rows containing primary phones that already exist in the company's active database. Verify that the system does not create any facilities yet, and displays a summary page in Arabic showing:
- Total rows: 10
- Valid rows: 5
- Errors: 3 (with row-by-row Arabic explanations of the errors)
- Duplicates: 2 (identifying the duplicate phone numbers)

**Acceptance Scenarios**:

1. **Given** an authorized user, **When** they upload an Excel or CSV file, **Then** the system parses the file in memory and performs validation checks:
   - Required columns present and non-empty.
   - Facility Type matches permitted enum values (مجمع طبي, مجمع لطب الأسنان, مختبر, مركز أشعة, مستشفى).
   - Primary phone number is normalized using the project's standard normalization logic.
   - Primary phone number does not duplicate any active facility within the user's company (tenant-scoped).
2. **Given** the parsed upload, **When** the validation is complete, **Then** the system presents an Arabic RTL preview page summarizing the counts and listing all rows categorized by status (Valid, Invalid with specific error message, or Duplicate with warning).
3. **Given** a logged-in `Sales User`, **When** they attempt to access the import route, **Then** the system denies access with a 403 Forbidden page and blocks any API endpoint mutations.

---

### User Story 3 - Confirm Import & Activity Logs (Priority: P1)

Authorized users confirm the previewed records, importing only the valid, non-duplicate facilities while logging the operation in the activity system.

**Why this priority**: Completes the import flow by inserting the records into the database while maintaining complete traceability.

**Independent Test**:
From the preview screen of User Story 2, click the "تأكيد الاستيراد" (Confirm Import) button. Verify that the 5 valid facilities are created in the database and assigned to the user's company. Verify that their owner is unassigned, status is set to "جديد" (New), and lead source is set to "imported". Go to the activity log and verify that the import batch event is logged.

**Acceptance Scenarios**:

1. **Given** a preview screen, **When** the user clicks "Confirm Import", **Then** the system commits only the valid, non-duplicate rows to the database. Rows with validation errors or duplicate warnings are skipped.
2. **Given** the imported records, **When** they are inserted, **Then** they must inherit:
   - `company_id` matching the user's current company.
   - `lifecycle_status` set to "new".
   - `lead_source` set to "imported".
   - `assigned_owner_id` set to NULL (unassigned).
3. **Given** a completed import, **When** the database transaction succeeds, **Then** the system logs the import batch in the activity system, recording the user who performed it, the timestamp, and the count of imported records.

---

### User Story 4 - Export Filtered Facilities (Priority: P1)

All users can export their current filtered, authorized list of facilities to an Excel file.

**Why this priority**: Essential feature for reporting, offline analysis, and data portability.

**Independent Test**:
Log in as a `Sales User`. Filter the facilities list by City = "جدة". Click "تصدير إلى إكسل" (Export to Excel). Verify that the downloaded file contains only facilities assigned to this Sales User that are located in Jeddah. Verify that no records from other users or companies are included.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they click "Export to Excel" from the facilities directory, **Then** the system generates and downloads an Excel (.xlsx) file containing the records matching the current filters (status, city, type, owner) and the user's visibility scope.
2. **Given** the exported file, **When** opened, **Then** it must display RTL-oriented columns with Arabic headers:
   - اسم المنشأة
   - نوع المنشأة
   - المدينة
   - المنطقة
   - الهاتف الرئيسي
   - الهاتف الفرعي
   - مصدر العميل
   - حالة العميل (Lifecycle Status)
   - المالك المعين (Assigned Owner)
   - ملاحظات
   - تاريخ الإنشاء
3. **Given** any export request, **When** the query runs, **Then** the server MUST enforce tenant isolation (`company_id`) and role-scoped visibility to prevent any cross-tenant data leakage.

---

### User Story 5 - Export Follow-ups, Offers, and Contracts Lists (Priority: P2)

Users export other filtered CRM tables (follow-ups, offers, and contracts) following the same visibility-scoped and filter-scoped pattern.

**Why this priority**: Extends data portability to the downstream objects in the sales pipeline.

**Independent Test**:
Log in as a `Supervisor`. Navigate to the "عروض الأسعار" (Offers) list. Filter by Status = "ساري" (Active). Click Export. Verify that the downloaded Excel file contains the filtered list of company offers, with Arabic headers matching the offer fields.

**Acceptance Scenarios**:

1. **Given** a user viewing the Follow-ups, Offers, or Contracts list, **When** they request an export, **Then** the system generates an Excel file containing only the records that the user is authorized to see and that match their active search/filters.
2. **Given** the exported file, **When** opened, **Then** it must contain columns matching the entity's core fields with Arabic headers.

---

### Edge Cases

- **Duplicate Primary Phone in the Uploaded File**: If the uploaded file itself contains two rows with the same normalized primary phone number, the first row is validated as ready to import, and the second row is marked as a duplicate in the preview.
- **Malformed Columns / Encoding Issues**: If the uploaded file uses a non-standard encoding or has missing columns, the system must show a user-friendly error in Arabic: "الملف المرفوع غير صالح أو يحتوي على أعمدة غير متطابقة مع النموذج".
- **Empty Rows**: The parser must ignore empty rows at the end of the file instead of reporting them as validation errors.
- **Cross-Tenant Mutation Attempt**: If a malicious user intercepts the import API request and changes the tenant context or company ID, the server-side controller must reject the request and throw a 403 Forbidden error.
- **Large Dataset Exports**: If exporting a list with thousands of records, the export must stream or page the database queries to avoid memory exhaustion on the server.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST restrict bulk import access to `Company Admin`, `Supervisor`, and `Super Admin` roles. `Sales Users` MUST be blocked from importing.
- **FR-002**: The system MUST allow all authenticated roles to export facilities, follow-ups, offers, and contracts, but MUST enforce tenant isolation (`company_id`) and role-based visibility scope (e.g. Sales Users export only their assigned records).
- **FR-003**: The import module MUST support parsing Excel (.xlsx) and CSV files.
- **FR-004**: The system MUST provide a link to download an Arabic-labeled template file (.xlsx) representing the expected facility schema columns.
- **FR-005**: During import parsing, the system MUST validate:
  - Presence of required columns (Name, Type, City, Region, Primary Phone).
  - Match of facility type with existing enums.
  - Normalization of primary and secondary phone numbers via the shared project utility `normalizeSaudiPhone`.
- **FR-006**: The system MUST perform a database uniqueness check against the normalized primary phone number of existing active facilities in the same company. Rows with existing numbers MUST be flagged as duplicates.
- **FR-007**: The system MUST require a preview stage. No records may be inserted directly without showing a summary of valid, invalid, and duplicate rows.
- **FR-008**: Upon user confirmation of the preview, the system MUST insert only the valid, non-duplicate records. All imported records must have:
  - `lifecycle_status` set to "new".
  - `lead_source` set to "imported".
  - `assigned_owner_id` set to NULL (unassigned).
- **FR-009**: The system MUST log each import batch in the activity system, recording the actor, timestamp, and number of imported rows.
- **FR-010**: The system MUST log both a single aggregate entry in the company-wide activity log and individual `FacilityActivity` entries for each newly created facility, setting the event type to "create" and the new value/source to "imported".
- **FR-011**: The export files for facilities, follow-ups, offers, and contracts MUST be generated in Excel (.xlsx) format.
- **FR-012**: The export files MUST respect active filters and have columns formatted with Arabic headers and a right-to-left layout where supported.
- **FR-013**: The system MUST enforce a maximum limit of 1,000 rows per uploaded file for bulk import to ensure server stability and rapid response times.

### Key Entities *(include if feature involves data)*

- **Facility (Database Entity - Extension)**:
  - Supports the `lead_source` value "imported".
- **FacilityActivity (Database Entity - Existing)**:
  - Logs `event_type` "import" with details on the batch size and execution context.
- **ImportLog (New Entity or Log Table)**:
  - Tracks bulk import operations:
    - `id`: UUID.
    - `company_id`: Tenant reference.
    - `user_id`: Reference to the user who uploaded the file.
    - `filename`: Name of the uploaded file.
    - `success_count`: Number of successfully imported facilities.
    - `error_count`: Number of skipped rows (duplicates + validation errors).
    - `created_at`: Timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of imported facilities are assigned the user's active `company_id` and have an owner set to NULL.
- **SC-002**: 100% of exported files strictly contain only data within the user's role-based and tenant-isolated visibility scope.
- **SC-003**: The preview page processes and displays validation results for a 500-row spreadsheet in less than 3 seconds.
- **SC-004**: System blocks all import attempts from `Sales User` accounts with a 403 Forbidden response.

## Assumptions

- **Shared Phone Utility**: The project's existing `normalizeSaudiPhone` utility in `src/lib/utils/phone.ts` is fully tested and suitable for phone cleaning during imports.
- **Saudi Geography Data**: Standard lists for Saudi regions and cities from Feature 003 are available as validation sets for the import parser.
- **Excel Library**: An appropriate lightweight server or client library (e.g. `xlsx` or `exceljs`) is available to read and write Excel files in the Next.js runtime.

---

## Open Questions

### Question 1: Activity Logging Scope

**Context**: In FR-009, each import batch is logged in the activity system.

**What we need to know**: Should the bulk import activity be logged only as a single aggregate entry in a global/company activity log (e.g., "User X imported 45 facilities"), or should each newly created facility also receive an individual "Created via Import" timeline entry in its own history?

**Suggested Answers**:

| Option | Answer | Implications |
|--------|--------|--------------|
| A      | Aggregate Entry Only | A single entry is created in a global activity log. Individual facility timelines start empty or with their first manual edit. Faster database insertion during import. |
| B      | Both Aggregate & Individual Entries | A single entry in the global log, PLUS an individual `FacilityActivity` entry for every imported facility (event_type = 'create', new_value = 'imported'). Provides a full history for each facility, but requires more database writes. |
| C      | Individual Entries Only | No global batch log. Each facility simply has a `FacilityActivity` entry indicating it was created via import. |

**Your choice**: Option B (Both Aggregate & Individual Entries)

---

### Question 2: Row Limit Policy

**Context**: In FR-013, we need to handle file size and row limit boundaries.

**What we need to know**: What is the maximum number of rows allowed in a single upload file to prevent server performance issues?

**Suggested Answers**:

| Option | Answer | Implications |
|--------|--------|--------------|
| A      | Max 1,000 rows | Sufficient for typical offline lists, keeps preview parsing extremely fast and prevents server timeout. |
| B      | Max 5,000 rows | Allows larger batches, but might require async processing or streaming. |
| C      | No limit enforced | Relies entirely on database and HTTP timeout limits. High risk of memory exhaustion or timeouts. |

**Your choice**: Option A (Max 1,000 rows)
