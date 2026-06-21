# Tasks: Foundational Access Layer (Authentication & Tenant Isolation)

**Input**: Design documents from `/specs/001-auth-tenant-isolation/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/auth-api.md

**Tests**: Tenant-isolation and authorization tests are MANDATORY per the testing rules in Principle VI of the Constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are explicitly mentioned in descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initial project layout, local Supabase CLI orchestration, and configuration of Tailwind brand tokens.

- [X] T001 Create source directories (`src/app`, `src/components`, `src/lib/supabase`, `src/styles`) per plan structure
- [X] T002 Initialize local Supabase development environment via `supabase init`
- [X] T003 Configure environment variables in `.env.local`
- [X] T004 [P] Configure brand design tokens (deep green, gold, cream) and Tajawal typography in `tailwind.config.ts`
- [X] T005 [P] Setup base CSS logical rules for RTL default layout in `src/styles/globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, initial test suite harness, and auth hook claim injection that must be completed before user stories.

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Create the initial database schema migration in `supabase/migrations/20260616000000_init_auth_schema.sql` (companies, profiles, login_attempts, audit_logs)
- [X] T007 Create the profiles table trigger in `supabase/migrations/20260616000000_init_auth_schema.sql` (sync from auth.users on insert)
- [X] T008 Implement the custom JWT claims hook in `supabase/migrations/20260616000000_init_auth_schema.sql` to cache company_id and role
- [X] T009 Add pre-seeded tenant data and test role accounts in `supabase/seed.sql`
- [X] T010 Create base database pgTAP configuration tests in `supabase/tests/rls_helpers_test.sql`

**Checkpoint**: Foundation ready - database tables are created, seeded, and local Supabase instance is operational.

---

## Phase 3: User Story 1 - Secure Arabic Login & Scoped Dashboard (Priority: P1) ðŸŽ¯ MVP

**Goal**: Authenticate users via email/password and redirect them to a dashboard displaying their company name.

**Independent Test**: Log in with Company A credentials and verify the landing page renders "Ù†Ø¨Ø±Ø§Ø³ Ø§Ù„Ø¬ÙˆØ¯Ø©" as the active tenant.

### Tests for User Story 1 (MANDATORY) âš ï¸

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [X] T011 [P] [US1] Create integration test in `tests/integration/auth_flow.test.ts` to assert login redirects on success and alerts on failure

### Implementation for User Story 1

- [X] T012 [P] [US1] Create server-side and client-side Supabase client factories in `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` using `@supabase/ssr`
- [X] T013 [P] [US1] Implement Next.js Middleware in `src/app/middleware.ts` to refresh session cookies and intercept protected routes
- [X] T014 [US1] Implement the login action in `src/lib/auth/login-action.ts` utilizing Supabase Auth
- [X] T015 [US1] Build the Arabic, RTL login page UI in `src/app/(auth)/login/page.tsx` using Tailwind design tokens
- [X] T016 [US1] Create the scoped dashboard landing page in `src/app/(dashboard)/page.tsx` displaying authenticated user context

**Checkpoint**: User Story 1 is fully functional. Users can log in and view a dashboard scoped to their company.

---

## Phase 4: User Story 2 - Strict Tenant Data Isolation (Priority: P1) ðŸŽ¯ MVP

**Goal**: Establish Row Level Security (RLS) policies preventing cross-tenant data leakage.

**Independent Test**: Querying the database or loading a page as a Company A user returns zero records belonging to Company B.

### Tests for User Story 2 (MANDATORY) âš ï¸

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [X] T017 [P] [US2] Create pgTAP RLS tests in `supabase/tests/rls_isolation_test.sql` to check data isolation policies
- [X] T018 [P] [US2] Create integration tests in `tests/integration/tenant_isolation.test.ts` to verify cross-tenant access attempts return 403 Forbidden

### Implementation for User Story 2

- [X] T019 [US2] Create SQL migration in `supabase/migrations/20260616000001_rls_policies.sql` to enable RLS and define select/modify policies for `companies` and `profiles`
- [X] T020 [US2] Implement data-access scoping helper utilities in `src/lib/auth/isolation-helpers.ts`

**Checkpoint**: User Story 2 is fully functional. RLS enforces tenant isolation on profiles and companies.

---

## Phase 5: User Story 3 - Role-Based Access Control and App Shell (Priority: P2)

**Goal**: Build a role-aware sidebar/header app shell layout, and enforce server-side RBAC.

**Independent Test**: Log in as a Sales User, verify admin options are hidden from the sidebar, and manual route access to admin paths is denied.

### Tests for User Story 3 (MANDATORY) âš ï¸

- [X] T021 [P] [US3] Create integration tests in `tests/integration/rbac.test.ts` validating path authorization for Supervisor, Company Admin, and Sales User roles

### Implementation for User Story 3

- [X] T022 [P] [US3] Create server-side role authorization guards and wrappers in `src/lib/auth/rbac-guards.ts`
- [X] T023 [US3] Build the dynamic sidebar navigation component in `src/components/Sidebar.tsx` (filtered by role)
- [X] T024 [US3] Build the dashboard header layout component in `src/components/Header.tsx` showing active company and user details
- [X] T025 [US3] Integrate components into the main authenticated layout shell in `src/app/(dashboard)/layout.tsx`

**Checkpoint**: App shell is complete with Arabic RTL menus, dynamic sidebar links, and active RBAC route protections.

---

## Phase 6: User Story 4 - Super Admin Multi-Tenant Company Switcher (Priority: P2)

**Goal**: Allow Super Admins to manually switch their operating tenant context on the fly.

**Independent Test**: Super Admin switches company to "ØªÙ‚Ù†ÙŠØ© Ø§Ù„Ø§Ø±ØªÙ‚Ø§Ø¡" and all dashboard views update to show "ØªÙ‚Ù†ÙŠØ© Ø§Ù„Ø§Ø±ØªÙ‚Ø§Ø¡" details.

### Tests for User Story 4 (MANDATORY) âš ï¸

- [X] T026 [P] [US4] Create integration tests in `tests/integration/super_admin_switcher.test.ts` to assert that switching active company cookie re-scopes database queries

### Implementation for User Story 4

- [X] T027 [US4] Implement Super Admin bypass rules in RLS database policies helper function in `supabase/migrations/20260616000000_init_auth_schema.sql`
- [X] T028 [US4] Create the switcher Server Action in `src/lib/auth/switch-company-action.ts` validating roles and setting the active company cookie
- [X] T029 [US4] Build the company switcher dropdown UI in `src/components/CompanySwitcher.tsx`

**Checkpoint**: Super Admins can successfully toggle the company switcher and view re-scoped tenant datasets.

---

## Phase 7: User Story 5 - Session Lifecycle (Logout & Forgot Password Gate) (Priority: P3)

**Goal**: Enable clean session logout and a placeholder route for password resets.

**Independent Test**: Clicking logout redirects the user to the login screen and clears the cookies.

### Tests for User Story 5 (MANDATORY) âš ï¸

- [X] T030 [P] [US5] Create integration tests in `tests/integration/session_lifecycle.test.ts` verifying cookie deletion and unauthenticated routing redirects

### Implementation for User Story 5

- [X] T031 [US5] Create the logout Server Action/endpoint in `src/lib/auth/logout-action.ts`
- [X] T032 [US5] Create the password recovery instruction template screen in `src/app/(auth)/reset/page.tsx`

**Checkpoint**: Complete session lifecycle is covered: login, role-based navigation, company context override, and secure logout.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Styling checks, responsive layout design system validation, and final test suite runs.

- [X] T033 Verify responsive layout breakpoints (`~1050px` and `~700px`) on `src/components/Sidebar.tsx` and `src/components/Header.tsx`
- [X] T034 Execute full local test suite runner command `npm test` and `supabase db test` to verify all passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - US1 & US2 (MVP) should be completed first to establish the secure scoped platform.
  - US3, US4, and US5 can be developed in parallel or sequence once US1 and US2 are complete.
- **Polish (Final Phase)**: Depends on all user story completions.

### Parallel Opportunities

- Configuration tasks in Phase 1 (`T004`, `T005`) can run in parallel.
- Test suites across different user stories (`T011`, `T017`, `T021`, `T026`, `T030`) can be drafted in parallel.
- App shell components (`T023`, `T024`) can be built in parallel.

---

## Parallel Example: User Story 1

```bash
# Setup both local client and middleware route interceptions in parallel:
Task: "Create server-side and client-side Supabase client factories in src/lib/supabase/server.ts and client-side factory in src/lib/supabase/client.ts"
Task: "Implement Next.js Middleware in src/app/middleware.ts to refresh session cookies and intercept protected routes"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundational database configurations (Phase 1 & 2).
2. Implement User Story 1 (Login & Scoped Dashboard).
3. Implement User Story 2 (Strict Tenant Data Isolation RLS).
4. **STOP and VALIDATE**: Run integration tests to prove that a Company A user cannot log in and fetch Company B data. This constitutes our core MVP.
5. Once validated, proceed with role guards (US3) and switcher controls (US4).
