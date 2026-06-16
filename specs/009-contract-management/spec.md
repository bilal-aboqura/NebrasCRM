# Feature Specification: Contract Management

**Feature Branch**: `009-contract-management`  
**Created**: 2026-06-17  
**Status**: Draft  
**Input**: User description: "Build contract management for the NEBRASGOO CRM. A 'contract' is the signed agreement with a facility for accreditation-prep services — typically created from an accepted offer. It records the committed value, duration, and lifecycle of a won deal. It builds on Features 001–008 (auth, tenant isolation, roles, the facility entity with its status/visibility/assignment rules, contacts, the accepted-offer entity, the facility_activity timeline, the Feature 005 terminal-stage confirmation, the management-recovery pattern) and must respect all of their rules."
## Clarifications

### Session 2026-06-17
- Q: What should be the default expiration duration for the short-lived signed URLs generated for viewing/downloading the signed contract documents? → A: 15 Minutes: Signed URLs expire 15 minutes after generation.
- Q: Who is authorized to transition a contract to "Completed" or "Terminated" status? → A: Managers Only: Only Supervisor, Company Admin, and Super Admin roles can complete or terminate contracts. Sales Users can only view them.
- Q: Once a contract is moved to the "Active" status, can the contract value or dates be modified? → A: Strictly Immutable: Once active, the contract value, start date, and end date cannot be edited by any role. Changes require termination or a new contract.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Contract from Accepted Offer (Priority: P1)

An authorized representative creates a new contract for a facility. Typically, this is done by selecting an accepted offer, which pre-fills the contract value, parent facility, linked contact, and links the source offer. Alternatively, they can create a contract manually. Upon saving, the system auto-generates a unique reference number.

**Why this priority**: Core prerequisite. Contracts must be created in draft before they can be activated or completed.

**Independent Test**:
Log in as a `Sales User` of Company A. Navigate to an assigned facility that has an accepted offer. Click "إنشاء عقد" (Create Contract) next to the accepted offer. Verify the form opens with the facility name, linked contact, and contract value (SAR) pre-filled from the offer. Save as draft. Verify that the system assigns a unique reference number. Log in as a Company B user and verify they cannot see or access this draft contract.

**Acceptance Scenarios**:

1. **Given** a facility detail page with an accepted offer, **When** the user clicks "Create Contract", **Then** the system presents a form with fields pre-filled from the offer: Facility, Linked Contact, Value (SAR), and Source Offer.
2. **Given** a contract creation form, **When** saved, **Then** the system generates a unique reference number in the format `CON-YYYY-XXXX` (where YYYY is the current year and XXXX is a sequential number starting at 0001 scoped per company_id and year, generated atomically and concurrency-safe), stores the contract in `draft` status, and logs a `contract_created` event in the facility activity timeline.
3. **Given** a contract, **When** a user links an offer or contact, **Then** the server MUST validate that they belong to the same facility and company.

---

### User Story 2 - Contract Activation and Facility Stage Sync (Priority: P1)

When the signed contract is ready, the representative activates it (transitioning from draft to active). This represents a won deal, and the system prompts the user to advance the facility's lifecycle stage.

**Why this priority**: Marks the official start of the commercial engagement and drives pipeline state.

**Independent Test**:
Log in as a `Sales User`. Open a draft contract. Fill in the start and end dates. Click "تفعيل العقد" (Activate Contract). Verify that the system changes status to "Active" (نشط), logs `contract_activated` in the activity timeline, and displays a confirmation dialog asking to advance the facility stage to "Contract" (reusing the Feature 005 terminal-stage logic). Confirm the transition and verify the facility status updates.

**Acceptance Scenarios**:

1. **Given** a draft contract with valid start and end dates, **When** the user clicks "Activate", **Then** the status changes to `active`, the activation event is logged, and the system prompts the user to confirm advancing the parent facility's lifecycle stage.
2. **Given** a contract activation prompt, **When** confirmed by the user, **Then** the parent facility status is updated to `contract` (reusing Feature 005 confirmation dialog).

---

### User Story 3 - Contract Lifecycle and Derived States (Priority: P2)

Contracts move through a lifecycle (draft → active → completed / terminated). They also display derived states ("Expiring soon" and "Expired") computed dynamically.

**Why this priority**: Essential for contract management and operations, alerting reps when deals need renewal.

**Independent Test**:
Log in as a `Sales User`. View the contracts directory. Verify that a contract whose end date is past displays as "Expired" (منتهي). Verify that a contract whose end date is approaching (within a configurable threshold of days, defaulting to 60 days, stored in company settings) displays as "Expiring Soon" (ينتهي قريباً) in Riyadh timezone. Select an active contract, click "إنهاء مبكر" (Early Termination), enter a date and reason, and verify status changes to "Terminated" (ملغى).

**Acceptance Scenarios**:

1. **Given** an active contract, **When** the current date is past the end date, **Then** the system displays the derived status as "Expired" (منتهي), computed server-side in the `Asia/Riyadh` timezone.
2. **Given** an active contract, **When** the end date is within the warning threshold, **Then** the system displays the status as "Expiring Soon" (ينتهي قريباً).
3. **Given** an active contract, **When** an authorized manager (Supervisor, Company Admin, or Super Admin) terminates it early, **Then** they must input a termination date and reason, status changes to `terminated`, and the event is logged. Sales Users do not have permission to terminate contracts.

---

### User Story 4 - Contracts Directories and Scoped Access (Priority: P1)

Users view contracts in the facility detail tab and a global "العروض/العقود" (Contracts) directory. Visibility is strictly isolated by company and user role.

**Why this priority**: Enforces security across tenants and organizes daily work for reps and supervisors.

**Independent Test**:
Log in as `Sales User A` of Company A. Navigate to "العقود" (Contracts). Verify you only see contracts of facilities assigned to you. Verify no Company B contracts are visible. Filter by status "Active". Verify totals sum up in SAR. Log in as a Supervisor and verify you see all contracts for your company's facilities.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** accessing the contracts list, **Then** they see a table of contracts scoped by company, displaying Reference, Title, Facility, Value (SAR), Start/End Dates, Owner, and Status badge.
2. **Given** a `Sales User`, **When** querying contracts, **Then** they are restricted to facilities assigned to them. Supervisors/Admins see all contracts in the company.
3. **Given** the contracts directory, **When** filters are applied, **Then** the total value of filtered contracts dynamically updates.

---

### Edge Cases

- **Double-Contract Prevention**: One accepted offer must map to at most one contract. If a user attempts to create a contract linking to an offer that is already associated with an existing contract, the save must fail with an error.
- **Parent Facility Archival Visibility**: If a parent facility is soft-archived, its associated contracts must be hidden from active lists (e.g. the global directory) but their own `is_active` flags remain untouched (derived visibility pattern).
- **Date Chronology Validation**: The start date of a contract must be before the end date. The termination date of a terminated contract must not be before the start date.
- **Contract Document Security**: Signed PDF or image contract files (up to 10MB) MUST be uploaded securely to Supabase Storage in tenant-scoped paths (`/company_id/contracts/`). Access is restricted via short-lived signed URLs (expiring in 15 minutes), inheriting the visibility rights of the contract. File uploads and downloads are logged in the activity timeline. Archiving a contract preserves the file to prevent orphaned records.
- **Active Contract Immutability**: Once a contract's status is changed to `active`, the financial value, start date, end date, and linked offer/contact details become strictly read-only and immutable for all roles. Corrections or scope modifications require terminating the active contract and creating a new one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce strict company isolation. Users from Company A can never access or modify Company B's contracts.
- **FR-002**: The system MUST enforce role-based access control (RBAC) on contracts. Sales Users can view contracts on their assigned facilities and create drafts, but completing, terminating, or recovering contracts is strictly restricted to managers (Supervisor, Company Admin, and Super Admin).
- **FR-003**: A contract record MUST support the following fields:
  - `id`: UUID (Primary Key).
  - `company_id`: UUID (References Company).
  - `facility_id`: UUID (References Facility).
  - `contact_id`: UUID (References Contact, nullable).
  - `offer_id`: UUID (References Offer, nullable, unique).
  - `reference_number`: String (unique within company, auto-generated).
  - `title`: String.
  - `value`: Decimal (SAR).
  - `start_date`: Date.
  - `end_date`: Date.
  - `status`: Enum (draft, active, completed, terminated) (default: draft).
  - `payment_terms`: Text (optional).
  - `notes`: Text (optional).
  - `termination_date`: Date (nullable).
  - `termination_reason`: Text (nullable).
  - `is_active`: Boolean (default: true).
  - `created_at` and `updated_at` timestamps.
- **FR-004**: The system MUST prevent mapping an accepted offer to more than one contract.
- **FR-005**: When a contract status is updated to `active` (activated), the system MUST prompt the user in the UI to confirm advancing the parent facility's lifecycle stage to `contract` (reusing Feature 005 terminal-stage dialog logic).
- **FR-006**: The reference number MUST be auto-generated and unique within the company, safe from concurrency issues.
- **FR-007**: Expiring-soon and expired states MUST be derived display states calculated on the server in the `Asia/Riyadh` timezone.
- **FR-008**: All screens and PDF-like print layouts related to contracts MUST use the Tajawal typeface, RTL direction, Arabic formatting, and SAR currency.
- **FR-009**: The contracts directory view MUST support filtering by status (including derived states) and owner (for managers), displaying active totals.
- **FR-010**: Creating, activating, completing, terminating, or archiving a contract MUST log a corresponding event in the parent facility's activity timeline.
- **FR-011**: Deletion of contracts MUST be implemented as soft-archival (`is_active = false`), restricted to users with facility edit rights. Recovery is restricted to managers.
- **FR-012**: The active contracts view MUST exclude contracts whose parent facility is soft-archived (derived visibility pattern).
- **FR-013**: The system MUST auto-generate a unique contract reference number following the format CON-YYYY-XXXX (where YYYY is the current year and XXXX is a sequential number starting at 0001 scoped per company_id and year). The number generation MUST be concurrency-safe (e.g. locked transaction or database sequence) and enforced via a UNIQUE (company_id, reference_number) constraint.
- **FR-014**: The contract warning threshold for the 'Expiring Soon' status MUST be configurable at the company settings level, defaulting to 60 days. The derived states 'Expiring Soon' and 'Expired' MUST be computed dynamically on the server in the Asia/Riyadh timezone.
- **FR-015**: The system MUST support secure file upload of signed contracts (PDF or image format, up to 10MB) to Supabase Storage. File paths must be tenant-scoped and files must only be accessible via short-lived signed URLs (valid for 15 minutes). Access permission MUST inherit the visibility rights of the contract. All file upload/download actions must be recorded in the activity timeline. Archiving a contract MUST preserve its file to prevent orphaned records.
- **FR-016**: Once a contract's status is changed to `active`, `completed`, or `terminated`, all core financial and duration fields (value, start_date, end_date, linked offer, linked contact) MUST become permanently read-only and immutable for all roles.

### Key Entities *(include if feature involves data)*

- **Contract**:
  - `id`: UUID (Primary Key).
  - `company_id`: UUID (References Company).
  - `facility_id`: UUID (References Facility).
  - `contact_id`: UUID (References Contact, nullable).
  - `offer_id`: UUID (References Offer, nullable, unique).
  - `reference_number`: String (unique within company).
  - `title`: String.
  - `value`: Decimal (SAR).
  - `start_date`: Date.
  - `end_date`: Date.
  - `status`: Enum (`draft`, `active`, `completed`, `terminated`).
  - `payment_terms`: Text (nullable).
  - `notes`: Text (nullable).
  - `termination_date`: Date (nullable).
  - `termination_reason`: Text (nullable).
  - `document_path`: String (nullable, path to PDF/image in secure Supabase Storage).
  - `is_active`: Boolean.
  - `created_at`: Timestamp.
  - `updated_at`: Timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of contract records are scoped by `company_id` and isolated at the database level.
- **SC-002**: A Sales User querying or trying to view a contract ID for an unassigned facility receives 0 records or a 403 error.
- **SC-003**: The contracts directory page loads and filters in under 1.5 seconds.
- **SC-004**: Each contract state change (create, activate, complete, terminate, archive, recover) logs a timeline entry on the facility with exact value and author.

## Assumptions

- **Offer Accepted State**: Contracts created from offers require the offer to be in the `accepted` status.
- **Timezone**: All date boundaries are interpreted in the `Asia/Riyadh` timezone.
- **UI Consistency**: Reuses the design components, RTL layout, and forms styling established in Features 001–008.
