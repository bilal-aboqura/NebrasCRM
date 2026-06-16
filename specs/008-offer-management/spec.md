# Feature Specification: Offer (Quote) Management

**Feature Branch**: `008-offer-management`  
**Created**: 2026-06-17  
**Status**: Draft  
**Input**: User description: "Build offer (quote) management for the NEBRASGOO CRM. An 'offer' is a commercial quote sent to a facility for accreditation-prep services — it introduces monetary value, validity, and an accept/reject decision into the CRM. It builds on Features 001–007 (auth, tenant isolation, roles, the facility entity with its status/visibility/assignment rules, contacts, the facility_activity timeline) and must respect all of their rules."
## Clarifications

### Session 2026-06-17
- Q: When a parent facility is soft-archived, what should happen to its associated offers in the global directory? → A: Keep offers active, but filter them out of default active lists using a database join checking the parent facility's active status.
- Q: How should the printable/exportable view of the offer be implemented and accessed by the representative? → A: Browser-native Print Styling: Implement print-specific CSS rules (hiding headers/footers/sidebars, setting page breaks) so the standard browser Print option (Ctrl+P) generates a clean PDF.
- Q: How should the revisions of an offer be numbered and identified in the system? → A: Sequential Version Integers: Store a sequential `version` integer field starting at `1` for the original offer and incrementing (2, 3, etc.) for each revision linked via `parent_offer_id`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Edit Draft Offer (Priority: P1)

An authorized sales representative or manager creates a draft commercial quote (offer) for a facility they have access to. The representative can add multiple line items (service description + amount), apply an optional discount, select a linked contact from the facility's contacts, and set an expiry date. All totals are calculated server-side.

**Why this priority**: Core prerequisite. An offer must be created in draft state before it can be sent, revised, or decided upon.

**Independent Test**:
Log in as a `Sales User` of Company A. Navigate to an assigned facility's detail page. In the "Offers" (العروض) section, click "إنشاء عرض جديد" (Create New Offer). Fill out the title, select a contact associated with this facility, set an expiry date, and add line items. Save the draft. Verify that the subtotal, discount, tax (VAT), and grand total are calculated server-side and rendered correctly in Arabic formatting (SAR). Verify that a user from Company B cannot see or access this draft.

**Acceptance Scenarios**:

1. **Given** a logged-in user on an authorized facility detail page, **When** they create a new offer, **Then** the system presents a form with fields: Title (العنوان), Expiry Date (تاريخ انتهاء الصلاحية), Contact (جهة الاتصال المرتبطة), Line Items (البنود), Discount (الخصم), and Notes (ملاحظات).
2. **Given** an offer form, **When** adding line items, **Then** each line item must contain a description and a numeric amount in SAR.
3. **Given** a draft offer with input values, **When** saving, **Then** the system computes the subtotal (sum of line items), applies the discount (supporting either a percentage or flat SAR amount), applies the VAT tax rate (supporting 15% by default, or 0% for tax-exempt facilities), calculates the grand total server-side, and stores them.
4. **Given** a draft offer, **When** the author is a `Sales User`, **Then** the offer is only editable by them (if the facility is assigned to them) or by Supervisors/Admins.

---

### User Story 2 - Send Offer and Export (Priority: P1)

Once a draft offer is prepared, the sales representative marks it as "Sent" to freeze its pricing content and generate a printable/manual shareable version for the client.

**Why this priority**: Marks the transition from internal draft to official commercial proposal. Immutable pricing prevents discrepancies between what was sent to the client and what is in the CRM.

**Independent Test**:
Log in as a `Sales User`. Open a draft offer. Click "إرسال العرض" (Send Offer). Confirm the action. Verify that the status changes to "Sent" (مرسل) and the sent date is recorded. Verify that the line items, discount, tax, and totals fields are now read-only and cannot be modified. Click "عرض الطباعة" (Print View) and verify a clean RTL, Arabic-first document opens, formatted for printing or export to PDF. Check the facility activity timeline and verify that an entry is recorded: "[User] sent offer [Title] with value [Total] SAR".

**Acceptance Scenarios**:

1. **Given** a draft offer, **When** the user clicks "Send", **Then** the system updates the status to `sent`, records the current timestamp as the sent date, and makes all priced fields (line items, discount, tax, subtotal, total) strictly immutable.
2. **Given** a sent offer, **When** a user views its detail, **Then** the system provides a printable view using a clean, professional RTL layout containing the company logo, facility name, linked contact info, line items, totals, expiry date, notes, and terms, optimized for browser-native print (Ctrl+P) by hiding navigation and app chrome via print-specific CSS.
3. **Given** a sent offer, **When** the status is changed to sent, **Then** the system automatically logs a new event in the parent facility's activity timeline (who, what, when, and grand total).

---

### User Story 3 - Revise Sent Offer (Priority: P2)

If a sent offer requires changes (e.g., negotiating pricing or scope), the user creates a new revision. The original sent offer remains immutable as a historical record, and a new linked draft offer is generated.

**Why this priority**: Essential for keeping a clean audit trail. Business history is preserved so reps and managers can track how a quote changed during negotiation.

**Independent Test**:
Log in as a `Sales User`. Open a sent offer. Click "تعديل وإنشاء نسخة جديدة" (Revise and Create New Version). Verify that a new draft offer is created with the title suffixed (e.g., "- نسخة 2" or "- مراجعة 2"), referencing the original offer's UUID as parent. Verify all lines, contacts, and notes are copied over. Edit the new draft's prices and save. Verify the original sent offer remains unchanged with its original status and prices.

**Acceptance Scenarios**:

1. **Given** an offer in `sent` or `rejected` status, **When** the user clicks "Revise", **Then** the system creates a new offer in `draft` status, copies all line items, discount, contact, and notes from the parent offer, populates `parent_offer_id` pointing to the original offer, and assigns a sequential `version` integer (incrementing the parent's version by 1).
2. **Given** a new revision draft, **When** it is saved or sent, **Then** the parent facility activity timeline records the creation of this revision.
3. **Given** a facility detail page, **When** listing offers, **Then** the system displays the version tree or groups revisions, showing the active/newest version prominently while allowing access to previous immutable versions.

---

### User Story 4 - Record Client Decision (Priority: P1)

The representative records whether the client accepted or rejected the sent quote, updating the pipeline value and log.

**Why this priority**: Drives commercial outcomes and pipeline data. Records the final outcome of the sales effort.

**Independent Test**:
Log in as a `Sales User`. Select a sent offer. Click "قبول العرض" (Accept Offer) or "رفض العرض" (Reject Offer). Enter a decision note. Submit. Verify the status changes to "Accepted" (مقبول) or "Rejected" (مرفوض), and the decision date is captured. Check the parent facility activity timeline and verify that an entry is recorded showing who accepted/rejected the offer and the decision note.

**Acceptance Scenarios**:

1. **Given** a `sent` offer, **When** the user marks it as accepted, **Then** the status changes to `accepted`, the current date is stored as `decision_date`, and the event is recorded in the facility timeline with its monetary value.
2. **Given** a `sent` offer, **When** the user marks it as rejected, **Then** the status changes to `rejected`, the current date is stored as `decision_date`, an optional rejection reason note is recorded, and the event is logged.
3. **Given** an accepted or rejected offer, **When** a user attempts to edit its fields, **Then** all priced and metadata fields remain immutable.
4. **Given** a decision on an offer, **When** submitted and marked as accepted, **Then** the system MUST prompt the user to confirm advancing the parent facility's lifecycle status (reusing the Feature 005 terminal-stage confirmation prompt logic); if marked as rejected, no automatic status transition occurs.

---

### User Story 5 - Dedicated Offers Directory and Scoped Access (Priority: P1)

Users view their offers in two places: the facility detail page and a dedicated "Offers" (العروض) view. Access is strictly scoped by company and user role.

**Why this priority**: Critical for management visibility and rep workflow organization. Enforces data security across companies.

**Independent Test**:
Log in as `Sales User A` of Company A. Navigate to the "العروض" view from the main sidebar. Verify you only see offers for facilities assigned to you. Verify no Company B offers are listed. Filter by status "Draft". Verify that the bottom summary shows the sum of draft offers. Log in as `Supervisor A` of Company A. Filter by Sales User A. Verify you see all of Sales User A's offers and other reps' offers in Company A.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** accessing the "العروض" page, **Then** they see a table of offers within their company, displaying: Offer Title, Parent Facility, Linked Contact, Total Value (SAR), Expiry Date, Owner, and Status badge.
2. **Given** the "العروض" directory, **When** a `Sales User` views it, **Then** they only see offers for facilities assigned to them. When a `Supervisor` or `Company Admin` views it, they see all offers in the company.
3. **Given** the "العروض" directory, **When** the user filters by status or owner, **Then** the total value summary updates to show the sum of the filtered offers.
4. **Given** a facility detail page, **When** loading the "العروض" tab, **Then** it lists all offers linked to that facility in descending order of creation, showing version numbers and statuses.

---

### Edge Cases

- **Expired Date Validation & Display**: An offer whose validity date is in the past, status is `sent`, and is not yet `accepted` or `rejected`, must display the status "Expired" (منتهي الصلاحية). This state is computed server-side in `Asia/Riyadh` timezone. If the client attempts to accept an expired offer, the system should allow it, but flag it in the activity timeline that an expired offer was accepted.
- **Cross-Tenant Access Prevention**: If a user from Company A tries to view an offer ID belonging to Company B via direct URL, the server must block it and return 404/403.
- **Linked Contact Validation**: When saving an offer, the server must validate that the linked `contact_id` belongs to the facility specified in `facility_id`. If it does not, the save must fail.
- **Discount Exceeding Subtotal**: If a user applies a discount (either percentage-based or flat SAR amount), the system must prevent the discount from reducing the grand total below zero.
- **Soft-Archival of Revisions**: If an offer that has revisions is soft-archived, all its historical revisions must also be soft-archived, but they remain linked for audit integrity.
- **Parent Facility Archival**: If a parent facility is soft-archived, its associated offers remain active in the database but are automatically filtered out from active directories and global views (e.g., the global "العروض" view) via a database join checking the parent facility's active status.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce strict company isolation on all offer records. Users from Company A can never view or modify offers from Company B.
- **FR-002**: The system MUST enforce role-based access control (RBAC) on offers based on the parent facility's permissions:
  - `Sales User` can create, edit draft, send, and record decisions only for offers on facilities assigned to them.
  - `Supervisor` and `Company Admin` can manage all offers within their company.
  - `Super Admin` has full access scoped to the currently active company.
- **FR-003**: An offer record MUST support the following fields:
  - `id`: Unique identifier (UUID).
  - `company_id`: Reference to Company (for isolation).
  - `facility_id`: Reference to Parent Facility (mandatory).
  - `parent_offer_id`: Reference to another Offer (optional, self-reference for revisions).
  - `title`: Short title (mandatory).
  - `contact_id`: Reference to Contact (optional, must belong to the same facility).
  - `validity_date`: Date until which the offer is valid (mandatory).
  - `status`: Enum (draft, sent, accepted, rejected) (mandatory, default: draft).
  - `sent_at`: Timestamp when marked as sent (optional).
  - `decision_date`: Date when accepted or rejected (optional).
  - `notes`: Rich/free text block for rep notes (optional).
  - `rejection_note`: Free text note for reasons of rejection (optional).
  - `is_active`: Boolean indicating active/archived state (mandatory, default: true).
- **FR-004**: Each offer MUST support financial line items containing a text description and a numeric amount in SAR. The subtotal must be computed server-side as the sum of all line item amounts.
- **FR-005**: All monetary totals—subtotal, discount amount, tax (VAT) amount, and grand total—MUST be calculated and verified server-side. Client-supplied totals must never be trusted.
- **FR-006**: Once an offer's status changes to `sent`, the offer's line items, discount, tax, and totals MUST become permanently read-only (immutable). Any adjustments must be made by creating a new revision.
- **FR-007**: Creating a revision of an offer MUST copy all properties (line items, contact, notes, discount) to a new draft offer, setting the `parent_offer_id` to the original offer and incrementing the sequential `version` integer field.
- **FR-008**: The system MUST support an Arabic-first RTL printable view of sent offers, including company identification, facility details, contact info, itemized quote list, totals, notes, and validity, implemented via CSS print media styles targeting browser-native printing and PDF export.
- **FR-009**: The offers directory view ("العروض" navigation item) MUST list active offers, filterable by status (including the derived "Expired" state) and owner (for Supervisors/Admins), showing total values. The query MUST automatically filter out offers whose parent facility is soft-archived (inactive).
- **FR-010**: All screens and data displays related to offers MUST use the system design palette, Arabic text, RTL direction, and SAR currency formatting.
- **FR-011**: Creating, sending, revising, accepting, rejecting, or archiving an offer MUST log a corresponding event in the parent facility's activity timeline.
- **FR-012**: Deletion of offers MUST be implemented as a soft-archive (`is_active: false`). Users with facility edit rights can soft-archive an offer. Recovery follows the standard restoration process.
- **FR-013**: The derived "Expired" display state MUST be calculated on the server using `Asia/Riyadh` timezone, checking if `status == 'sent'` and `validity_date < current_date` (in Riyadh time) and not yet accepted or rejected.
- **FR-014**: The system MUST support two VAT tax rates: 15% (default) and 0% (for tax-exempt facilities), toggleable by the user during offer creation and editing.
- **FR-015**: When an offer is marked as Accepted, the system MUST prompt the user to confirm advancing the parent facility's lifecycle status (reusing the terminal-stage confirmation from Feature 005) rather than transitioning it silently. Rejection of an offer MUST NOT trigger any automatic status transitions.
- **FR-016**: The system MUST support entering discounts either as a percentage (%) or as a fixed SAR amount, computing the corresponding discount total server-side.

### Key Entities *(include if feature involves data)*

- **Offer**:
  - `id`: UUID (Primary Key).
  - `company_id`: UUID (References Company).
  - `facility_id`: UUID (References Facility).
  - `parent_offer_id`: UUID (References Offer, nullable, self-referencing).
  - `version`: Integer (default: 1, incremented sequentially for each revision of a quote).
  - `contact_id`: UUID (References Contact, nullable).
  - `title`: String.
  - `status`: Enum (`draft`, `sent`, `accepted`, `rejected`).
  - `subtotal`: Decimal (SAR, computed).
  - `discount_type`: Enum (`percentage`, `fixed_amount`, `none`).
  - `discount_value`: Decimal.
  - `discount_total`: Decimal (computed discount amount in SAR).
  - `tax_rate`: Decimal (percentage, e.g., 15.00).
  - `tax_total`: Decimal (computed tax amount in SAR).
  - `grand_total`: Decimal (computed subtotal - discount_total + tax_total).
  - `validity_date`: Date.
  - `sent_at`: Timestamp (nullable).
  - `decision_date`: Date (nullable).
  - `notes`: Text (nullable).
  - `rejection_note`: Text (nullable).
  - `is_active`: Boolean.
  - `created_at`: Timestamp.
  - `updated_at`: Timestamp.
- **OfferLineItem**:
  - `id`: UUID (Primary Key).
  - `offer_id`: UUID (References Offer).
  - `description`: String.
  - `amount`: Decimal (SAR).
  - `created_at`: Timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of offer records are scoped by `company_id` and isolated at the database level.
- **SC-002**: 100% of pricing totals (subtotal, tax, discount, grand total) are validated and saved on the server; mismatch payloads are rejected with validation errors.
- **SC-003**: Sales Users receive a 403 error or empty results when attempting to read or mutate offers for facilities not assigned to them.
- **SC-004**: Offer printable view page loads and is fully renderable in under 1 second.
- **SC-005**: All offer transitions (create, send, accept, reject, revise, archive) generate an activity log entry in the facility timeline with exact values and author names.

## Assumptions

- **Accreditation-Prep Services context**: Pricing values are typically in thousands of SAR, representing consulting and prep services.
- **Timezone consistency**: All time calculations and display of dates are based on Saudi Arabia Standard Time (AST / UTC+3, represented as `Asia/Riyadh`).
- **Unified Design System**: Components use the existing Arabic-first, RTL design system built in prior features, utilizing Tailwind CSS or standard CRM styling and font families (e.g., Tajawal).
- **Contacts Linkability**: The contacts list is populated via contact management (Feature 004), and only contacts associated with the target facility can be linked.
