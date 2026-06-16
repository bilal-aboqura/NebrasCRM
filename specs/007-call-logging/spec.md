# Feature Specification: Call and Communication Logging

**Feature Branch**: `007-call-logging`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "Build call/communication logging for the NEBRASGOO CRM. A \"call log\" records an actual communication with a facility (or a specific contact) — who reached out, when, through which channel, and the result. This complements follow-ups: a follow-up is a planned future task, while a call log documents a communication that already happened. It builds on Features 001–006 (auth, tenant isolation, roles, the facility entity with its visibility/assignment rules, contacts, follow-ups, the facility_activity timeline, and the click-to-call / WhatsApp affordances) and must respect all of their rules."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manually Log a Communication (Priority: P1)

An authorized user logs a communication against a facility (optionally tied to one of that facility's contacts). This represents a communication that has already occurred, either inbound or outbound.

**Why this priority**: Core CRM capability. Sales representatives must be able to log manual interactions to build a clear communication history.

**Independent Test**:
Log in as a `Sales User` of Company A. Open an assigned facility's detail page. In the "سجل الاتصالات" (Communication Log) section, click "تسجيل اتصال" (Log Communication). In the modal, fill in the details in Arabic: Select Contact, set Channel to "مكالمة هاتفية" (Phone Call), set Direction to "صادر" (Outbound), set DateTime (can default to now or be set to a past time for back-logging), select Outcome "تم الرد" (Answered), enter optional Duration "5" (minutes), and write notes. Save the log. Verify that:
1. The communication appears in the chronological history list.
2. A `call_logged` event is added to the facility's activity timeline.
3. A `Sales User` from Company B cannot access this facility or its call logs.

**Acceptance Scenarios**:

1. **Given** an authorized user on an assigned facility, **When** they fill out and submit the "Log Communication" form, **Then** a new call log is created with: channel (call, whatsapp), direction (inbound, outbound), occurred_at (default: now, editable), outcome (answered, no_answer, busy, wrong_number, callback_requested, not_reachable), optional duration, optional linked contact, and free-text notes.
2. **Given** a new call log form, **When** the user selects a contact, **Then** the list of contacts is restricted to active contacts belonging to the same facility.
3. **Given** a saved call log, **When** persisted, **Then** it is automatically stamped with the active user's `company_id`, the creator's `user_id`, and a `call_logged` event is generated on the parent facility's activity timeline (e.g. "تم تسجيل اتصال صادر مع أحمد علي (تم الرد) بواسطة محمد").

---

### User Story 2 - Quick-Log Prompt from Click-to-Call/WhatsApp Affordance (Priority: P1)

When a user taps an existing click-to-call or WhatsApp affordance on a facility or contact, the system provides a prompt to log the communication outcome.

**Why this priority**: High convenience and data integrity. Prompts immediately after call placement ensure higher compliance and accuracy in logging.

**Independent Test**:
Log in as a `Sales User`. On a facility detail page, click the phone icon next to a contact's number. The system triggers the browser's `tel:` protocol. Immediately, a quick-log prompt is shown. Select "تم الرد" (Answered), write a short note, and click "حفظ" (Save). Verify the log is generated.

**Acceptance Scenarios**:

1. **Given** a user clicks a contact phone number link (`tel:`) or WhatsApp link (`wa.me`), **When** the external action is initiated, **Then** the CRM triggers a quick-log prompt.
2. **Given** the quick-log prompt, **When** displayed, **Then** it pre-fills: channel (based on clicked icon: call or whatsapp), direction (outbound), occurred_at (now), and provides outcome, notes, and duration fields.
3. Given the quick-log prompt, When user completes and saves it, Then a call log is saved and facility activity timeline is updated. If they dismiss the prompt, no log is created.
4. Given the quick-log prompt configuration, When it triggers, Then a small, non-intrusive floating banner MUST appear at the top or bottom of the screen when the CRM window regains focus, asking the user "Did you complete the communication? [Log Outcome]" and offering a button to open the log form.

---

### User Story 3 - Link Call Log to Follow-up Completion (Priority: P1)

When completing a "call" follow-up (Feature 006), the user is offered the option to create a linked call log documenting the communication.

**Why this priority**: Streamlines user workflows. Completing a task and logging its result are frequently done together.

**Independent Test**:
Log in as a `Sales User`. In the facility's pending follow-ups section, click "إتمام" (Complete) for a pending follow-up of type "اتصال" (Call). In the completion modal, check the option to log the call. Save the completion. Verify that:
1. The follow-up is marked as done.
2. A new call log is created, referencing this completed follow-up.
3. The facility timeline logs both the completion of the follow-up and the new call log.

**Acceptance Scenarios**:

1. **Given** a user completes a follow-up of type `call` or `send_offer`, **When** the completion modal is opened, **Then** the system offers to create a linked call log.
2. Given the user chooses to create a linked call log during follow-up completion, When the form is saved, Then the new call log references the `followup_id` and the follow-up references the `call_log_id` (if applicable), establishing a bidirectional reference or simple linkage.
3. Given a call log is being created, When the user links it to a follow-up, Then the call log form MUST display a checkbox (checked by default) labeled "إتمام المتابعة المرتبطة" (Mark linked follow-up as completed). Saving the form with this checked automatically transitions the linked follow-up's status to completed (done).

---

### User Story 4 - View Facility Communication History (Priority: P1)

Users view a history of all communications with a facility on the facility detail page and in the activity timeline.

**Why this priority**: Necessary for context and collaboration. Hand-offs and manager coaching depend on reviewing past touchpoints.

**Independent Test**:
Log in as a `Supervisor`. Open a facility detail page. Verify that the "سجل الاتصالات" (Call Logs) section displays a list of logs in reverse chronological order (newest first). Each entry displays: Channel icon, direction indicator, creator name, date/time (formatted in Saudi style), outcome badge, duration, and notes.

**Acceptance Scenarios**:

1. **Given** a facility detail page, **When** rendered, **Then** the call logs section displays communication history, capped or paginated (e.g. 10 per page), newest first.
2. **Given** the facility's main activity timeline, **When** rendered, **Then** call log creation, editing, and archiving events appear as timeline entries (e.g. `call_logged`, `call_log_edit`, `call_log_archive`).
3. **Given** a facility is archived, **When** a user accesses general CRM lists, **Then** call logs associated with that facility are hidden. The records must remain intact in the database.

---

### User Story 5 - Edit and Archive Call Logs (Priority: P2)

Authorized creators or managers edit a call log's outcome/notes or soft-archive them to maintain a clean history.

**Why this priority**: Operational corrections. Mistakes during logging (e.g. wrong outcome selected, typos in notes) must be fixable, but auditing must be preserved.

**Independent Test**:
Log in as a `Sales User` who created a log. Click "تعديل" (Edit) on the call log. Modify the notes and save. Verify the update is reflected and logged on the timeline. Log in as another `Sales User` and verify you cannot edit or archive the log. Log in as a `Supervisor` and verify you can edit or archive the log.

**Acceptance Scenarios**:

1. **Given** a call log, **When** a user attempts to edit it, **Then** the system checks permissions: allowed only for the creator (user who logged it) OR users with management roles (`Supervisor`, `Company Admin`, `Super Admin`).
2. Given a call log is edited, When saved, Then only the outcome, notes, and duration are editable; other fields (direction, channel, occurred_at) remain immutable. A `call_log_edit` event is posted to the facility timeline.
3. Given editing a call log, When evaluated, Then the creator is permitted to edit the outcome and notes strictly within a 24-hour window from creation. After 24 hours, the edit action is locked for the creator, and only users with management roles can modify it.
4. **Given** a call log, **When** a user with a management role archives it, **Then** it is soft-archived (never hard-deleted), hidden from active lists, and a `call_log_archive` event is posted to the timeline. Managers can recover it using the recovery screen.

---

### Edge Cases

- **Mismatching Contact Facility**: A call log cannot be linked to a contact that does not belong to the parent facility. The database and API must enforce this validation.
- **Parent Facility Archival**: Soft-archiving a facility hides all its call logs from all active views, but they are restored if the facility is unarchived.
- **Direct ID Access**: A user of Company A trying to access/modify a call log ID of Company B via API/direct URL must receive a `403 Forbidden` response.
- **Overlapping Edit Conflict**: If a supervisor and a rep edit the same call log concurrently, the system must use optimistic locking to prevent overwriting updates.
- **Future Date Prevention**: The `occurred_at` timestamp cannot be in the future.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce strict multi-tenant isolation. A call log carries `company_id` and is isolated by company; users of Company A cannot read or modify Company B's call logs.
- **FR-002**: The system MUST enforce inherited visibility rules:
  - `Sales User`: Can view and log communications on facilities assigned to them.
  - `Supervisor` / `Company Admin`: Can view and log communications on all facilities in their company.
  - `Super Admin`: Scoped to the active company selected in the company switcher.
- **FR-003**: The call log entity MUST support the following fields:
  - ID (UUID, Primary Key, autogenerated)
  - Company ID (UUID, references `companies`, mandatory)
  - Facility ID (UUID, references `facilities`, mandatory)
  - Contact ID (UUID, references `contacts`, optional, must belong to the same facility)
  - Channel: call (اتصال هاتف), whatsapp (واتساب) (mandatory)
  - Direction: inbound (وارد), outbound (صادر) (mandatory)
  - Occurred At (Timestamp, mandatory, defaults to now, cannot be in the future)
  - Outcome: answered (تم الرد), no_answer (لم يرد), busy (مشغول), wrong_number (رقم خاطئ), callback_requested (طلب إعادة اتصال), not_reachable (غير متاح) (mandatory)
  - Duration (Integer, duration in seconds, optional)
  - Notes (Text, optional)
  - Linked Followup ID (UUID, references `followups`, optional)
  - Is Archived (Boolean, default: false)
  - Created By ID (UUID, references `users`, mandatory)
  - Created At (Timestamp)
  - Updated At (Timestamp)
- **FR-004**: Manual logging MUST be accessible on the facility detail page and contact detail page via a "تسجيل اتصال" (Log Communication) action.
- **FR-005**: Click-to-call or WhatsApp links on contacts MUST trigger a quick-log banner prompt that appears at the top or bottom of the screen when the CRM window regains focus after the link is tapped.
- **FR-006**: Completing a follow-up of type "Call" MUST offer to create a linked call log. Conversely, logging a call manually that references a pending follow-up MUST offer a checkbox (checked by default) to automatically mark that follow-up as completed.
- **FR-007**: Only the creator of the call log (within a strict 24-hour window from creation) and users with management roles (`Supervisor`, `Company Admin`, `Super Admin`) at any time are authorized to edit a call log's outcome, notes, and duration.
- **FR-008**: Call logs MUST never be hard-deleted. They can only be soft-archived (`is_archived = true`) by users with management roles.
- **FR-009**: The facility detail page MUST display a chronological list of call logs (channel, direction, creator, date/time, outcome, notes, duration), newest first, paginated or capped.
- **FR-010**: Creating, editing, or archiving a call log MUST generate a corresponding timeline entry in the parent facility's activity timeline (`FacilityActivity`), written in Arabic.
- **FR-011**: All client screens and forms related to call logs MUST be Arabic-first, RTL, using the `Tajawal` font and the platform color palette.

### Key Entities

- **CallLog**:
  - `id`: UUID (Primary Key)
  - `company_id`: UUID (references `companies`)
  - `facility_id`: UUID (references `facilities`, cascade delete on parent facility delete)
  - `contact_id`: UUID (references `contacts`, nullable, set null on contact archive/delete)
  - `channel`: Enum (call, whatsapp)
  - `direction`: Enum (inbound, outbound)
  - `occurred_at`: Timestamp
  - `outcome`: Enum (answered, no_answer, busy, wrong_number, callback_requested, not_reachable)
  - `duration`: Integer (seconds, optional)
  - `notes`: Text (optional)
  - `linked_followup_id`: UUID (references `followups`, nullable, set null on followup delete)
  - `is_archived`: Boolean (default: false)
  - `created_by_id`: UUID (references `users`)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

- **FacilityActivity (Extension)**:
  - New `event_type` values: `call_logged`, `call_log_edit`, `call_log_archive`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of call log queries and mutations are isolated by `company_id` at the database level.
- **SC-002**: A user can log a communication in under 3 clicks from a contact's click-to-call affordance.
- **SC-003**: Facility detail page load time (including loading the paginated call logs) is under 500ms.
- **SC-004**: System generates a timeline event for 100% of call log creations, edits, and archiving.

## Assumptions

- **Manual Input**: The user manually inputs the duration and outcome since the system cannot automatically capture duration or call results from the mobile device/tel link.
- **Arabic Terminology**: All UI terms are translated in a natural Arabic business tone:
  - Outbound: صادر
  - Inbound: وارد
  - Channel: قناة الاتصال
  - Call: مكالمة هاتفية
  - WhatsApp: واتساب
  - Outcome: نتيجة الاتصال
  - Duration: مدة الاتصال (ثواني)
  - Notes: ملاحظات
  - Log Communication: تسجيل اتصال
