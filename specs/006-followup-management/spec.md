# Feature Specification: Follow-up Management

**Feature Branch**: `006-followup-management`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "Build follow-up management for the NEBRASGOO CRM. A \"follow-up\" is a scheduled task/reminder tied to a facility — a due-dated action a rep must take (call back, visit, send_offer, etc.). It builds on Features 001–005 (auth, tenant isolation, roles, the facility entity and its visibility/assignment rules, optional contacts, the facility_activity timeline) and must respect all of their rules."

## Clarifications

### Session 2026-06-16
- Q: How should the system handle pending follow-ups assigned to the old facility owner when the facility owner is changed? → A: Automatically reassign all pending follow-ups belonging to the old owner to the new owner.
- Q: Should outcome notes be mandatory when completing a follow-up? → A: Outcome notes are always optional.
- Q: Which filter should be active by default when a user loads the "المتابعات" view? → A: Default to "All Pending" (المهام المعلقة) which is a consolidated view of Overdue, Due Today, and Upcoming follow-ups sorted by due date/time ascending, rather than displaying a single sub-state filter tab by default.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Schedule a Follow-up on a Facility (Priority: P1)

An authorized user (sales representative or manager) schedules a follow-up action for a specific facility. The follow-up is automatically scoped to the active tenant (company), and its owner defaults to the facility owner.

**Why this priority**: Core requirement. Sales reps must be able to schedule next actions to ensure no leads are neglected.

**Independent Test**:
Log in as a `Sales User` of Company A ("نبراس الجودة"). Open the detail page of a facility assigned to you. Scroll to the "المتابعات" (Follow-ups) section and click "إضافة متابعة" (Add Follow-up). Fill out the form in Arabic: Select type "اتصال" (Call), set due date and time (must be in the future), select a linked contact from the facility's contacts, and write notes. Observe that the owner defaults to yourself and is read-only. Save the follow-up. Verify it appears under "المتابعات المعلقة" (Pending Follow-ups) and a log entry is added to the facility's activity timeline.

**Acceptance Scenarios**:

1. **Given** an authorized user with edit permissions on a facility, **When** they fill out and submit the "Add Follow-up" form, **Then** a follow-up record is created containing: type (call, visit, send_offer, other), due date/time, assigned owner, optional linked contact, and notes.
2. **Given** a new follow-up form, **When** a `Sales User` opens it, **Then** the "Assigned Owner" field defaults to the facility's owner (which is the Sales User), and the selection is locked (disabled).
3. **Given** a new follow-up form, **When** a `Supervisor` or `Company Admin` opens it, **Then** the "Assigned Owner" field defaults to the facility's owner, but remains editable, allowing selection of any active user within the same company. If the facility has no assigned owner, it defaults to the creator.
4. **Given** a follow-up is created, **When** it is saved, **Then** it automatically inherits the parent facility's `company_id` and the system logs a `followup_create` event in the parent facility's activity timeline (e.g., "تمت جدولة متابعة جديدة: اتصال بتاريخ 2026-06-20 10:00 ص").

---

### User Story 2 - Complete a Follow-up with Outcome (Priority: P1)

A sales representative completes a scheduled follow-up, transitions its status to "done", and records the outcome.

**Why this priority**: Critical for closing the loop on actions. It allows reps to document what happened and ensures the task is no longer flagged as pending or overdue.

**Independent Test**:
Log in as a `Sales User`. Open a facility detail page where you have a pending follow-up. Click "إتمام المتابعة" (Complete Follow-up) next to the pending item. In the modal, write an outcome note (e.g., "تم الاتصال بالعميل وأبدى اهتماماً كبيراً، وطلب إرسال عرض سعر رسمي"). Click save. Verify the follow-up status changes to "مكتملة" (Done), the overdue highlight (if any) disappears, the completion date and actor are recorded, and an activity log entry is added to the facility timeline.

**Acceptance Scenarios**:

1. **Given** a pending follow-up, **When** an authorized user clicks "Complete" and submits the completion modal with optional outcome notes, **Then** the status updates to `done`, the completion timestamp and actor ID are recorded, and the outcome notes are saved.
2. **Given** a completed follow-up, **When** displayed in the list, **Then** it is rendered in a completed state (e.g., greyed out or strike-through style, showing a checkmark), and all action buttons (Complete, Cancel, Reschedule) are hidden.
3. **Given** a follow-up is marked as completed, **When** it is saved, **Then** the system logs a `followup_complete` event in the facility's activity timeline, including the outcome details.

---

### User Story 3 - Reschedule or Cancel a Follow-up (Priority: P1)

Authorized users adjust due dates for follow-ups or cancel them entirely if they are no longer relevant, preserving the historical record.

**Why this priority**: Sales cycles are dynamic. Due dates frequently change, and some tasks become redundant. Keeping history of these actions is vital for management oversight.

**Independent Test**:
Log in as a `Sales User`. Open a facility detail page with a pending follow-up. Click "إعادة جدولة" (Reschedule). Set a new due date/time and save. Verify the due date updates in the list and a timeline event is logged. Click "إلغاء المتابعة" (Cancel Follow-up). In the dialog, write a cancellation reason (e.g., "تم إلغاء الاجتماع بطلب من العميل") and confirm. Verify the status changes to "ملغاة" (Cancelled), the item remains in the history list (not deleted), and a timeline event is logged.

**Acceptance Scenarios**:

1. **Given** a pending follow-up, **When** an authorized user reschedules it, **Then** the due date/time is updated, and a `followup_reschedule` event is logged in the facility timeline recording the old and new due dates/times.
2. **Given** a pending follow-up, **When** an authorized user cancels it, **Then** the status is updated to `cancelled`, the cancellation actor and timestamp are recorded, and a `followup_cancel` event is logged in the facility timeline along with the optional reason. The record is preserved in the database (not hard-deleted).

---

### User Story 4 - Dedicated Follow-ups Workboard ("المتابعات") (Priority: P1)

Users view and manage their follow-ups across all facilities in a single dedicated view, filtering by state, and managers can view their team's workload.

**Why this priority**: Centralized productivity view. Reps need a single dashboard to plan their day and see what is overdue, while managers need team-wide visibility.

**Independent Test**:
Log in as a `Sales User` of Company A. Click the "المتابعات" (Follow-ups) item in the navigation sidebar. Verify you see a list of follow-ups assigned to you. Click the tabs/filters to switch between: "مستحقة اليوم" (Due Today), "قادمة" (Upcoming), "متأخرة" (Overdue), and "مكتملة" (Done). Verify that you cannot see follow-ups of other users. Log in as a `Supervisor` or `Company Admin`. Open the same view. Verify you see an additional filter dropdown "المسؤول المعين" (Assigned Owner) listing all sales reps. Select a rep and verify their follow-ups are displayed.

**Acceptance Scenarios**:

1. **Given** a logged-in `Sales User`, **When** they access the "المتابعات" view, **Then** they see only follow-ups assigned to them within their company, organized by due date.
2. **Given** the "المتابعات" view, **When** a user applies state filters, **Then** the list is filtered based on the following server-side definitions (calculated using Asia/Riyadh timezone):
   - **Overdue (متأخرة)**: pending AND due_at < NOW().
   - **Due Today (مستحقة اليوم)**: pending AND due_at is within the current calendar day AND due_at >= NOW().
   - **Upcoming (قادمة)**: pending AND due_at is after the current calendar day.
   - **Done (مكتملة)**: status = done.
3. **Given** a logged-in `Supervisor`, `Company Admin`, or `Super Admin`, **When** they view the "المتابعات" screen, **Then** they see a dropdown to filter the list by any active employee in the company, defaulting to "الكل" (All).
4. **Given** a list of follow-ups, **When** an overdue item is displayed, **Then** it is highlighted with a distinct alert color (e.g., soft red background or red text badge) indicating it is overdue, and it must never show as both done and overdue.
5. **Given** a follow-up in the list, **When** a user clicks on its associated facility name, **Then** they are redirected to that facility's detail page.

---

### User Story 5 - Reassign Follow-up Ownership (Priority: P2)

Managers reassign a follow-up to a different owner to balance workloads or handle staff absences.

**Why this priority**: Necessary for sales team operations when personnel changes occur or when a rep is unavailable to handle a time-sensitive task.

**Independent Test**:
Log in as a `Supervisor`. Open a facility detail page. Find a pending follow-up owned by Sales User A. Click "تعديل المالك" (Change Owner) or open the Edit Follow-up dialog. Change the assigned owner to Sales User B and save. Verify that the follow-up now displays Sales User B as the owner, Sales User B sees it in their "المتابعات" list, and a log entry is added to the facility activity timeline.

**Acceptance Scenarios**:

1. **Given** a logged-in `Sales User`, **When** they view or edit a follow-up on a facility assigned to them, **Then** they cannot reassign the follow-up's owner.
2. **Given** a logged-in `Supervisor`, `Company Admin`, or `Super Admin`, **When** they edit a pending follow-up, **Then** they can reassign the follow-up's owner to any active user in the same company.
3. **Given** a follow-up owner is changed, **When** saved, **Then** a `followup_reassign` event is logged in the parent facility's activity timeline, showing the old owner's name and the new owner's name.

---

### Edge Cases

- **Facility Owner Change Synchronization**: If a facility's assigned owner is changed (e.g., from Sales User A to Sales User B), all associated *pending* follow-ups that were assigned to the old owner (Sales User A) MUST be automatically and atomically reassigned to the new owner (Sales User B) to prevent tasks from becoming inaccessible to the active rep. Follow-ups assigned to other users (e.g., a supervisor) remain unchanged.
- **Parent Facility Archival**: If a parent facility is archived, all its associated follow-ups MUST be excluded from active/working views (both the facility detail page and the dedicated "المتابعات" workboard), but the records must remain intact. If the facility is recovered, the follow-ups must reappear in active lists with their original status and due dates.
- **Direct ID Access in API**: If a Sales User attempts to query, complete, reschedule, or cancel a follow-up ID belonging to another company or associated with a facility not assigned to them, the server MUST reject the operation and return a 403 Forbidden.
- **Timezone Drift (Client vs. Server)**: If a client device's system clock is set to a different timezone (e.g. UTC or Eastern Time), the server MUST compute all date boundaries ("due today", "overdue") using the database/server-side time normalized to Saudi Arabian Time (Asia/Riyadh), ensuring consistency.
- **Contact Archival cleanup**: If a contact is archived (Feature 004), any pending follow-ups linked to that contact MUST retain their notes and details, but the `linked_contact_id` MUST be set to null (or the link disabled) to prevent referencing an inactive contact.
- **Completing an Overdue Follow-up**: When an overdue follow-up is completed, its status updates to `done` and its overdue state MUST immediately cease to apply. It must be categorized strictly as "done" and removed from the "overdue" list.
- **Past Date Prevention**: At the time of creation or rescheduling, the system MUST enforce that the selected due date/time is at least 1 minute in the future in the Asia/Riyadh timezone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce strict multi-tenant isolation on all follow-up queries and mutations. Company A users can never access Company B's follow-ups.
- **FR-002**: The system MUST enforce inherited role-based access control (RBAC):
  - A user can only view, create, or modify follow-ups on facilities they have permission to access.
  - `Sales User` can manage follow-ups on facilities assigned to them.
  - `Supervisor` and `Company Admin` can manage follow-ups on any facility in their company.
  - `Super Admin` is restricted to the active company selected in the company switcher.
- **FR-003**: The follow-up entity MUST support the following fields:
  - ID (UUID, Primary Key, autogenerated)
  - Company ID (UUID, references `companies`)
  - Facility ID (UUID, references `facilities`)
  - Type: call (اتصال), visit (زيارة), send_offer (إرسال عرض), other (أخرى) (mandatory)
  - Due Date & Time (Timestamp, mandatory)
  - Assigned Owner ID (UUID, references `users` in the same company, mandatory)
  - Linked Contact ID (UUID, references `contacts` associated with the same facility, optional)
  - Notes (Text, optional)
  - Status: pending (معلقة), done (مكتملة), cancelled (ملغاة) (mandatory, default: pending)
  - Completed By ID (UUID, references `users`, optional)
  - Completed At (Timestamp, optional)
  - Outcome Notes (Text, optional)
  - Cancelled By ID (UUID, references `users`, optional)
  - Cancelled At (Timestamp, optional)
  - Cancel Reason (Text, optional)
  - Created By ID (UUID, references `users`, mandatory)
  - Created At (Timestamp)
  - Updated At (Timestamp)
- **FR-004**: The system MUST support completing a follow-up by setting its status to `done`, recording the user who completed it, the current time, and an optional outcome note.
- **FR-005**: The system MUST support rescheduling a follow-up by updating its due date/time.
- **FR-006**: The system MUST support cancelling a follow-up by setting its status to `cancelled`, recording the user who cancelled it, the current time, and an optional cancel reason. Hard-deletion of follow-up records is forbidden.
- **FR-007**: Only users with management roles (`Supervisor`, `Company Admin`, `Super Admin`) MUST be allowed to change the owner of a follow-up.
- **FR-008**: The facility detail page MUST display a "المتابعات" (Follow-ups) tab or section containing:
  - A list of active, pending follow-ups with due date/time, type, notes, owner name, and linked contact.
  - Overdue items clearly highlighted with a red badge or background.
  - Action buttons: "Complete" (إتمام), "Reschedule" (إعادة جدولة), and "Cancel" (إلغاء) for authorized users.
  - A historical toggle or list showing completed and cancelled follow-ups.
- **FR-009**: The system MUST provide a dedicated "المتابعات" (Follow-ups) view in the sidebar navigation displaying a list of follow-ups:
  - For `Sales Users`, this list is restricted to follow-ups assigned to them.
  - For `Supervisor`, `Company Admin`, and `Super Admin`, this list shows all follow-ups in the company, with a dropdown to filter by assigned owner.
  - The default active tab/view MUST show "All Pending" (المهام المعلقة) which consolidates Overdue, Due Today, and Upcoming follow-ups sorted by urgency (due date/time ascending).
  - The view MUST support filtering or tabs to switch between "All Pending" (المهام المعلقة) and "Done" (مكتملة), and allow users to narrow down the pending list using sub-filters for "Due Today" (مستحقة اليوم), "Upcoming" (قادمة), and "Overdue" (متأخرة).
- **FR-010**: All calculations of overdue state and "due today" state MUST be processed server-side based on the `Asia/Riyadh` timezone (Saudi Arabia).
- **FR-011**: Any creation, completion, rescheduling, cancellation, or reassignment of a follow-up MUST log a corresponding entry in the parent facility's activity timeline (`FacilityActivity` table), including the actor name, event type, date, and description of what changed, written in Arabic.
- **FR-012**: All follow-up lists and views MUST exclude follow-ups associated with archived parent facilities.
- **FR-013**: The system MUST validate at creation and rescheduling that the due date/time is in the future.
- **FR-014**: All user interfaces, forms, lists, and statuses MUST be rendered in Arabic (`lang="ar"`, `dir="rtl"`) using the `Tajawal` typeface and follow the system design palette.

### Key Entities *(include if feature involves data)*

- **FollowUp**:
  - `id`: UUID (Primary Key, autogenerated)
  - `company_id`: UUID (references `companies`)
  - `facility_id`: UUID (references `facilities`, cascade delete on parent facility delete)
  - `type`: Enum (call, visit, send_offer, other)
  - `due_at`: Timestamp
  - `assigned_owner_id`: UUID (references `users`)
  - `linked_contact_id`: UUID (references `contacts`, nullable, set null on contact archive/delete)
  - `notes`: Text (nullable)
  - `status`: Enum (pending, done, cancelled; default 'pending')
  - `completed_by_id`: UUID (references `users`, nullable)
  - `completed_at`: Timestamp (nullable)
  - `outcome_notes`: Text (nullable)
  - `cancelled_by_id`: UUID (references `users`, nullable)
  - `cancelled_at`: Timestamp (nullable)
  - `cancel_reason`: Text (nullable)
  - `created_by_id`: UUID (references `users`)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

- **FacilityActivity (Extension)**:
  - New `event_type` values: `followup_create`, `followup_complete`, `followup_reschedule`, `followup_cancel`, `followup_reassign`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of follow-up CRUD operations are tenant-isolated at the database/API query level.
- **SC-002**: Overdue check results are 100% consistent across all user sessions regardless of client timezone configuration.
- **SC-003**: Follow-up queries (list & detail counts) resolve in under 400ms.
- **SC-004**: No follow-up record is ever shown as both "Done" and "Overdue" at the same time.
- **SC-005**: All timeline events generated by follow-up actions are rendered correctly in Arabic on the facility detail page activity stream.

## Assumptions

- **Timezone Stability**: The database and server environments support timezone-aware queries and can successfully compare timestamps using `Asia/Riyadh` offset context.
- **Notification Absence**: Direct messaging (email/SMS/push) notification workflows are out of scope and will be implemented in a later feature (Feature 010). The current scope is purely in-app status markers and list dashboards.
- **Contact Scope**: The user can only link a contact that belongs to the same facility as the follow-up.
