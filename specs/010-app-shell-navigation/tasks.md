# Tasks: App Shell Navigation & Routing Wires

**Input**: Design documents from `/specs/010-app-shell-navigation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify project environment and run dev server using `npm run dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Verify that current Next.js layout can import custom icons or Lucide components in `src/components/Sidebar.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Role-Aware Sidebar Navigation (Priority: P1) 🎯 MVP

**Goal**: Render a dynamic vertical navigation inside the sidebar in RTL format using the Tajawal typeface. Hide admin links based on roles and highlight active routes in gold.

**Independent Test**: Log in as sales_user, supervisor, and super_admin; verify sidebar links and active state styles.

### Tests for User Story 1
- [X] T003 [P] [US1] Create integration test for sidebar role-based visibility in `tests/integration/010-role-navigation.test.ts`

### Implementation for User Story 1
- [X] T004 [P] [US1] Create client component `src/components/SidebarNav.tsx` for client-side routing, active link state tracking with `usePathname`, and RTL Tailwind styling.
- [X] T005 [US1] Update server component `src/components/Sidebar.tsx` to get user role via `getUserRole()` and pass it to `SidebarNav.tsx`.

**Checkpoint**: Sidebar navigation is fully role-aware, highlighted, and testable independently.

---

## Phase 4: User Story 2 - Post-Login Destination Landing (Priority: P1)

**Goal**: Redirect user to the dashboard homepage `/` displaying stats cards upon login instead of the empty welcome shell.

**Independent Test**: Submit login credentials; confirm the landing URL is `/` and renders the stats cards dashboard layout.

### Tests for User Story 2
- [X] T006 [P] [US2] Create integration test for tenant/role scoping of counts in `tests/integration/010-dashboard-counts.test.ts`

### Implementation for User Story 2
- [X] T007 [US2] Update Next.js middleware redirect target in `src/app/middleware.ts` to ensure users landing on `/login` redirect to `/` if logged in.
- [X] T008 [US2] Implement live stats query logic and UI grid layout in `src/app/(dashboard)/page.tsx` using Supabase SSR client.

**Checkpoint**: Landing page is a real stats dashboard scoped by tenant and user role.

---

## Phase 5: User Story 3 - Facility List & Pipeline Navigation (Priority: P1)

**Goal**: Make facility detail page reachable by clicking row in Facilities List or card in Pipeline Kanban Board.

**Independent Test**: Click facility row or Kanban card; verify browser navigates to `/dashboard/facilities/[id]`.

### Implementation for User Story 3
- [X] T009 [P] [US3] Update table row or name click handler in `src/app/(dashboard)/dashboard/facilities/FacilitiesClient.tsx` to route to `/dashboard/facilities/[id]`.
- [X] T010 [P] [US3] Update `src/components/pipeline/KanbanCard.tsx` to make the pipeline card clickable (excluding action buttons) navigating to `/dashboard/facilities/${card.id}`.

**Checkpoint**: Clicking rows and cards opens facility detail view.

---

## Phase 6: User Story 4 - App Shell Header Context (Priority: P2)

**Goal**: Display active company name, user metadata, logout button, and the company switcher (for Super Admin only).

**Independent Test**: Verify active company name changes with switcher, profile role badges, and logout form redirects.

### Implementation for User Story 4
- [X] T011 [US4] Update header layout and data fetching in `src/components/Header.tsx` to display company logo mark, active company name, user display name, and role badge.
- [X] T012 [US4] Integrate `CompanySwitcher` inside `src/components/Header.tsx` only when user has `super_admin` role.

**Checkpoint**: Header displays complete user context and switching capabilities.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Code quality, performance, and final testing verification.

- [X] T013 Run all integration tests using `npm run test` to verify no regressions.
- [X] T014 Review RTL layouts and Tajawal typography in desktop and mobile viewport sizes.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Stories (Phases 3-6)**: Depend on Phase 2 completion.
  - Phase 3, 4, 5, 6 can be developed in parallel or sequentially.
- **Polish (Phase 7)**: Depends on all user stories completion.

### Parallel Opportunities
- T003 (US1 Test) and T004 (US1 SidebarNav component) can run in parallel.
- T009 (US3 FacilitiesClient click) and T010 (US3 KanbanCard click) can run in parallel.
- T006 (US2 Test) and T007/T008 (US2 implementation) can run in parallel.
