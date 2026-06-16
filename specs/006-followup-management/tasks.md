# Tasks: Follow-up Management

**Input**: Design documents from `/specs/006-followup-management/`
**Prerequisites**: [plan.md](file:///F:/CodingProjects/NebrasCRM/specs/006-followup-management/plan.md) (required), [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/006-followup-management/spec.md) (required for user stories), [research.md](file:///F:/CodingProjects/NebrasCRM/specs/006-followup-management/research.md), [data-model.md](file:///F:/CodingProjects/NebrasCRM/specs/006-followup-management/data-model.md), [followup-actions.md](file:///F:/CodingProjects/NebrasCRM/specs/006-followup-management/contracts/followup-actions.md)

**Tests**: Tenant isolation and authorization tests are **MANDATORY** per Principle VI of the Constitution, as this feature manages tenant-scoped data and enforces role-based access rules.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initial project structures and environment settings

- [X] T001 Initialize database type definitions for new enums and tables in `src/lib/types/followups.ts`
- [X] T002 Configure routing structure by creating the route directory for the dedicated view in `src/app/(dashboard)/dashboard/followups/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database tables, indexes, constraints, triggers, and pgTAP unit tests

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create database migration file `supabase/migrations/20260616000004_followup_management.sql` containing followups table, enums, indexes, and composite contact-validation FK constraints
- [X] T004 Create database trigger `trg_followups_updated_at` to automatically manage the `updated_at` timestamp in `supabase/migrations/20260616000004_followup_management.sql`
- [X] T005 Create database trigger `trg_facility_owner_cascade` to automatically reassign pending followups when a facility's owner changes to a non-null sales user in `supabase/migrations/20260616000004_followup_management.sql`
- [X] T006 Create pgTAP tests `supabase/tests/006-followup-management.test.sql` to verify RLS policies, unique constraints, and the owner-change trigger cascade
- [ ] T007 Apply migrations locally and verify tests using `supabase db reset && supabase db test`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Schedule a Follow-up on a Facility (Priority: P1) 🎯 MVP

**Goal**: Allow authorized users to schedule follow-ups on facilities they own (or any in company for supervisors/admins) with a future due date, optional contact, and notes.

**Independent Test**: Create a follow-up for an assigned facility, verify it defaults owner to yourself, inherits company isolation, and creates timeline logs.

### Tests for User Story 1
- [X] T008 [P] [US1] Write integration tests in `src/tests/integration/followups.test.ts` verifying `createFollowUp` permissions, future due-date enforcement, and contact-facility pairing validation.

### Implementation for User Story 1
- [X] T009 [P] [US1] Create type definitions and schema validators for `CreateFollowUpInput` in `src/lib/types/followups.ts`
- [X] T010 [US1] Implement Server Action `createFollowUp` in `src/lib/actions/followups.ts` enforcing tenant isolation and logging `followup_create` events on the timeline
- [X] T011 [US1] Design and build the frontend `FollowUpModal` component in `src/components/followups/FollowUpModal.tsx` supporting type selection, due date/time picking, contact selection, and notes
- [X] T012 [US1] Integrate `FollowUpModal` and pending list container within the facility detail page's follow-ups section in `src/components/facilities/FollowUpsSection.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Complete a Follow-up with Outcome (Priority: P1)

**Goal**: Transition follow-up status to done, recording outcome and outcome note, removing the item from overdue calculation.

**Independent Test**: Open a pending follow-up, open the completion modal, select an outcome, and save. Verify the status updates to done and timeline event is generated.

### Tests for User Story 2
- [X] T013 [P] [US2] Write integration tests in `src/tests/integration/followups.test.ts` verifying that completing a follow-up removes it from overdue checks and updates the completion actor and timestamp.

### Implementation for User Story 2
- [X] T014 [US2] Implement Server Action `completeFollowUp` in `src/lib/actions/followups.ts` enforcing status transition validation and logging `followup_complete` events on the timeline
- [X] T015 [US2] Build `CompleteFollowUpModal` component in `src/components/followups/CompleteFollowUpModal.tsx` containing type-aware quick-select outcome tags and optional text area
- [X] T016 [US2] Update `FollowUpsSection.tsx` in `src/components/facilities/` to render completion triggers and styled checkmarks for completed follow-ups

**Checkpoint**: User Story 2 is fully functional and testable independently.

---

## Phase 5: User Story 3 - Reschedule or Cancel a Follow-up (Priority: P1)

**Goal**: Update due dates or soft-cancel pending follow-ups with reason, preserving records.

**Independent Test**: Reschedule a follow-up and verify the new date is set and timeline updated. Cancel a follow-up and verify it is not deleted and logs the reason.

### Tests for User Story 3
- [X] T017 [P] [US3] Write integration tests in `src/tests/integration/followups.test.ts` verifying rescheduling bounds (must be in the future) and soft-cancellation record persistence (no hard delete).

### Implementation for User Story 3
- [X] T018 [US3] Implement Server Actions `rescheduleFollowUp` and `cancelFollowUp` in `src/lib/actions/followups.ts` logging timeline events for rescheduling and cancellations
- [X] T019 [US3] Update `FollowUpModal.tsx` in `src/components/followups/` to support rescheduling inputs and cancellation reasons
- [X] T020 [US3] Integrate reschedule and cancel buttons and modals into `FollowUpsSection.tsx` in `src/components/facilities/`

**Checkpoint**: User Story 3 is fully functional and testable independently.

---

## Phase 6: User Story 4 - Dedicated Follow-ups Workboard ("المتابعات") (Priority: P1)

**Goal**: A single unified workboard showing all pending follow-ups sorted by urgency, filterable by state, and filterable by assigned owner for managers.

**Independent Test**: Open "المتابعات" page, verify it loads "All Pending" sorted by due_at with overdue items highlighted. Switch filters, verify manager owner-dropdown is available.

### Tests for User Story 4
- [X] T021 [P] [US4] Write integration tests in `src/tests/integration/followups.test.ts` verifying that `getFollowUpsList` filters out follow-ups of archived parent facilities, sorts pending by due date ascending, and enforces role-based scope boundaries.

### Implementation for User Story 4
- [X] T022 [US4] Implement fetch Server Action `getFollowUpsList` in `src/lib/actions/followups.ts` with pagination, status filters, and manager-only assigned owner filters
- [X] T023 [US4] Create dedicated view route page `src/app/(dashboard)/dashboard/followups/page.tsx` containing consolidated pending list container, tabs (All Pending, Done, Overdue, Today, Upcoming), and manager owner filters
- [X] T024 [US4] Implement styling and visual highlights for overdue items (soft red backgrounds/text badges) in the row list component within `src/app/(dashboard)/dashboard/followups/page.tsx`

**Checkpoint**: User Story 4 is fully functional and testable independently.

---

## Phase 7: User Story 5 - Reassign Follow-up Ownership (Priority: P2)

**Goal**: Allow supervisors/admins to reassign a follow-up's owner.

**Independent Test**: Log in as supervisor, open edit owner dropdown for a follow-up, change it, and verify the new owner receives it.

### Tests for User Story 5
- [X] T025 [P] [US5] Write integration tests in `src/tests/integration/followups.test.ts` verifying that `reassignFollowUp` is restricted to management roles and logs the reassignment event.

### Implementation for User Story 5
- [X] T026 [US5] Implement Server Action `reassignFollowUp` in `src/lib/actions/followups.ts` restricting execution to Supervisor, Company Admin, and Super Admin roles
- [X] T027 [US5] Add owner reattribution selection dropdown in `FollowUpModal.tsx` for manager roles

**Checkpoint**: User Story 5 is fully functional and testable independently.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Multi-file updates, security auditing, and transaction wrappers

- [ ] T028 Update Server Action `reassignFacility` in `src/lib/actions/facilities.ts` to wrap facility reassignment and follow-ups owner cascade in a single atomic transaction when reassigning a facility to `NULL` (unassigned), transferring pending follow-ups to the acting manager
- [ ] T029 Audit all follow-up pages to ensure strict RTL layout flow, Tajawal font application, and proper translation keys for Arabic terminology
- [ ] T030 Run full test suites `supabase db test` and `npm run test:integration` to verify comprehensive coverage and compliance with all principles

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational (Phase 2) completion
- **Polish (Phase N)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Blocks all other follow-up actions (Complete, Reschedule, Cancel, Reassign)
- **User Story 2 (P2)**: Depends on User Story 1
- **User Story 3 (P3)**: Depends on User Story 1
- **User Story 4 (P4)**: Depends on User Story 1
- **User Story 5 (P5)**: Depends on User Story 1

### Within Each User Story

- Integration tests are written and run first, ensuring they fail before implementing backend Actions and UI components.
- Server Actions are implemented before UI components.
- Components are fully integrated and tested before moving to the next story.

---

## Parallel Opportunities

- All database trigger creation tasks (T004, T005) can run in parallel with RLS tests (T006).
- Once User Story 1 is complete:
  - Developer A can work on US2 (Complete action)
  - Developer B can work on US3 (Reschedule/Cancel actions)
  - Developer C can work on US4 (Dedicated "المتابعات" page)
- UI and Action integration tests can be written in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - database setup)
3. Complete Phase 3: User Story 1 (Schedule a Follow-up)
4. **STOP and VALIDATE**: Verify we can schedule follow-ups on facilities and log them on the timeline.

### Incremental Delivery

1. Complete Setup + Foundational
2. Add US1 (Schedule) → Test & Validate (MVP)
3. Add US2 (Complete) → Test & Validate
4. Add US3 (Reschedule/Cancel) → Test & Validate
5. Add US4 (Dedicated Workboard) → Test & Validate
6. Add US5 (Reassign) → Test & Validate
7. Apply Polish transactions and RTL audits.
