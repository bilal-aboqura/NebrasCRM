# Tasks: User and Company Administration

**Input**: Design documents from `/specs/002-user-company-admin/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [X] T001 Create routes and directories in `src/app/` per the implementation plan
- [X] T002 [P] Initialize routing structure for `/admin/companies`, `/admin/users`, `/profile`, and `/invite` in `src/app/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migrations, status column configurations, and security middleware that must be complete before any user story can be implemented.

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create database migrations for schemas, status columns, lockout prevention, and audit triggers in `supabase/migrations/20260616000000_user_company_admin.sql`
- [X] T004 Update the seed file with new company status and user status fields in `supabase/seed.sql`
- [X] T005 [P] Implement status validation and global session revocation check in Next.js middleware in `src/app/middleware.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Company Directory and Management by Super Admin (Priority: P1) ðŸŽ¯ MVP

**Goal**: Super Admin can view, create, edit, and toggle company status.

**Independent Test**: Log in as a Super Admin. Navigate to `/admin/companies`. Create, edit, and deactivate a company, then verify that its users are blocked from logging in.

### Tests for User Story 1
- [X] T006 [P] [US1] Write pgTAP database tests for `companies` table RLS policies and company status updates in `supabase/tests/002-user-company-admin.test.sql`

### Implementation for User Story 1
- [X] T007 [US1] Implement Server Actions `createCompany` and `updateCompany` with Super Admin server-side validation in `src/lib/actions/admin.ts`
- [X] T008 [US1] Create the Arabic-first, RTL company management UI page in `src/app/(dashboard)/admin/companies/page.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Cross-Tenant User Directory and Creation by Super Admin (Priority: P1)

**Goal**: Super Admin can view, create, and manage users across all companies, including assigning the Super Admin role and lockout protection.

**Independent Test**: Log in as a Super Admin. Navigate to `/admin/users`. View users from all companies, invite a new Super Admin, and attempt to deactivate the last Super Admin to verify the lockout error.

### Tests for User Story 2
- [X] T009 [P] [US2] Write pgTAP database tests for `profiles` table RLS policies and lockout prevention trigger in `supabase/tests/002-user-company-admin.test.sql`

### Implementation for User Story 2
- [X] T010 [US2] Implement Server Actions `inviteUser` and `toggleUserStatus` for Super Admin scope with lockout prevention checks in `src/lib/actions/admin.ts`
- [X] T011 [US2] Create the Cross-Tenant User Directory UI for Super Admin in `src/app/(dashboard)/admin/users/page.tsx`

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Role-Scoped Tenant User Management by Company Admin (Priority: P1)

**Goal**: Company Admin can manage users strictly within their own company and cannot assign Super Admin.

**Independent Test**: Log in as Company Admin of Company A. Navigate to `/admin/users`. Verify Company B's users are invisible. Invite a Supervisor user to Company A. Attempt to access a Company B user's profile URL directly and verify 403.

### Tests for User Story 3
- [X] T012 [P] [US3] Write pgTAP database tests for Company Admin RLS boundaries (cannot read/write other company users) in `supabase/tests/002-user-company-admin.test.sql`

### Implementation for User Story 3
- [X] T013 [US3] Update Server Actions `inviteUser` and `toggleUserStatus` in `src/lib/actions/admin.ts` to enforce Company Admin role constraints and scopes.
- [X] T014 [US3] Update the User Directory UI in `src/app/(dashboard)/admin/users/page.tsx` to conditionally render in company-scoped view when logged in as a Company Admin.

**Checkpoint**: User Stories 1, 2, and 3 are functional.

---

## Phase 6: User Story 4 - Secure Password Set / Invitation Flow (Priority: P2)

**Goal**: Invitees set a minimum 12-character password with a breach check via a secure token.

**Independent Test**: Generate an invitation token. Navigate to `/invite?token=...`. Submit a breached or short password to verify errors, then submit a strong password to activate the account.

### Tests for User Story 4
- [X] T015 [P] [US4] Write integration tests for invitation token validation and password set logic in `tests/integration/invite.test.ts`

### Implementation for User Story 4
- [X] T016 [US4] Implement invitation token verification and the `completeInvitation` Server Action in `src/lib/actions/admin.ts`
- [X] T017 [US4] Create the `/invite` password creation page with RTL layout and breach-check validation in `src/app/(auth)/invite/page.tsx`

**Checkpoint**: User Stories 1-4 are functional.

---

## Phase 7: User Story 5 - Self-Service Profile & Password Update (Priority: P2)

**Goal**: Authenticated users can update their own display name and change their own password.

**Independent Test**: Log in as a Sales User. Navigate to `/profile`. Update display name, and change password. Verify login with the new password works.

### Tests for User Story 5
- [X] T018 [P] [US5] Write integration tests for display name updates and password changes in `tests/integration/profile.test.ts`

### Implementation for User Story 5
- [X] T019 [US5] Implement `updateProfileName` and `changePassword` Server Actions in `src/lib/actions/profile.ts`
- [X] T020 [US5] Create the `/profile` UI page for display name updates and password changes in `src/app/(dashboard)/profile/page.tsx`

**Checkpoint**: All user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [X] T021 [P] Write pgTAP database tests verifying audit log triggers capture detailed before/after diffs in `supabase/tests/002-user-company-admin.test.sql`
- [X] T022 Implement immediate session revocation server-side via the Supabase Admin API on password reset and user/company deactivations in `src/lib/actions/admin.ts`
- [X] T023 Verify the complete verification flow by running local Supabase migrations and executing all tests
- [X] T024 [P] Update project documentation and markdown references in `docs/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel or sequentially.
- **Polish (Final Phase)**: Depends on all user stories being complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently.

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 (MVP) -> Test -> Deploy
3. Add User Story 2 -> Test -> Deploy
4. Add User Story 3 -> Test -> Deploy
5. Add User Story 4 -> Test -> Deploy
6. Add User Story 5 -> Test -> Deploy
7. Complete Phase 8: Polish
