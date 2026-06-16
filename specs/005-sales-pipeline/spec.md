# Feature Specification: Sales Pipeline Board

**Feature Branch**: `005-sales-pipeline`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "Build the sales pipeline board for the NEBRASGOO CRM: a visual, drag-and-drop kanban view of facilities across their lifecycle stages. This is a view and interaction layer over the facility status field already defined in Feature 003 — it introduces no new core entity. It builds on Features 001–004 (auth, tenant isolation, roles, the facility entity with its status and visibility rules, the facility_activity timeline) and must respect all of their rules."

## Clarifications

### Session 2026-06-16
- Q: How should the pipeline board adapt visually and interactively on mobile screens? → A: Use a tabbed layout displaying one column at a time via a top swipeable header. Drag-and-drop is disabled on mobile; stage transitions are made using a tap menu/action on the card.
- Q: Should the system require a confirmation modal before finalizing transitions, specifically for terminal stages? → A: Require a confirmation dialog only when moving a card into a terminal stage ("تعاقد" or "خاسرة").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kanban Board RTL Visual Layout (Priority: P1)

Sales representatives and managers view the active sales pipeline as a set of RTL-oriented columns representing lifecycle stages. They can see key facility card details, view the total facility counts per stage, and easily access details.

**Why this priority**: Core visual representation. Reps and managers cannot view the pipeline funnel without this layout.

**Independent Test**:
Log in as a `Sales User` of Company A ("نبراس الجودة"). Open the "لوحة المبيعات" (Sales Board) page. Verify that columns are displayed from right to left in Arabic in this order: جديد (New), تم الاتصال (Contacted), مهتم (Interested), تقديم عرض (Offer), تفاوض (Negotiation), تعاقد (Contract), خاسرة (Lost). Verify that only active, non-archived facilities assigned to you are displayed. Verify that each column header shows a count of the total matching facilities in that stage. Verify that facility cards display: facility name, type, city, assigned owner, and Call/WhatsApp shortcut buttons. Click a card and verify it navigates to the facility's detail page.

**Acceptance Scenarios**:

1. **Given** a logged-in `Sales User` of Company A, **When** they view the sales pipeline board, **Then** they only see cards for active (non-archived) facilities assigned to them within Company A.
2. **Given** a logged-in `Supervisor` or `Company Admin` of Company A, **When** they view the sales pipeline board, **Then** they see cards for all active (non-archived) facilities belonging to Company A.
3. **Given** the Arabic-first locale, **When** the board renders, **Then** it must display in RTL format: columns laid out right-to-left, with text aligned appropriately, using the `Tajawal` font.
4. **Given** any facility card on the board, **When** the user clicks on the Call or WhatsApp shortcut button, **Then** it triggers the respective telephony or WhatsApp messaging flow defined in Feature 003.
5. **Given** any facility card on the board, **When** the user clicks on the card itself (excluding the communication buttons), **Then** it redirects them to the facility detail page.
6. **Given** a mobile device viewport (<700px), **When** the board loads, **Then** only a single stage's column is displayed with a swipeable tab header at the top for navigation, drag-and-drop is disabled, and the user can change a facility's stage via an inline tap menu on the card.

---

### User Story 2 - Drag-and-Drop Status Migration (Priority: P1)

An authorized user moves a facility card from one lifecycle column to another. The system updates the status, records it in the history timeline, and keeps the client UI in sync.

**Why this priority**: Essential CRM interaction. Status advancement must be quick, friction-free, and audit-logged.

**Independent Test**:
Log in as a `Sales User` of Company A. Drag an assigned facility card from "جديد" (New) to "تم الاتصال" (Contacted). Verify that the card is placed in the new column, the counts on both columns update, and no full page reload occurs. Navigate to the facility detail page and verify that the timeline shows a status change log: "تغيير حالة المنشأة من جديد إلى تم الاتصال" with the actor and timestamp.

**Acceptance Scenarios**:

1. **Given** a user with modify permission on a facility, **When** they drag its card from Column A (old status) to Column B (new status, not terminal), **Then** the card remains in Column B, and the server-side facility lifecycle status is updated.
2. **Given** a successful status change via drag-and-drop, **When** the mutation is processed, **Then** a new record is added to the `FacilityActivity` log table (`event_type: "status_change"`) containing the old and new statuses, actor ID, and current timestamp.
3. **Given** a network error or server authorization rejection (e.g. Sales User tries to drag a card they do not own), **When** the move is attempted, **Then** the board displays a friendly error message, and the card returns (rolls back) to its original column with no state change persisted.
4. **Given** facilities are rendered in a column, **When** the board is loaded or updated, **Then** the cards are ordered within each column by the most recent activity timestamp (descending order). There is no manual or custom ordering persisted within columns.
5. **Given** an authorized user drags a card to a terminal stage ("تعاقد" or "خاسرة"), **When** they drop the card, **Then** the system displays a confirmation dialog in Arabic, and only persists the change on the server if confirmed. If rejected, the card returns to its original column.

---

### User Story 3 - Paginated Lazy Loading / Load More (Priority: P1)

Columns load data efficiently without overloading the browser or the server when a company has hundreds of facilities.

**Why this priority**: Performance and scalability. Prevents browser crashes and database performance degradation.

**Independent Test**:
Log in as a `Company Admin` of a company with 35 facilities in the "جديد" (New) stage. Load the board. Verify that the "جديد" column displays exactly 10 cards and shows a "تحميل المزيد" (Load More) button at the bottom of the list. Verify that the column header displays the full count (35) of facilities in that stage. Click "تحميل المزيد" and verify that the next 10 cards load inline.

**Acceptance Scenarios**:

1. **Given** a column contains more than 10 matching facilities, **When** the board loads, **Then** only the first 10 cards are loaded and displayed, and a "تحميل المزيد" button is visible at the bottom of the column.
2. **Given** a user clicks "تحميل المزيد" on a column, **When** the action completes, **Then** the next batch of 10 cards (or remaining cards if less than 10) is appended to the bottom of the column.
3. **Given** a column contains 10 or fewer matching facilities, **When** the board loads, **Then** all matching cards are displayed, and no "تحميل المزيد" button is shown.
4. **Given** filters are applied or cards are moved, **When** counts are calculated, **Then** the column count badge displays the total count of all matching records in that stage (independent of how many cards are currently loaded in the UI).

---

### User Story 4 - Board Search & Filtering (Priority: P2)

Users filter the pipeline board by assigned owner, city, and type to narrow down their active leads.

**Why this priority**: High value for sales management and large-scale operations.

**Independent Test**:
Log in as a `Supervisor`. Select a specific `Sales User` from the "مسؤول المبيعات" (Sales Rep) filter dropdown. Select "الرياض" (Riyadh) from the "المدينة" (City) filter dropdown. Verify that only facilities assigned to that Sales User in Riyadh are visible in the columns, and that column header counts update to reflect only this filtered subset.

**Acceptance Scenarios**:

1. **Given** a user applies a filter (Owner, City, or Type) on the board page, **When** the filter changes, **Then** all columns refresh instantly to display only the matching facilities, and the column count badges update to reflect the new counts.
2. **Given** a Sales User is logged in, **When** they view the board, **Then** the owner filter is locked to their name, and they can only filter by City and Type.
3. **Given** a Supervisor, Company Admin, or Super Admin is logged in, **When** they view the board, **Then** the owner filter displays a dropdown of all active Sales Users in the company, plus an "All Owners" option.

---

### Edge Cases

- **Concurrent Status Change Conflict**: If User A has the board open and User B updates a facility's status (e.g. from the detail page) or archives it, and then User A attempts to drag that same facility card, the server MUST validate the current database state first. If the state has changed or the facility is archived, the mutation must fail, and User A's card must return to its correct, current database status with an alert message.
- **Unauthorized Status Change Manipulation**: If a user attempts to trigger a status update via a direct API request for a facility they do not own (Sales User) or that belongs to another company (cross-tenant), the server must return a 403 Forbidden or 404 Not Found error and make no changes.
- **Card Move to Same Stage**: If a card is picked up and dropped in the same column, no update request is sent to the server, and no timeline activity is written.
- **Archived Facility Exclusion**: If a facility is archived (via detail page or by another user), it must be immediately excluded from the board on the next fetch or search. The pipeline board does not have an "Archived" column and archived records are never displayed.
- **Terminal Stage Moves**: Facilities in "contract" (Won) or "lost" (Dead) stages are displayed on the board in their respective columns, and authorized users can drag them back to active stages (e.g. "negotiation") if needed, which will log a status change timeline entry normally.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce multi-tenant isolation on the pipeline board. Facilities from Company B must never appear on Company A's board under any circumstances.
- **FR-002**: The system MUST enforce server-side role-based access control (RBAC) on board data:
  - `Sales User` can only see their assigned facilities and can only move their own cards.
  - `Supervisor` and `Company Admin` can see all facilities in their company and move any card.
  - `Super Admin` can see and move facilities scoped to the currently active company context.
- **FR-003**: The pipeline board MUST display exactly seven columns representing the lifecycle stages in order from right to left (RTL):
  1. جديد (New)
  2. تم الاتصال (Contacted)
  3. مهتم (Interested)
  4. تقديم عرض (Offer)
  5. تفاوض (Negotiation)
  6. تعاقد (Contract)
  7. خاسرة (Lost)
- **FR-004**: Column header counts MUST display the total number of non-archived, matching facilities in that stage, regardless of whether all cards are currently loaded in the viewport.
- **FR-005**: The board MUST implement lazy loading for each column individually. The initial load of each column is capped at 10 records. If more than 10 records exist, a "تحميل المزيد" (Load More) button MUST be displayed.
- **FR-006**: Cards within a column MUST be sorted by their most recent activity timestamp (`updated_at` or `FacilityActivity.created_at`) in descending order. Dragging a card within the same column MUST NOT persist any custom order.
- **FR-007**: A facility card MUST display:
  - Facility Arabic Name
  - Facility Type (translated to Arabic, e.g., "مجمع طبي")
  - City
  - Assigned Owner (if any)
  - Quick action Call button (initiates `tel:` call to primary phone)
  - Quick action WhatsApp button (normalizes number and redirects to `wa.me` with template message)
- **FR-008**: The system MUST allow drag-and-drop card movement between columns for authorized users.
- **FR-009**: When a card is successfully dropped in a new column:
  - The facility's `lifecycle_status` MUST be updated on the server.
  - A `FacilityActivity` record MUST be written with `event_type = "status_change"`, recording the old status, new status, actor user ID, and timestamp.
  - The UI must update column counts and card placement without a full page reload.
- **FR-010**: If a drag-and-drop save fails on the server, the card MUST be reverted to its original column, and a clear error message in Arabic MUST be shown to the user.
- **FR-011**: The pipeline board MUST support filtering by City, Facility Type, and Assigned Owner (with the owner filter locked for Sales Users).
- **FR-012**: Status colors for the cards and column highlights MUST match the CRM design system status colors:
  - جديد (New): Neutral/muted outline or soft styling.
  - تم الاتصال (Contacted): Info color.
  - مهتم (Interested): Warning color.
  - تقديم عرض (Offer): Gold accent color.
  - تفاوض (Negotiation): Gold accent color.
  - تعاقد (Contract): Success color.
  - خاسرة (Lost): Danger color.
- **FR-013**: On mobile screens (<700px), the board MUST render as a single column displaying one stage at a time with a swipeable tab header for navigation. Drag-and-drop MUST be disabled on mobile viewports; instead, stage transitions MUST be performed via a tap action/menu on each facility card.
- **FR-014**: The system MUST display a confirmation dialog when a user attempts to transition a facility card into a terminal stage ("تعاقد" or "خاسرة"). The status change is only persisted if the user confirms the action.

### Key Entities *(include if feature involves data)*

This feature is a view and interaction layer and introduces no new database tables. It interacts with the following existing entities:

- **Facility (reused from Feature 003)**:
  - `lifecycle_status`: Enum (new, contacted, interested, offer, negotiation, contract, lost) updated on drag-and-drop.
  - `is_active`: Boolean (must be `true` to display on the board).
- **FacilityActivity (reused from Feature 003)**:
  - Added record on successful drag-and-drop status update: `event_type = "status_change"`, `old_value`, `new_value`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pipeline board operations (reads, status updates) are tenant-scoped, verified server-side.
- **SC-002**: A user without permission attempting to drag a card results in immediate UI rollback and a server-side 403 Forbidden error.
- **SC-003**: The pipeline board renders columns and cards in RTL format by default, complying with the Tajawal typography and CRM styling tokens.
- **SC-004**: Columns load the initial 10 cards and update counts in under 1.5 seconds.
- **SC-005**: Moving a card between columns triggers a single database transaction updating status and logging activity, completing in under 500ms on a standard database connection.

## Assumptions

- **Feature 003 Base**: The `Facility` and `FacilityActivity` schemas are already defined and populated.
- **Browser Drag-and-Drop**: The client application will utilize drag-and-drop visual component interfaces that support touch interactions and operate smoothly on both desktop and mobile/tablet web viewports.
- **Archiving exclusion**: Archiving a facility (Feature 003) immediately makes it ineligible for the pipeline board, and there is no UI toggling to show archived facilities on the board.
