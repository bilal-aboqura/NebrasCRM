# Tasks: CBAHI Self-Assessment Tool

**Input**: Design documents from `/specs/016-cbahi-self-assessment/`
**Prerequisites**: plan.md (required), spec.md (required)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directories `src/app/(public)/assessment` and `src/components/assessment`
- [X] T002 Initialize static CBAHI questions bank data in `src/lib/data/cbahi-data.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hook, shared public app shell layout, and unit tests

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Implement custom React session hook in `src/hooks/use-cbahi-session.ts` for scoring formulas, reset, and state management
- [X] T004 Create shared public wrapper layout in `src/app/(public)/layout.tsx` (top contact strip, primary header with navigation link, and footer)
- [X] T005 Create automated tests for custom hook logic in `src/tests/016-cbahi-self-assessment.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Facility Type Selection & Form Load (Priority: P1) 🎯 MVP

**Goal**: Load the correct chapters and standard counts depending on whether General Medical Complexes or Dental Centers is selected

**Independent Test**: Navigate to `/assessment` and toggle between General and Dental complexes, verifying the correct items display

### Implementation for User Story 1

- [X] T006 [P] [US1] Create toggling selectors and confirmation modal component in `src/components/assessment/FacilitySelector.tsx`
- [X] T007 [US1] Create public assessment page wrapper container in `src/app/(public)/assessment/page.tsx` integrating the state hook and initial structure

**Checkpoint**: User Story 1 is functional; correct standard counts load for both facility types

---

## Phase 4: User Story 2 - Chapter-Based Assessment & Live Scoring (Priority: P1) 🎯 MVP

**Goal**: Let user respond to questions and write notes while the circular score ring and stats update live on the screen

**Independent Test**: Answer questions on the page and verify that the circular conic-gradient score and count stats update in real-time

### Implementation for User Story 2

- [X] T008 [P] [US2] Build questionnaire listing component in `src/components/assessment/AssessmentPanel.tsx` showing standard codes, questions, suggested evidence, compliance selector, and notes textarea
- [X] T009 [P] [US2] Build score progress and counts breakdown sidebar component in `src/components/assessment/ScoringSidebar.tsx`
- [X] T010 [US2] Integrate `AssessmentPanel` and `ScoringSidebar` in `/assessment` main page inside `src/app/(public)/assessment/page.tsx`

**Checkpoint**: Main assessment forms and live scoring elements are fully functional

---

## Phase 5: User Story 3 - Gap Report Generation & Printing (Priority: P2)

**Goal**: Render a summary gap report of the top 25 gaps with a Call-to-Action to the lead capture page, and support printing the results in RTL layout

**Independent Test**: Click "إصدار تقرير الجاهزية", review the gaps list, click the CTA to verify URL pre-fill parameters, and click "طباعة التقرير" to verify print optimization

### Implementation for User Story 3

- [X] T011 [P] [US3] Build report card and gaps table component in `src/components/assessment/GapReportSection.tsx` featuring the URL pre-filled redirecting CTA
- [X] T012 [US3] Add print styling overrides in `src/app/(public)/assessment/page.tsx` to hide navigational layout components and interactive inputs during browser printing
- [X] T013 [US3] Integrate `GapReportSection` and print button handler to `/assessment` main page inside `src/app/(public)/assessment/page.tsx`

**Checkpoint**: Gap report is visible, printable, and redirects with score query parameters correctly

---

## Phase 6: User Story 4 - Chapter Filtering & Assessment Reset (Priority: P3)

**Goal**: Allow filtering of standards by individual chapters and clearing the assessment to initial state

**Independent Test**: Filter by chapter, verify only its items render, and click the reset button to wipe out all answers/notes/scores

### Implementation for User Story 4

- [X] T014 [US4] Add chapter select filter dropdown to `AssessmentPanel.tsx` in `src/components/assessment/AssessmentPanel.tsx`
- [X] T015 [US4] Bind reset session action to the button in `ScoringSidebar.tsx` and main controller inside `src/app/(public)/assessment/page.tsx`

**Checkpoint**: All interactive filtering and reset controls are functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Visual polishing, mobile responsive checking, and documentation

- [X] T016 Run and verify all unit tests in `src/tests/016-cbahi-self-assessment.test.ts`
- [X] T017 [P] Perform visual audit of responsiveness and RTL styling across desktop, tablet, and mobile layouts in browser dev tools
- [X] T018 [P] Update walkthrough documentation in `specs/016-cbahi-self-assessment/walkthrough.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Depends on US1 structure (`page.tsx`) to render components, but can be developed in parallel
- **User Story 3 (P2)**: Can start after US2 is integrated
- **User Story 4 (P3)**: Can start after US2 and US3 are integrated

---

## Parallel Example: User Story 2

```bash
# Developer A:
Task: "Build questionnaire listing component in src/components/assessment/AssessmentPanel.tsx"

# Developer B:
Task: "Build score progress and counts breakdown sidebar component in src/components/assessment/ScoringSidebar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Test score ring and progress bar updates manually on the dev server

### Incremental Delivery

1. Complete Setup + Foundational → core logic ready
2. Add US1 & US2 → Core Questionnaire MVP ready
3. Add US3 → Gap report & printing capability ready
4. Add US4 → Chapter filters & reset controls ready
5. Polish layout, CSS variables, and complete documentation
