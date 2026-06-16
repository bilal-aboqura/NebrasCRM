# Feature Specification: Contact Management

**Feature Branch**: `004-contact-management`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "Build contact management for the NEBRASGOO CRM. A 'contact' is a person who works at a facility — the decision-makers and points of contact the sales team deals with (e.g., manager, quality officer, owner, procurement). Each facility can have multiple contacts. This feature builds on Features 001–003 (auth, tenant isolation, roles, the facility entity, sales-user assignment scope, phone normalization, and the facility activity timeline) and must respect all of their rules."

## Clarifications

### Session 2026-06-16
- Q: When the active primary contact of a facility is archived, how should the system handle the primary contact designation for that facility? → A: Clear primary status (set `is_primary = false` on the archived contact), leaving the facility with no primary contact.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Contact to Facility (Priority: P1)

An authorized sales representative or manager adds a new contact person to a facility's record. This contact represents a decision-maker or key point of contact.

**Why this priority**: Essential P1. Leads and facilities are organizations, but sales transactions are conducted with individual decision-makers. Reps must be able to record who they are talking to.

**Independent Test**:
Log in as a `Sales User` of Company A. Access a facility detail page for a facility assigned to you. Scroll to the "جهات الاتصال" (Contacts) section and click "إضافة جهة اتصال" (Add Contact). Fill out the form in Arabic: Name (e.g., "أحمد الغامدي"), Job Title (e.g., "مدير المشتريات"), Primary Phone (e.g., "0501234567"), and Notes (e.g., "يفضل التواصل بعد العصر"). Click save. Verify the contact appears in the list and a new activity record is added to the facility timeline.

**Acceptance Scenarios**:

1. **Given** a logged-in user with edit permissions on a facility, **When** they fill out and submit the "Add Contact" form with valid Arabic name, job title, and primary phone, **Then** the contact is successfully created and linked to the facility.
2. **Given** a new contact form, **When** the user saves, **Then** the contact automatically inherits the `company_id` of the parent facility, ensuring strict multi-tenant isolation.
3. **Given** a contact is created, **When** the transaction is committed, **Then** the event is logged in the parent facility's activity timeline (e.g. "تمت إضافة جهة اتصال جديدة: أحمد الغامدي - مدير المشتريات") with the actor, action, and timestamp.

---

### User Story 2 - Highlight & Manage Primary Contact (Priority: P1)

Each facility can have at most one primary contact. Setting a contact as primary highlights them visually and unsets any previous primary contact.

**Why this priority**: P1. Sales reps need to instantly know who the main decision-maker is at a facility to avoid confusion and streamline communication.

**Independent Test**:
Log in as a `Sales User`. Navigate to an assigned facility with two existing contacts (A and B, where A is the current primary). Add or edit contact B and toggle the "جهات الاتصال الرئيسية" (Primary Contact) flag to active. Save changes. Verify that contact B is now highlighted as the primary contact, contact A is no longer marked as primary, and this change is logged in the facility activity timeline.

**Acceptance Scenarios**:

1. **Given** a facility with an existing primary contact, **When** a user adds or edits another contact and marks them as primary, **Then** the system atomically updates both contact records, setting the new one as primary and unsetting the old one.
2. **Given** the contacts list on the facility detail page, **When** a contact is marked as primary, **Then** it is rendered with a distinct highlight (e.g., gold outline or badge, in accordance with the brand tokens `--gold-500` and `--green-900`) and positioned at the top of the contacts directory.
3. **Given** a change in primary contact status, **When** the change is saved, **Then** the facility activity timeline logs the event, capturing the old primary contact's name and the new primary contact's name.

---

### User Story 3 - Edit Contact Details (Priority: P1)

Authorized users edit contact details as roles change, email addresses are updated, or phone numbers change.

**Why this priority**: P1. Contact information changes frequently during long sales cycles. Keeping this information accurate is critical for ongoing sales efforts.

**Independent Test**:
Log in as a `Sales User`. Open an assigned facility, find a contact, and click "تعديل" (Edit). Modify their job title from "مسؤول الجودة" to "مدير الجودة" and add a secondary phone. Save changes. Verify the updated details display instantly in the contacts section and the modifications are logged in the facility activity timeline showing old and new values.

**Acceptance Scenarios**:

1. **Given** a user with facility edit permissions, **When** they modify a contact's fields and save, **Then** the updates are validated and persisted, and a timeline entry is added showing which fields were modified.
2. **Given** a user attempting to edit a contact, **When** the contact belongs to a facility not assigned to the user (for Sales Users) or in another company (all roles), **Then** the request is rejected with a permission denied error.

---

### User Story 4 - Archive & Recover Contacts (Priority: P2)

Contacts are soft-deleted (archived) to preserve historical logs and notes, with management retaining the ability to view and restore them if necessary.

**Why this priority**: P2. Maintains clean directory lists without destroying history or audit trails.

**Independent Test**:
Log in as a `Sales User` and click "أرشفة" (Archive) on an assigned contact. Verify the contact is removed from the default contacts list. Log in as a `Supervisor` or `Company Admin`. Enable the "عرض المؤرشف" (Show Archived Contacts) filter on the facility detail page. Verify the archived contact appears with an "archived" badge. Click "استعادة" (Recover) on that contact. Verify it is restored to active status, visible to the Sales User again, and the action is recorded in the activity timeline.

**Acceptance Scenarios**:

1. **Given** an active contact, **When** a user with facility edit permissions archives it, **Then** the contact's `is_active` flag is set to false, it is hidden from the default contacts list, and the event is logged in the facility timeline.
2. **Given** a facility detail page, **When** a `Supervisor`, `Company Admin`, or `Super Admin` views it, **Then** they see a toggle to "Show Archived Contacts" (`عرض جهات الاتصال المؤرشفة`). `Sales Users` do not see this toggle.
3. **Given** an archived contact, **When** a user with management rights clicks "Recover", **Then** the contact is restored to active status, and the event is logged. A `Sales User` cannot recover archived contacts.
4. **Given** a parent facility is archived, **When** a user views the system, **Then** all contacts associated with that facility are hidden from default views along with the facility itself, but remain intact and reappear once the facility is recovered.
5. **Given** an active primary contact, **When** it is archived, **Then** its primary status is cleared (set to false) so that the facility has no active primary contact.

---

### User Story 5 - Communication Affordances (Priority: P2)

Reps trigger calls and WhatsApp messages directly from the contact card, utilizing normalized phone numbers and prefilled templates.

**Why this priority**: P2. Improves efficiency by allowing quick communication without manually copying numbers or typing standard greetings.

**Independent Test**:
Log in as a `Sales User` of Company A ("نبراس الجودة"). Open a facility detail page. Locate a contact with a primary phone number (e.g. `050 123 4567`). Click the phone icon. Verify the browser attempts to initiate a call (`tel:0501234567`). Click the WhatsApp icon. Verify a new browser tab opens to `https://wa.me/966501234567?text=...` with the company's URL-encoded prefilled message.

**Acceptance Scenarios**:

1. **Given** a contact with a phone number, **When** the user clicks the phone icon, **Then** it triggers a `tel:` link using the raw phone number.
2. **Given** a contact with a phone number, **When** the user clicks the WhatsApp icon, **Then** the phone number is normalized to a digits-only international format (e.g., prepending `966` and stripping leading zero/spaces), the company's configured template (resolving `[اسم الشركة]`) is loaded and URL-encoded, and the user is redirected to the WhatsApp web/app link.

---

### Edge Cases

- **Multiple Primaries Prevention (Race Condition)**: If two users simultaneously attempt to set two different contacts as primary for the same facility, the database transaction/application logic must enforce that at most one contact remains primary, unmarking the other.
- **Direct Database Manipulation (SQL/API Injection)**: If a user attempts to edit a contact ID belonging to Company B by injecting a modified payload, the backend API must verify `company_id` matching and reject the transaction with a 403 Forbidden.
- **Archived Facility Modification Block**: If a user attempts to add, edit, or archive a contact on an archived facility, the system must block the operation and return an error, as archived facilities must be recovered before their contacts can be modified.
- **Contact's Phone Number Sharing**: If multiple contacts at the same facility share the same primary phone number (e.g., facility's main line), the system must allow this (no unique constraint on contact phone numbers, unlike facilities).
- **Invalid Phone Formats**: If a user enters a primary phone number that does not match standard Saudi mobile or landline formats, the form validation must reject it before submission with an Arabic error message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce strict multi-tenant isolation. A contact record carries `company_id` and is query-scoped and write-scoped to the active user's company. Cross-tenant leakage is forbidden.
- **FR-002**: The system MUST enforce inherited role-based access control (RBAC):
  - A user can only view, add, or edit contacts of a facility they have permissions to view or edit.
  - `Sales User` can manage contacts on facilities assigned to them.
  - `Supervisor` and `Company Admin` can manage contacts on any facility in their company.
  - `Super Admin` can manage contacts on any facility in the active company.
- **FR-003**: The contact entity MUST support the following fields:
  - Arabic Name (mandatory)
  - Job Title (mandatory)
  - Primary Phone (mandatory, validated)
  - Secondary Phone (optional)
  - Email (optional, validated email format)
  - Primary Contact Flag (mandatory, boolean, default false)
  - Notes (optional, text)
  - Active Status (mandatory, boolean, default true)
- **FR-004**: Each facility MUST have at most one primary contact. If a contact is set as primary, the system MUST automatically and atomically unset the previous primary contact (if any). If the current primary contact is archived, the system MUST clear its primary status (set `is_primary = false`), leaving the facility with no primary contact.
- **FR-005**: The facility detail page MUST display the active contacts list in a dedicated section (RTL layout) using the design system. The primary contact MUST be highlighted with a distinctive style (e.g., gold badge or border) and sorted to the top of the list.
- **FR-006**: The system MUST support soft-deletion (archiving) of contacts. Contacts are never hard-deleted.
- **FR-007**: Only users with management rights (`Supervisor`, `Company Admin`, `Super Admin`) MUST be able to view archived contacts and recover (unarchive) them. A toggle `عرض جهات الاتصال المؤرشفة` (Show Archived Contacts) must be displayed for these roles only.
- **FR-008**: Archiving a parent facility MUST automatically hide all its associated contacts from default contact lists/queries. Recovering the facility restores the visibility of its active contacts.
- **FR-009**: The contact card MUST render communication affordances:
  - Click-to-call using `tel:` protocol.
  - WhatsApp click-to-chat using `https://wa.me/` protocol.
- **FR-010**: The WhatsApp click-to-chat link MUST use a normalized digits-only international phone format (e.g. `9665xxxxxxxx`) and include the company's custom template message with `[اسم الشركة]` replaced by the active company name and URL-encoded.
- **FR-011**: Any creation, modification, archival, or recovery of a contact MUST log an entry in the `FacilityActivity` log table, showing who did it, what happened, the old/new values, and a timestamp, written in Arabic.
- **FR-012**: All forms, lists, and status indicators related to contacts MUST be fully translated into Arabic, displayed in RTL direction using the `Tajawal` typeface, and adhere to the project's color palette.

### Key Entities *(include if feature involves data)*

- **Contact**:
  - `id`: UUID (Primary Key, autogenerated)
  - `company_id`: UUID (references `companies`, foreign key)
  - `facility_id`: UUID (references `facilities`, foreign key, cascade behavior on delete)
  - `name_ar`: String (Arabic Name, max 150 chars)
  - `job_title`: String (Job Title, max 100 chars)
  - `primary_phone`: String (Primary contact phone)
  - `secondary_phone`: String (Optional alternative phone, nullable)
  - `email`: String (Optional email, nullable)
  - `is_primary`: Boolean (Flag for primary contact, default false)
  - `notes`: Text (Optional notes, nullable)
  - `is_active`: Boolean (Flag for soft delete, default true)
  - `created_at`: Timestamp (automatically set)
  - `updated_at`: Timestamp (automatically set)

- **FacilityActivity (Extension)**:
  - New `event_type` values: `contact_create`, `contact_update`, `contact_archive`, `contact_recover`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of contact operations (CRUD) check and enforce `company_id` match server-side, with zero cross-tenant leakage.
- **SC-002**: Database constraints or transaction controls enforce that no facility ever has more than one active contact marked as primary.
- **SC-003**: The contact lists and cards load on the facility detail page in under 300ms from the page request.
- **SC-004**: All phone numbers are successfully normalized to the E.164 standard (digits-only, prepended with 966) for the WhatsApp link without exceptions.

## Assumptions

- **Parent Visibility**: A user's visibility of a contact is entirely determined by their visibility of the parent facility. If they can see the facility, they can see its active contacts.
- **Shared Phone Numbers**: Unlike facility records where the primary phone number must be unique company-wide, multiple contacts under the same or different facilities within a tenant can share the same primary phone number (e.g., main office number).
- **RTL Support**: The existing styling environment is already configured for RTL layouts and has the `Tajawal` font loaded globally.
- **Activity Log Display**: The parent facility's activity stream on the facility detail page is prepared to display the new contact activity event types automatically.
