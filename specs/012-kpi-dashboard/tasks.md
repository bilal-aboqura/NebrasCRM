# Tasks: Role-Aware KPI Dashboard

**Input**: Design documents from `/specs/012-kpi-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and folder prep.

- [X] T001 Create dashboard components directory src/components/dashboard
- [X] T002 Verify recharts installation in package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core server actions and authorization scaffolding.

- [X] T003 [P] Create dashboard server action file src/lib/actions/dashboard.ts
- [X] T004 Implement authorization context helper in src/lib/actions/dashboard.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Tenant & Role-Scoped Summary KPIs & Funnel (Priority: P1) 🎯 MVP

**Goal**: Display scoped active facility counts, pipeline stages, overdue follow-ups, pending offers with value, active contracts with value, conversion rate, and Recharts pipeline funnel.

**Independent Test**: Log in as a Sales User, verify only own records are counted in cards and funnel. Log in as a Supervisor, verify company-wide data and Company B exclusion.

### Tests for User Story 1

- [X] T005 [P] [US1] Create integration tests for scoped KPI cards and pipeline funnel in tests/integration/012-kpi-dashboard.test.ts

### Implementation for User Story 1

- [X] T006 [P] [US1] Implement server actions for KPI cards and stage count queries in src/lib/actions/dashboard.ts
- [X] T007 [P] [US1] Create KpiCards React component in src/components/dashboard/KpiCards.tsx
- [X] T008 [P] [US1] Create PipelineFunnel React component using Recharts in src/components/dashboard/PipelineFunnel.tsx
- [X] T009 [US1] Create main layout component DashboardClient in src/components/dashboard/DashboardClient.tsx
- [X] T010 [US1] Replace placeholder home page with dashboard controller in src/app/(dashboard)/page.tsx

**Checkpoint**: At this point, User Story 1 (MVP) is fully functional and testable.

---

## Phase 4: User Story 2 - Actionable Follow-up Alerts & Recent Activity Feed (Priority: P2)

**Goal**: Render nearest 10 overdue/due-today follow-ups and latest 15 facility activity feed items.

**Independent Test**: Schedule a task for today and verify it appears in follow-up alerts, linking back to the facility.

### Tests for User Story 2

- [X] T011 [P] [US2] Add integration tests for follow-up alerts and activity feed in tests/integration/012-kpi-dashboard.test.ts

### Implementation for User Story 2

- [X] T012 [P] [US2] Implement server actions for overdue alerts and activity log feeds in src/lib/actions/dashboard.ts
- [X] T013 [P] [US2] Create FollowUpAlerts component in src/components/dashboard/FollowUpAlerts.tsx
- [X] T014 [P] [US2] Create RecentActivityFeed component in src/components/dashboard/RecentActivityFeed.tsx
- [X] T015 [US2] Integrate Alerts and Activity components into DashboardClient in src/components/dashboard/DashboardClient.tsx

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Team Performance Section for Management Roles (Priority: P3)

**Goal**: Render per-rep performance table (assigned, completed follow-ups, calls logged, offers sent, contracts won) with period selection (week/month/quarter) for managers only.

**Independent Test**: Verify section does not render for Sales User and matches database queries per rep for supervisors.

### Tests for User Story 3

- [X] T016 [P] [US3] Add integration tests for team performance visibility and period boundaries in tests/integration/012-kpi-dashboard.test.ts

### Implementation for User Story 3

- [X] T017 [P] [US3] Implement getTeamPerformanceAction with week/month/quarter calculations in src/lib/actions/dashboard.ts
- [X] T018 [P] [US3] Create TeamPerformance component with period filter tabs/dropdown in src/components/dashboard/TeamPerformance.tsx
- [X] T019 [US3] Integrate TeamPerformance component conditionally in DashboardClient in src/components/dashboard/DashboardClient.tsx

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Fine-tuning layout, performance, and documentation.

- [X] T020 [P] Validate Arabic translations, RTL layouts, and responsive styling in src/components/dashboard/
- [X] T021 Run all tests using vitest in tests/integration/
- [X] T022 Document validation results and walkthrough in walkthrough.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **User Stories (Phase 3+)**: All depend on Foundational completion.
  - User Story 1 (P1) -> User Story 2 (P2) -> User Story 3 (P3).
- **Polish (Phase 6)**: Depends on all user stories completion.

### Parallel Opportunities

- All Setup tasks (T001, T002) can run in parallel.
- Integration test setup (T005, T011, T016) can be configured together.
- Components within a User Story (e.g. T007, T008; T013, T014; T017, T018) can be developed in parallel.
