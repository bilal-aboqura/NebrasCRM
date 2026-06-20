# Tasks: Assessment Persistence and CRM Linking

**Input**: Design documents from `/specs/017-assessment-persistence/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3)
- Includes exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize type definitions in `src/lib/types/assessment.ts` for saved assessments and answers
- [x] T002 Configure mock database store exports in `src/lib/data/store.ts` to support new assessments tables

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema creation and migration framework setup

- [x] T003 [P] Create database migration file `supabase/migrations/20260621000000_create_assessments_table.sql` defining assessments table structure, indexes, check constraints, RLS policies, and immutability trigger
- [x] T004 Apply database schema migration locally using Supabase CLI command `supabase db reset`

**Checkpoint**: Database table and RLS policies are active and ready.

---

## Phase 3: User Story 1 - Saving a CRM-Linked Assessment (Priority: P1) 🎯 MVP

**Goal**: Enable logged-in CRM users to save a completed assessment and link it to a selected facility.

**Independent Test**: Complete assessment, click "حفظ التقييم", select facility, confirm, and verify database entry and timeline entry.

### Tests for User Story 1 (MANDATORY per Principle VI)
- [x] T005 [P] [US1] Create automated unit/integration tests in `tests/017-assessment-persistence.test.ts` for tenant isolation (Company A vs B) and server-side score calculation logic (asserting correct math, mixed options, and N/A handling)

### Implementation for User Story 1
- [x] T006 [US1] Create server action `saveAssessment` in `src/lib/actions/assessment-actions.ts` with authentication verification, company isolation checks, dynamic score/tier recalculation, and timeline activity logging
- [x] T007 [P] [US1] Create facility selection dropdown modal component in `src/components/assessment/FacilitySelector.tsx`
- [x] T008 [US1] Update self-assessment page in `src/app/(public)/assessment/page.tsx` to conditionally render "حفظ التقييم" button for authenticated users and hook it to `FacilitySelector.tsx` and the `saveAssessment` action

**Checkpoint**: Logged-in consultants can successfully audit a facility and save the result.

---

## Phase 4: User Story 2 - Facility Self-Assessment History (Priority: P1)

**Goal**: Render a list of all historical assessments for a facility on its detail page, sorted newest first, showing date, assessor, score, type, and a progression trend.

**Independent Test**: Navigate to a facility detail page. Verify history list is correct, badges match tiers, and trend text is correct.

### Tests for User Story 2
- [x] T009 [P] [US2] Create integration tests in `tests/017-assessment-persistence.test.ts` to verify history retrieval logic and Progression Text delta calculations

### Implementation for User Story 2
- [x] T010 [US2] Create self-assessment history list component in `src/components/facilities/SelfAssessmentHistory.tsx` rendering progression text (e.g. `45% ⬅️ 78% (+33%)`) and status badges
- [x] T011 [US2] Integrate `SelfAssessmentHistory.tsx` component into the facility detail page at `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx`

**Checkpoint**: Facility detail page renders assessment history and progression trend correctly.

---

## Phase 5: User Story 3 - View Saved Assessment Details (Priority: P1)

**Goal**: Allow clicking a saved assessment record to open a read-only detailed audit report showing the exact answers and notes recorded.

**Independent Test**: Click on assessment in history list, verify modal/view loads correctly, displays correct scores, and all inputs are read-only.

### Implementation for User Story 3
- [x] T012 [P] [US3] Create read-only assessment details view modal in `src/components/assessment/SavedAssessmentModal.tsx` disabling all interactive selects, textareas, and buttons
- [x] T013 [US3] Connect list items in `src/components/facilities/SelfAssessmentHistory.tsx` to open the `SavedAssessmentModal.tsx` component on click

**Checkpoint**: Historical audits can be opened in detailed read-only format.

---

## Phase 6: User Story 4 - Launch Pre-Linked Assessment (Priority: P2)

**Goal**: Enable launching a new assessment session directly from a facility's detail page with the facility pre-selected and correct type pre-filled.

**Independent Test**: Click "بدء تقييم جديد" from a general complex facility, verify assessment tool opens with general complex pre-selected and facility pre-linked.

### Implementation for User Story 4
- [x] T014 [P] [US4] Add "بدء تقييم جديد" button to `src/components/facilities/SelfAssessmentHistory.tsx` linking to `/assessment?facility_id={id}&type={mapped_type}`
- [x] T015 [US4] Update assessment container in `src/app/(public)/assessment/page.tsx` to parse query parameters, pre-select facility and type configuration, and display pre-linked banner

**Checkpoint**: Direct audit creation from facility detail page is fully operational.

---

## Phase 7: User Story 5 - Assessment Soft-Archiving and Recovery (Priority: P3)

**Goal**: Allow supervisors and administrators to soft-archive outdated assessments and recover them, generating timeline entries.

**Independent Test**: Log in as admin, archive assessment, verify it disappears from history, timeline log is updated, recovery restores it.

### Tests for User Story 5
- [x] T016 [P] [US5] Add unit tests in `tests/017-assessment-persistence.test.ts` to assert that archiving/recovery functions enforce supervisor/admin access restrictions

### Implementation for User Story 5
- [x] T017 [US5] Add `archiveAssessment` and `recoverAssessment` Server Actions in `src/lib/actions/assessment-actions.ts` setting the archive flags and creating a timeline log entry
- [x] T018 [US5] Integrate archive button inside `src/components/assessment/SavedAssessmentModal.tsx` conditional on supervisor/admin role
- [x] T019 [US5] Add "Show Archived" toggle and recovery button inside `src/components/facilities/SelfAssessmentHistory.tsx` for supervisors/admins
- [x] T020 [US5] Update timeline event details in `src/components/facilities/ActivityTimeline.tsx` to display an archived status tag on the original "تم حفظ التقييم" event if it is archived

**Checkpoint**: Supervisors/admins can fully manage archiving and recovery of historical audits.

---

## Phase 8: Polish & Final Validation (Priority: P2)
- [x] T021 [US1,US2,US3,US4,US5] Verify CSS and RTL alignment for Arabic layout in all newly added components
- [x] T022 [P] [US1,US2,US3,US4,US5] Run the automated test suite locally to verify no regressions
- [x] T023 [P] [US1,US2,US3,US4,US5] Run validation walkthrough per `quickstart.md` instructions

---

## Dependencies & Execution Order

### Phase Dependencies
1. **Setup (Phase 1)**: Can start immediately.
2. **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
3. **User Stories (Phases 3-7)**: All depend on Foundational completion.
   - User stories can run in parallel or sequentially: US1 (P1) → US2 (P1) → US3 (P1) → US4 (P2) → US5 (P3).
4. **Polish (Phase 8)**: Depends on all user stories.

### Parallel Opportunities
- T003 (migration definition) can run in parallel with Setup phase.
- Once Foundational phase is complete, US1, US2, and US3 tasks marked `[P]` can start in parallel.
- All unit/integration tests marked `[P]` can be developed in parallel.

---

## Parallel Example: User Story 1
```bash
# Developer A: Create database unit tests
Task: "Create automated unit/integration tests in tests/017-assessment-persistence.test.ts"

# Developer B: Develop UI picker
Task: "Create facility selection dropdown modal component in src/components/assessment/FacilitySelector.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup and Foundational migration.
2. Implement `saveAssessment` Server Action and link the UI save button in the assessment tool.
3. Verify that completing and saving an assessment writes to the DB correctly.

### Incremental Delivery
1. Add facility history section (US2).
2. Add detailed read-only modal (US3).
3. Add launch from detail shortcut (US4).
4. Add archiving controls (US5).
5. Verify and polish layout.
