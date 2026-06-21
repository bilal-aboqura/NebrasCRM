# Tasks: Call and Communication Logging

**Input**: Design documents from `/specs/007-call-logging/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per Principle VI of the Constitution, **tenant isolation** and **authorization tests** are MANDATORY for any feature touching scoped data or role-restricted actions. Detailed test tasks are included at the start of each user story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [X] T001 Create feature branch placeholders and directories in specs/007-call-logging/
- [X] T002 [P] Create initial blank Server Action file `src/lib/actions/call-logs.ts` and UI component files in `src/components/facilities/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema setup, constraints, RLS policies, and database tests.

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create Supabase migration file `supabase/migrations/20260616000005_call_logging.sql` defining custom communication enums (`communication_channel`, `communication_direction`, `communication_outcome`) and table `call_logs` with PK, FKs, and `company_id`.
- [X] T004 Implement composite validation trigger `trg_validate_call_log` in `supabase/migrations/20260616000005_call_logging.sql` to enforce that contact and follow-up belong to the parent facility, and occurred_at is not in the future.
- [X] T005 Enable RLS on `call_logs` and implement tenant isolation and role-based SELECT/INSERT/UPDATE policies in `supabase/migrations/20260616000005_call_logging.sql`.
- [X] T006 Write pgTAP database unit tests in `supabase/tests/007-call-logging.test.sql` to verify RLS isolation policies and cross-facility contact/follow-up insert blocks.
- [ ] T007 Apply migrations locally and run database unit tests using `supabase db reset` and `supabase db test`.

**Checkpoint**: Foundation ready - database constraints and tenant isolation verified.

---

## Phase 3: User Story 1 - Manually Log a Communication (Priority: P1) ðŸŽ¯ MVP

**Goal**: Reps manually log a past or current communication against a facility and contact.

**Independent Test**: Log in as a Sales User, open an assigned facility, click "ØªØ³Ø¬ÙŠÙ„ Ø§ØªØµØ§Ù„" (Log Communication), fill details, save. Verify it appears in the list and timeline, and that Company B users cannot read or modify it.

### Tests for User Story 1
- [X] T008 [P] [US1] Write integration tests in `tests/integration/call-logs.test.ts` to verify Server Action creation, authorization, and RLS company scoping.

### Implementation for User Story 1
- [X] T009 [US1] Implement Server Action `createCallLog` in `src/lib/actions/call-logs.ts` including facility write authorization checks, validation logic, and inserting to `call_logs` table.
- [X] T010 [US1] Add timeline logging to generate a `call_logged` event in `facility_activity` in Arabic inside `createCallLog` in `src/lib/actions/call-logs.ts`.
- [X] T011 [P] [US1] Create the Arabic manual logging modal `LogCommunicationModal` in `src/components/facilities/LogCommunicationModal.tsx` following the Tajawal font and platform design system.
- [X] T012 [US1] Integrate `LogCommunicationModal` into the facility detail page in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx` with a trigger button.

**Checkpoint**: Manual logging is fully functional and testable independently.

---

## Phase 4: User Story 2 - Quick-Log Prompt (Priority: P1)

**Goal**: Display a floating outcome logging banner when returning focus to the CRM tab after clicking tel:/wa.me links.

**Independent Test**: Tap phone icon on contact. Switch window, return to CRM. floating banner appears at the bottom. Select outcome, save. Verify log is saved and banner disappears.

### Tests for User Story 2
- [X] T013 [P] [US2] Write unit/integration tests in `tests/integration/quick-log-banner.test.ts` verifying event listeners, visibility change states, and pre-filling context.

### Implementation for User Story 2
- [X] T014 [US2] Add outbound click tracking logic to local storage/state in the contact list view component in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx` when click-to-call or WhatsApp links are clicked.
- [X] T015 [P] [US2] Create the floating component `QuickLogBanner` in `src/components/facilities/QuickLogBanner.tsx` incorporating window focus/visibility change event listeners, pre-filled details, outcome selector, notes input, and save/dismiss controls.
- [X] T016 [US2] Mount `QuickLogBanner` in the facility detail page layout in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx`.

**Checkpoint**: Outbound clicks correctly trigger the non-blocking outcome banner on tab focus return.

---

## Phase 5: User Story 3 - Link Call Log to Follow-up Completion (Priority: P1)

**Goal**: Fulfilling a call follow-up offers to log details, and logging a call with a linked follow-up automatically completes it.

**Independent Test**: Complete a call follow-up. Completion modal prompts to log details. Check toggle, save. Verify follow-up transitions to "done" and a call log is created atomically.

### Tests for User Story 3
- [X] T017 [P] [US3] Write integration tests in `tests/integration/followups-linking.test.ts` verifying atomic transaction completion and outcome-aware checkbox states.

### Implementation for User Story 3
- [X] T018 [US3] Update follow-up completion Server Action in `src/lib/actions/followups.ts` to allow creating and linking a call log atomically within a database transaction.
- [X] T019 [US3] Add the outcome-aware checkbox "Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©" (Mark linked follow-up as completed) and default toggle state calculations to the `LogCommunicationModal` in `src/components/facilities/LogCommunicationModal.tsx`.
- [X] T020 [US3] Extend `createCallLog` in `src/lib/actions/call-logs.ts` to handle atomic update of linked follow-up to `done` and write a `followup_complete` timeline event when the toggle is checked.

**Checkpoint**: Call logs and follow-ups support atomic bidirectional completion and linkages.

---

## Phase 6: User Story 4 - View Facility Communication History (Priority: P1)

**Goal**: Display a chronological list of call logs on the facility detail page and in the activity timeline.

**Independent Test**: Open a facility detail page. Verify the "Ø³Ø¬Ù„ Ø§Ù„Ø§ØªØµØ§Ù„Ø§Øª" section shows all call logs in descending chronological order, paginated, and timeline shows `call_logged` entries.

### Tests for User Story 4
- [X] T021 [P] [US4] Write integration tests in `tests/integration/call-logs-history.test.ts` verifying chronological sorting, pagination limits, and parent-facility archival visibility checks.

### Implementation for User Story 4
- [X] T022 [P] [US4] Create the chronological call log list viewer component `CallLogsSection` in `src/components/facilities/CallLogsSection.tsx` showing channel, direction, creator, date, duration, and notes.
- [X] T023 [US4] Mount `CallLogsSection` in the placeholder area of the facility detail page in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx` with pagination controls.
- [X] T024 [US4] Update active filters on CRM lists and timeline retrieval to exclude call logs belonging to archived parent facilities in `src/lib/actions/call-logs.ts`.

**Checkpoint**: Chronological history list is populated and handles pagination and archival isolation.

---

## Phase 7: User Story 5 - Edit and Archive Call Logs (Priority: P2)

**Goal**: Enable creators to edit call logs within 24 hours, managers to edit anytime, and managers to soft-archive or recover logs.

**Independent Test**: Creator edits a call log created 2 hours ago (succeeds). Creator attempts to edit a 3-day-old log (button disabled, server blocks update). Supervisor edits the 3-day-old log and soft-archives it successfully.

### Tests for User Story 5
- [X] T025 [P] [US5] Write pgTAP tests in `supabase/tests/007-call-logging.test.sql` and integration tests in `tests/integration/call-logs-edit-archive.test.ts` for the 24-hour edit lock and manager-only soft-archiving/recovery.

### Implementation for User Story 5
- [X] T026 [US5] Implement `check_call_log_edit_window` trigger in `supabase/migrations/20260616000005_call_logging.sql` to block non-manager updates after 24 hours from creation and restrict modification of immutable fields.
- [X] T027 [US5] Implement Server Actions `updateCallLog`, `archiveCallLog`, and `recoverCallLog` in `src/lib/actions/call-logs.ts` with timeline log events (`call_log_edited`, `call_log_archived`, `call_log_recovered`).
- [X] T028 [US5] Add the edit forms and "ØªØ¹Ø¯ÙŠÙ„" (Edit) and "Ø£Ø±Ø´ÙØ©" (Archive) actions to `CallLogsSection` in `src/components/facilities/CallLogsSection.tsx` with client-side 24-hour lock button controls.

**Checkpoint**: Call log edit restrictions, soft-archiving, and manager recovery are fully functional and secure.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Shared translations, final verification, and checklist quality check.

- [X] T029 Update platform translation layer / shared dictionaries to include Arabic communication enums and UI labels.
- [ ] T030 Run all unit tests, integration tests, and manual verification checklist in `quickstart.md`.
- [X] T031 Run the `speckit-analyze` skill to verify cross-artifact consistency.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phases 3 to 7)**: All depend on Foundational phase completion.
  - User Story 1 (P1): MVP. Must be implemented first to enable logging records.
  - User Story 2 (P1): Focus prompt. Depends on User Story 1 (Server Action).
  - User Story 3 (P1): Follow-up link. Depends on User Story 1 and Feature 006.
  - User Story 4 (P1): History list. Depends on User Story 1.
  - User Story 5 (P2): Edit/Archive. Depends on User Story 1.
- **Polish (Phase 8)**: Depends on all user stories being complete.

### Within Each User Story
- Tests written and failing first.
- Server actions and validation before client UI components.
- Main layout integration after component completion.

### Parallel Opportunities
- All Setup tasks marked [P] can run in parallel.
- All database migrations and pgTAP test definitions (`T003` to `T006`) can be developed in parallel by different team members before running `T007`.
- Once Phase 2 (Foundational) completes, UI design components (`T011`, `T015`, `T022`) can be developed in parallel with Server Actions (`T009`, `T018`, `T027`).
- Once Foundational completes, User Story 1, 2, 3, 4, 5 can be worked on in parallel by different developers (as long as `createCallLog` is Stubbed/defined first).

---

## Parallel Example: User Story 1

```bash
# Launch integration tests for User Story 1:
Task: "Write integration tests in tests/integration/call-logs.test.ts"

# Launch form design in parallel:
Task: "Create the Arabic manual logging modal LogCommunicationModal in src/components/facilities/LogCommunicationModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories).
3. Complete Phase 3: User Story 1 (Manual Logging).
4. **STOP and VALIDATE**: Verify manual logging works and RLS is functional.
5. Deploy/demo manual logging MVP.

### Incremental Delivery

1. Setup + Foundational â†’ Database schema & RLS rules active.
2. Add User Story 1 â†’ Reps can manually record communications â†’ Deploy MVP.
3. Add User Story 4 â†’ Reps can view past communication list.
4. Add User Story 3 â†’ Atomic follow-up linking and checkbox toggle.
5. Add User Story 2 â†’ Automation quick-log banner trigger.
6. Add User Story 5 â†’ Edits lock window and archiving management recovery.
