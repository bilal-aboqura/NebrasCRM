# Tasks: Sales Pipeline Board

**Input**: Design documents from `/specs/005-sales-pipeline/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Per Principle VI of the Constitution, **tenant isolation** and **authorization tests** are MANDATORY for any feature touching scoped data or role-restricted actions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Route structure initialization and shell navigation updates

- [ ] T001 Create pipeline directory in src/app/(dashboard)/dashboard/pipeline/
- [ ] T002 Add pipeline navigation link "لوحة المبيعات" to the sidebar app shell layout in src/app/(dashboard)/layout.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema expansion and testing baseline setup

- [ ] T003 Create database migration file for lost_reason and status_changed_at in supabase/migrations/20260616000003_pipeline_lost_reason.sql
- [ ] T004 Apply database migrations and seeds locally using npx supabase db reset
- [ ] T005 Initialize pgTAP unit test file for pipeline isolation in supabase/tests/005-sales-pipeline.test.sql

---

## Phase 3: User Story 1 - Kanban Board RTL Visual Layout (Priority: P1) 🎯 MVP

**Goal**: Render the visual RTL pipeline grid of columns and facility cards for authorized users

**Independent Test**: Log in as a Sales User, navigate to `/dashboard/pipeline`. Verify columns render RTL from Right (جديد) to Left (خاسرة), showing only assigned cards with correct counts.

### Tests for User Story 1
- [ ] T006 [P] [US1] Write pgTAP tests in supabase/tests/005-sales-pipeline.test.sql to verify that facilities are selected with tenant-scoped isolation (RLS)

### Implementation for User Story 1
- [ ] T007 [P] [US1] Define Typescript interfaces for getPipelineAction response and columns payload in src/lib/actions/pipeline.ts
- [ ] T008 [US1] Implement getPipelineAction server action query in src/lib/actions/pipeline.ts enforcing RLS and assignments
- [ ] T009 [P] [US1] Create facility card UI component with Call and WhatsApp shortcut actions in src/components/pipeline/KanbanCard.tsx
- [ ] T010 [P] [US1] Create column UI component with header count badges in src/components/pipeline/KanbanColumn.tsx
- [ ] T011 [US1] Implement mobile single-column view and swipeable header tabs in src/components/pipeline/MobileTabbedHeader.tsx
- [ ] T012 [US1] Integrate columns, cards, and mobile views inside src/components/pipeline/KanbanBoard.tsx
- [ ] T013 [US1] Implement Next.js Page handler connecting dashboard route to board wrapper in src/app/(dashboard)/dashboard/pipeline/page.tsx

---

## Phase 4: User Story 2 - Drag-and-Drop Status Migration (Priority: P1)

**Goal**: Support changing status via drag-and-drop or keyboard-accessible card menu

**Independent Test**: Drag a card to another stage, confirm counts update instantly, and details timeline log records the change. Reject out-of-scope moves and revert card placement.

### Tests for User Story 2
- [ ] T014 [P] [US2] Write pgTAP tests in supabase/tests/005-sales-pipeline.test.sql to verify that status updates fail for cross-tenant or unowned facilities, and succeed with activity log writes on owned facilities

### Implementation for User Story 2
- [ ] T015 [US2] Implement updateFacilityStatusAction server action in src/lib/actions/pipeline.ts recording status_change logs and handling lost_reason
- [ ] T016 [US2] Integrate HTML5 drag-and-drop pointer event handlers in src/components/pipeline/KanbanBoard.tsx and src/components/pipeline/KanbanColumn.tsx
- [ ] T017 [US2] Implement optimistic UI update and rollback reconciliation logic on drag failure in src/components/pipeline/KanbanBoard.tsx
- [ ] T018 [US2] Create terminal stage transition confirmation modal capturing lost_reason in src/components/pipeline/ConfirmTerminalModal.tsx
- [ ] T019 [US2] Add keyboard-accessible action menu dropdown to cards in src/components/pipeline/KanbanCard.tsx, calling updateFacilityStatusAction

---

## Phase 5: User Story 3 - Paginated Lazy Loading / Load More (Priority: P1)

**Goal**: Limit page size to 10 cards per column, loading more via a CTA button

**Independent Test**: Load a column with 12 items. Verify only 10 cards display with a "Load More" button and a header count of 12. Tap "Load More" to reveal the last 2 cards.

### Implementation for User Story 3
- [ ] T020 [US3] Implement pagination offset query filters in getPipelineAction server action in src/lib/actions/pipeline.ts
- [ ] T021 [US3] Implement "Load More" button and client-side card concatenation logic in src/components/pipeline/KanbanColumn.tsx

---

## Phase 6: User Story 4 - Board Search & Filtering (Priority: P2)

**Goal**: Filter board columns by assigned owner, city, and facility type

**Independent Test**: Select a city or facility type. Confirm columns filter instantly and header counts recalculate accordingly.

### Implementation for User Story 4
- [ ] T022 [US4] Add filter payload handling inside getPipelineAction in src/lib/actions/pipeline.ts
- [ ] T023 [US4] Render filter selection components in src/components/pipeline/KanbanBoard.tsx resetting pagination states on modification

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Performance checks, accessibility verification, and cleanup

- [ ] T024 Run complete database pgTAP tests suite in supabase/tests/005-sales-pipeline.test.sql
- [ ] T025 Verify ARIA announcements and tab focus sequences on mobile and desktop viewports
- [ ] T026 Execute quickstart.md validation checklist to confirm clean builds and deployment readiness

---

## Dependencies & Execution Order

### Phase Dependencies
- Setup (Phase 1) is ready to initiate.
- Foundational (Phase 2) builds the database columns and triggers. This is a blocking prerequisite.
- User Story 1 (Phase 3) must be complete to verify visual grid layout.
- User Story 2 (Phase 4), User Story 3 (Phase 5), and User Story 4 (Phase 6) depend on User Story 1 being fully functional.

### Parallel Opportunities
- All [P] marked tests and UI elements can be developed in parallel by separate builders once setup is complete.
- Visual component structures for columns and cards (T009, T010) can be created independently of the server action implementations.
