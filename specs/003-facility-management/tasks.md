# Tasks: Facility Management

**Input**: Design documents from `/specs/003-facility-management/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/facility-actions.md  

**Tests**: Tenant isolation and authorization tests are MANDATORY per Principle VI of the Constitution. Database level tests use pgTAP, and application level tests use Vitest/Playwright.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create page directories under `src/app/(dashboard)/dashboard/facilities` and components directory under `src/components/facilities`
- [X] T002 Create phone normalization utility file `src/lib/utils/phone.ts` and test file `src/lib/utils/phone.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database tables, seeds, RLS policies, and triggers

- [X] T003 Create database migrations for regions, cities reference data tables, and seed scripts in `supabase/migrations/20260616000001_facility_management.sql`
- [X] T004 Create migrations for facilities, facility_activity tables, triggers for phone normalization, updated_at timestamps, and tenant unique indexes in `supabase/migrations/20260616000001_facility_management.sql`
- [X] T005 [P] Implement database security RLS validation tests in pgTAP at `supabase/tests/003-facility-management.test.sql`
- [X] T006 [P] Implement phone normalization helper in `src/lib/utils/phone.ts`
- [X] T007 Implement Server Action database initialization in `src/lib/actions/facilities.ts`

**Checkpoint**: Foundation ready - database tables, seeds, and triggers are complete and verified.

---

## Phase 3: User Story 1 - Create Facility with Scoped Assignment (Priority: P1) ðŸŽ¯ MVP

**Goal**: Create facilities with tenant-scoped validation and role-scoped ownership assignment.

**Independent Test**:
Log in as a Sales User of Company A, add a facility, and verify that the owner is automatically set to yourself and the tenant is set to Company A. Log in as Admin/Supervisor, and verify that you can optionally select an owner from active Sales Users or leave it unassigned.

### Tests for User Story 1
- [X] T008 [P] [US1] Write integration tests in `tests/integration/facilities.test.ts` verifying that creating a facility validates role assignments and throws collision errors for duplicate phone numbers.

### Implementation for User Story 1
- [X] T009 [US1] Implement the `createFacility` Server Action in `src/lib/actions/facilities.ts` with normalization, tenant-scoping, and duplicate phone collision routing message.
- [X] T010 [US1] Create the `FacilityForm` component in `src/components/facilities/FacilityForm.tsx` with dependent Saudi regions/cities dropdowns and "Other" fallback.
- [X] T011 [US1] Integrate `FacilityForm` modal triggering on the main layout page.

**Checkpoint**: At this point, facility creation is fully functional and testable independently.

---

## Phase 4: User Story 2 - Tenant-Scoped Paginated Directory with Search & Filtering (Priority: P1)

**Goal**: Render a paginated list of facilities filtered by tenant and role-based visibility.

**Independent Test**:
Log in as a Sales User and search/filter. Verify that only facilities assigned to you are returned, and unassigned/other-owned records are excluded. Log in as Admin/Supervisor and verify all company facilities are visible.

### Tests for User Story 2
- [X] T012 [P] [US2] Write integration tests in `tests/integration/facilities.test.ts` for directory search, status filtering, and pagination limits.

### Implementation for User Story 2
- [X] T013 [US2] Implement the `getFacilitiesList` Server Action in `src/lib/actions/facilities.ts` supporting pagination, query search, and filters.
- [X] T014 [US2] Build the facilities list directory view page in `src/app/(dashboard)/dashboard/facilities/page.tsx` rendering data in an RTL Arabic table.

**Checkpoint**: At this point, the tenant-scoped paginated directory is fully functional and testable.

---

## Phase 5: User Story 3 - Facility Detail Hub & Communication Affordances (Priority: P1)

**Goal**: Facility detail page displaying core details, click-to-call/WhatsApp affordances, and chronological history timeline.

**Independent Test**:
Open the detail page of a facility. Verify that the primary/secondary phone number click-to-call functions, and the WhatsApp link opens with a pre-filled template message replacing `[Ø§Ø³Ù… Ø§Ù„Ø´Ø±ÙƒØ©]` with the active company's name.

### Tests for User Story 3
- [X] T015 [P] [US3] Write integration tests in `tests/integration/facilities.test.ts` verifying that WhatsApp template text replaces company placeholders and phone numbers are normalized to digits-only.

### Implementation for User Story 3
- [X] T016 [US3] Implement `getFacilityDetail` and `getFacilityActivity` Server Actions in `src/lib/actions/facilities.ts`.
- [X] T017 [US3] Create the timeline component `src/components/facilities/ActivityTimeline.tsx` displaying chronological update logs in Arabic.
- [X] T018 [US3] Build the facility detail page in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx` with tel links, wa.me redirection, and the timeline.

**Checkpoint**: Facility detail hub and communications are fully functional and testable.

---

## Phase 6: User Story 4 - Facility Edit & Reassignment (Priority: P1)

**Goal**: Edit facility details, status, and reassign ownership (Admins/Supervisors only), writing activity logs.

**Independent Test**:
Edit a facility's details and change status/owner. Verify changes are recorded in the `FacilityActivity` log table and displayed on the detail timeline.

### Tests for User Story 4
- [X] T019 [P] [US4] Write integration tests in `tests/integration/facilities.test.ts` verifying that only authorized roles can reassign ownership and update status.

### Implementation for User Story 4
- [X] T020 [US4] Implement the `updateFacility` Server Action in `src/lib/actions/facilities.ts` to edit profile details and ownership, writing `FacilityActivity` log entries.
- [X] T021 [US4] Add the edit form modal trigger on the facility detail page in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx`.

**Checkpoint**: Editing and owner reassignment are fully functional and logged to the timeline.

---

## Phase 7: User Story 5 - Facility Archival & Recovery (Soft-Delete) (Priority: P2)

**Goal**: Allow Admins/Supervisors to archive or recover facilities (soft-delete), visible behind a "Show Archived" toggle filter.

**Independent Test**:
Archive a facility. Verify that it disappears from default lists. Toggle the "Show Archived" filter, open the archived facility, click "Recover", and verify it is restored.

### Tests for User Story 5
- [X] T022 [P] [US5] Write integration tests in `tests/integration/facilities.test.ts` verifying that Sales Users cannot invoke archive/recover actions and that soft-deletes hide records from default views.

### Implementation for User Story 5
- [X] T023 [US5] Implement `archiveFacility` and `recoverFacility` Server Actions in `src/lib/actions/facilities.ts` restricting access to supervisor/admin roles and writing history logs.
- [X] T024 [US5] Add the "Archive" action to the detail page and the "Show Archived" toggle filter to the facilities directory page.

**Checkpoint**: Archiving and recovery are fully functional and restricted.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Code quality, test execution, and quickstart verification

- [ ] T025 Run local pgTAP unit tests: `supabase db test`
- [X] T026 Run local integration tests: `npm run test:integration`
- [X] T027 Perform final responsive UI checks and verify RTL alignment under `src/app/(dashboard)/dashboard/facilities`
- [ ] T028 Validate all steps in `quickstart.md` function as written

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phases 3 to 7)**: All depend on Foundational phase completion.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational - May list User Story 1 records but functions independently.
- **User Story 3 (P3)**: Depends on User Story 1 (needs facility detail routing) and Foundational.
- **User Story 4 (P4)**: Depends on User Story 3 (needs edit modal triggering within detail page) and Foundational.
- **User Story 5 (P5)**: Depends on User Story 3 & 4 and Foundational.

### Parallel Opportunities

- All Setup tasks marked `[P]` can run in parallel.
- All Foundational tasks marked `[P]` can run in parallel (T005 and T006).
- Once Foundational phase is complete, US1 and US2 can be developed in parallel.
- Different developers can write integration tests in parallel with implementation.

---

## Parallel Example: User Story 1

```bash
# Launch integration test file first:
Task: "Write integration tests in tests/integration/facilities.test.ts"

# Implement form component and utility logic together:
Task: "Create the FacilityForm component in src/components/facilities/FacilityForm.tsx"
Task: "Implement phone normalization helper in src/lib/utils/phone.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1 (Facility Creation).
4. Complete Phase 4: User Story 2 (Directory List).
5. **STOP and VALIDATE**: Verify creation and directory list scoped by tenant.
6. Deploy/demo initial CRUD operations.
