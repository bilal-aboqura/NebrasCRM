# Feature Specification: Facility Management

**Feature Branch**: `003-facility-management`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "Build facility (customer/lead) management for the NEBRASGOO CRM. A 'facility' is a medical organization that the company sells CBAHI accreditation consulting to — it is the central record everything else in the CRM (pipeline stage, follow-ups, calls, offers, contracts) attaches to. This feature builds on Feature 001 (auth, tenant isolation, the four roles, sales-user assignment scope, audit log) and Feature 002 (users belong to one company), and must respect all of their rules."

## Clarifications

### Session 2026-06-16
- Q: What should be the default pre-filled Arabic message for the WhatsApp communication link? → A: It should default to "السلام عليكم ورحمة الله وبركاته، نود التواصل معكم بخصوص خدمات اعتماد سباهي من شركة [اسم الشركة]" where `[اسم الشركة]` is dynamically replaced with the active company's name. Additionally, this template must be configurable per company, stored as a setting on the company profile, and the phone number must be normalized to a digits-only international format for the link.
- Q: How should the system handle duplicate facilities (e.g., same Arabic name or same primary phone) created within the same company? → A: Enforce strict uniqueness on the primary phone number within the same company (tenant-scoped unique constraint), but allow duplicate names to accommodate multi-branch setups.
- Q: Who should be able to see unassigned facilities, and can a Sales User assign/claim an unassigned facility themselves? → A: Unassigned facilities are hidden from Sales Users and only visible to Company Admins, Supervisors, and Super Admins, who must explicitly assign them to a Sales User. Sales Users cannot claim or assign unassigned facilities.
- Q: Should the facility detail page display the recorded activity history stream in this feature, or is it only stored in the database for later features? → A: Display a chronological, read-only activity stream in Arabic directly on the facility detail page showing who made the change, what was changed, when, and the old/new values.
- Q: Should the "City" and "Region" fields be free-text inputs, or should the system enforce a pre-configured list of Saudi Arabian regions and main cities? → A: Standardize inputs using dropdowns populated with main Saudi Arabian regions and their major cities to prevent spelling inconsistencies and ensure reliable filtering.
- Q: Should Sales Users be allowed to recover (unarchive) facilities they owned, or is recovery strictly restricted to Supervisors, Company Admins, and Super Admins? → A: Strictly restricted. Only Supervisors, Company Admins, and Super Admins can recover archived facilities; Sales Users do not have permission to restore archived records.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Facility with Scoped Assignment (Priority: P1)

An authorized employee creates a new medical facility record in the CRM to start tracking it as a potential lead. The newly created facility must be automatically associated with the user's company (tenant), and its owner assignment must respect the user's role.

**Why this priority**: Absolute core requirement. Without the ability to create facility records, no customer management or pipeline tracking can occur.

**Independent Test**:
Log in as a `Sales User` of Company A ("نبراس الجودة"). Open the "إضافة منشأة جديدة" (Add New Facility) form. Enter the Arabic name, select the facility type (e.g., "مجمع طبي"), enter the city/region, primary phone, and select lead source. Verify that the owner field defaults to the logged-in Sales User and cannot be changed by them. Submit the form. Verify that the facility is created, assigned to the Sales User, and scoped to Company A.

**Acceptance Scenarios**:

1. **Given** a logged-in `Sales User` of Company A, **When** they fill out and submit the "Add New Facility" form in Arabic (RTL), **Then** the facility is created, its owner is automatically set to the logged-in Sales User, and its tenant is set to Company A.
2. **Given** a logged-in `Company Admin` or `Supervisor` of Company A, **When** they open the "Add New Facility" form, **Then** they see an optional "Owner" dropdown listing all active `Sales Users` within Company A, allowing them to assign the facility to a Sales User at creation or leave it unassigned.
3. **Given** a logged-in user, **When** they attempt to select a facility type, **Then** the options must be restricted to: Medical Complex (مجمع طبي), Dental Complex (مجمع لطب الأسنان), Lab (مختبر), Radiology (مركز أشعة), or Hospital (مستشفى).

---

### User Story 2 - Tenant-Scoped Paginated Directory with Search & Filtering (Priority: P1)

Users view a list of facilities in a paginated table. The facilities listed must be strictly isolated by tenant and restricted by the user's role-based visibility.

**Why this priority**: Essential for daily sales operations. Users must be able to search and filter their target accounts efficiently while enforcing data isolation.

**Independent Test**:
Log in as a `Sales User` of Company A. Navigate to "قائمة المنشآت" (Facilities List). Verify that only facilities assigned to this Sales User are visible. Verify that no facilities belonging to Company B or other Sales Users in Company A are displayed. Search for a facility by Arabic name or phone number. Filter by city or lifecycle status.

**Acceptance Scenarios**:

1. **Given** a logged-in `Sales User`, **When** they view the facilities list, **Then** they only see active facilities assigned to them within their own company, sorted by creation date, with pagination of 15 records per page.
2. **Given** a logged-in `Supervisor` or `Company Admin`, **When** they view the facilities list, **Then** they see all active facilities belonging to their company, with their assigned owner's name displayed.
3. **Given** a logged-in user, **When** they use the search box, **Then** the list is filtered instantly by matching the query against the facility's Arabic name or primary/secondary phone numbers.
4. **Given** a logged-in user, **When** they apply filters, **Then** they can filter by status (lifecycle status), city, type, and assigned owner (for Admin/Supervisor).
5. **Given** a logged-in `Sales User`, **When** there are unassigned facilities in their company, **Then** these facilities are excluded from their search results and lists, and any direct access attempt is denied.

---

### User Story 3 - Facility Detail Hub & Communication Affordances (Priority: P1)

An authorized user views a facility's detail page, which acts as the hub for all related items and provides interactive links for telephony and WhatsApp.

**Why this priority**: The detail page serves as the central hub for all CRM interactions (contacts, calls, offers, contracts) that will be built in subsequent features.

**Independent Test**:
Log in as a `Sales User` of Company A ("نبراس الجودة"). Click on a facility name from the directory. Verify that the detail page displays all core fields, the current lifecycle status as a colored badge, and notes. Click the "WhatsApp" link and verify it attempts to open a WhatsApp conversation targeting the primary phone number normalized to digits-only international format (e.g. `966500000000`), with the company's custom message template where "نبراس الجودة" has replaced the `[اسم الشركة]` placeholder. Click the primary phone number and verify it invokes the browser's default protocol handler for calling.

**Acceptance Scenarios**:

1. **Given** an authorized user on the facility detail page, **When** they click the primary or secondary phone number, **Then** the browser triggers the `tel:` protocol link to initiate a call.
2. **Given** an authorized user on the facility detail page, **When** they click the WhatsApp button, **Then** the system normalizes the primary phone number by stripping all non-digits (e.g., converting "+966 50-000-0000" to "966500000000"), retrieves the company's custom WhatsApp message template, resolves the active tenant's name in place of `[اسم الشركة]`, URL-encodes the message, and opens a new window directing to `https://wa.me/<normalized_number>?text=<encoded_message>`.
3. **Given** a `Sales User` attempts to access the detail URL of a facility assigned to another user or belonging to another company, **When** the page loads, **Then** the system blocks the request server-side and displays a "Permission Denied" error page.
4. **Given** an authorized user on the facility detail page, **When** there are recorded activities in the facility's history, **Then** the page displays a chronological timeline in Arabic showing the actor, event type, modification details (old and new values), and timestamp.

---

### User Story 4 - Facility Edit & Reassignment (Priority: P1)

Authorized users edit a facility's profile details, update its lifecycle status, or reassign its ownership.

**Why this priority**: Required as the sales cycle progresses. The lifecycle status must update to reflect pipeline progress, and ownership changes must dynamically shift record visibility.

**Independent Test**:
Log in as a `Company Admin`. Open a facility's detail page and click "تعديل" (Edit). Modify the Arabic name, change the lifecycle status from "جديد" (New) to "مهتم" (Interested), and change the assigned owner to another Sales User. Save the changes. Verify that the new owner can now see the facility, while the old owner (if they are a Sales User) can no longer access it. Verify that the status and owner changes are recorded in the facility's activity history.

**Acceptance Scenarios**:

1. **Given** a logged-in `Sales User`, **When** they edit a facility assigned to them, **Then** they can modify all core fields and status, but the owner assignment field is disabled (locked to themselves).
2. **Given** a logged-in `Company Admin`, `Supervisor`, or `Super Admin` (operating under active company context), **When** they edit a facility, **Then** they can reassign the owner to any active `Sales User` in the same company.
3. **Given** a facility's status or owner is changed, **When** the edit is saved, **Then** the system records the change in the facility's activity history, logging who made the change, the old value, the new value, and the timestamp.

---

### User Story 5 - Facility Archival & Recovery (Soft-Delete) (Priority: P2)

Users archive inactive or duplicate facilities to clean up lists without losing historical logs or related data, and administrators recover them if needed.

**Why this priority**: Safeguards business data. Soft-deletion prevents accidental data loss and maintains complete historical audit trails.

**Independent Test**:
Log in as a `Supervisor`. Open a facility and click "أرشفة" (Archive). Confirm the action. Verify the facility disappears from the default facilities directory. Go to filters, toggle "عرض المؤرشف" (Show Archived). Verify the archived facility appears with an "Archived" badge. Click on the archived facility, click "استعادة" (Recover), and verify it returns to the default active list.

**Acceptance Scenarios**:

1. **Given** an active facility, **When** an authorized user clicks "Archive" and confirms, **Then** the facility's active flag is set to false, it is hidden from default lists, and the action is recorded in the activity history.
2. **Given** the facilities list, **When** a user toggles the "Show Archived" filter, **Then** the table displays archived facilities, marked with a distinctive archived tag.
3. **Given** an archived facility, **When** a `Company Admin`, `Supervisor`, or `Super Admin` clicks "Recover", **Then** the facility is restored to active status, and the recovery is logged. `Sales Users` cannot recover archived facilities.

---

### Edge Cases

- **Unauthorized Owner Reassignment Attempt**: If a Sales User attempts to manipulate the payload of an edit request to change the owner of a facility, the server must reject the mutation and return a 403 Forbidden error.
- **Cross-Tenant Access via Direct URL**: If a user from Company A crafts a URL containing a Facility ID belonging to Company B, the server must reject the query with a 404 Not Found (or 403 Forbidden) and must NOT leak the existence or data of Company B's facility.
- **Owner Deactivation**: If a Sales User who owns multiple facilities is deactivated in the system (Feature 002), those facilities remain assigned to them but must be flagged as "Owner Inactive" in lists. Company Admins and Supervisors must be prompted to reassign these facilities to an active Sales User.
- **Archived Facility Direct Link Access**: If a Sales User attempts to access the detail page of an archived facility they own via a direct URL, the page must load successfully but display a clear "Archived" banner.
- **Duplicate Phone Submission**: If a user attempts to create or edit a facility with a primary phone number that already exists in their company's active list, the operation MUST fail with an Arabic message: "رقم الهاتف الرئيسي مسجل بالفعل لمنشأة أخرى في الشركة".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce multi-tenant isolation on all facility queries and mutations. Company A users can never access Company B's facilities.
- **FR-002**: The system MUST enforce role-based access control (RBAC) on facility records:
  - `Sales User` can view and edit only facilities assigned to them.
  - `Supervisor` and `Company Admin` can view and edit all facilities in their company.
  - `Super Admin` is restricted to the active company selected in the company switcher.
- **FR-003**: The system MUST support the following facility fields:
  - Arabic Name (mandatory)
  - Facility Type: Medical Complex, Dental Complex, Lab, Radiology, Hospital (mandatory)
  - City and Region (mandatory, selected from pre-configured dropdowns of Saudi Arabian regions and cities)
  - Primary Phone (mandatory, validated)
  - Secondary Phone (optional)
  - Lead Source: Manually added, Website form, Imported (mandatory)
  - Lifecycle Status: new, contacted, interested, offer, negotiation, contract, lost (mandatory)
  - Assigned Owner (optional, reference to Sales User)
  - Notes (optional, text)
  - Active/Archived flag (mandatory, boolean)
- **FR-004**: When a Sales User creates a facility, the system MUST automatically assign the facility's owner to that Sales User.
- **FR-005**: Only Company Admin, Supervisor, and Super Admin roles MUST be allowed to assign or reassign facility ownership.
- **FR-006**: The system MUST NOT support hard-deletion of facility records. Deletion MUST be implemented as archiving (soft-deletion).
- **FR-007**: The facility detail page MUST provide a click-to-call link for primary/secondary phones and a WhatsApp click-to-chat link.
- **FR-008**: The facilities directory MUST implement pagination, displaying a maximum of 15 records per page.
- **FR-009**: The directory page MUST support search by facility name and phone number, and filtering by city, status, facility type, and assigned owner.
- **FR-010**: Every lifecycle status change, owner assignment change, archival, and recovery event MUST be recorded in a `FacilityActivity` log table, storing the facility ID, user ID (actor), event type, old value, new value, and timestamp. The facility detail page MUST display this log as a chronological, read-only activity timeline.
- **FR-011**: All interfaces MUST be rendered in Arabic (`lang="ar"`, `dir="rtl"`) using the `Tajawal` typeface and respect the system design palette.
- **FR-012**: The system MUST support a configurable WhatsApp message template at the Company (tenant) settings level, which defaults to: "السلام عليكم ورحمة الله وبركاته، نود التواصل معكم بخصوص خدمات اعتماد سباهي من شركة [اسم الشركة]".
- **FR-013**: When generating the WhatsApp link, the system MUST replace the `[اسم الشركة]` placeholder with the active company's Arabic name and URL-encode the resulting message.
- **FR-014**: The system MUST normalize the facility's primary phone number to a digits-only international format (removing spaces, symbols, and leading zeroes to produce a valid `wa.me/<number>` target) before appending it to the WhatsApp link.
- **FR-015**: The system MUST enforce that the primary phone number of a facility is unique within the same company (tenant-scoped uniqueness), blocking creation or editing if another active facility has the same number.
- **FR-016**: Unassigned facilities (where the owner is null) MUST be visible only to Company Admin, Supervisor, and Super Admin roles. Sales Users MUST NOT be able to view, search, or access unassigned facilities.
- **FR-017**: Only Company Admin, Supervisor, and Super Admin roles MUST be allowed to recover (unarchive) archived facility records. Sales Users MUST NOT be allowed to recover archived records.

### Key Entities *(include if feature involves data)*

- **Company (Tenant Extension)**:
  - `whatsapp_template`: Text field containing the configurable template with placeholder support (defaulting to the standard text).
- **Facility**:
  - `id`: Unique identifier (UUID).
  - `company_id`: References the owning Company (tenant isolation).
  - `name_ar`: Arabic name of the facility.
  - `type`: Enum (medical_complex, dental_complex, lab, radiology, hospital).
  - `city`: Name of city.
  - `region`: Name of region.
  - `primary_phone`: Main contact phone number (must be unique within the company).
  - `secondary_phone`: Alternative contact phone number.
  - `lead_source`: Enum (manual, website, import).
  - `lifecycle_status`: Enum (new, contacted, interested, offer, negotiation, contract, lost).
  - `assigned_owner_id`: References User (must have `Sales User` role and belong to the same `company_id`).
  - `notes`: Text block.
  - `is_active`: Boolean flag indicating if the facility is active or archived.
  - `created_at`: Timestamp.
  - `updated_at`: Timestamp.
- **FacilityActivity**:
  - `id`: Unique identifier (UUID).
  - `facility_id`: References the associated Facility.
  - `actor_id`: References the User who performed the action.
  - `event_type`: Type of activity (e.g., `status_change`, `owner_change`, `archive`, `restore`, `create`, `update`).
  - `old_value`: String representation of the old value.
  - `new_value`: String representation of the new value.
  - `created_at`: Timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of data reads and writes for facilities are constrained by `company_id` at the database level.
- **SC-002**: A Sales User querying, filtering, or directly loading a facility ID not assigned to them must receive 0 records or a 403 error.
- **SC-003**: Main directory loads and filters return results in under 1.5 seconds.
- **SC-004**: The facility detail page serves as an extensible hub with placeholders ready for subsequent sub-resources (contacts, follow-ups, calls, contracts).

## Assumptions

- **Existing Users and Company**: The authentication and tenant isolation layers (Feature 001) and user management layers (Feature 002) are fully functional and provide context for `company_id` and user roles.
- **Saudi Geography**: The cities and regions dropdown values will be populated with a standard static list of Saudi Arabian regions and their major cities.
- **Log Accessibility**: The `FacilityActivity` log table is separate from the system security `AuditLog` table, structured specifically to display a user-facing activity stream on the facility detail page in future updates.
- **Settings UI**: The Company settings page (Feature 002 extension) will support editing the `whatsapp_template` field by Super Admins and Company Admins.
