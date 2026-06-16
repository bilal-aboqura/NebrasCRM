# Tasks: Contact Management

**Input**: Design documents from `/specs/004-contact-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/contact-actions.md

**Tests**: Tenant isolation and authorization tests are MANDATORY per Principle VI of the Constitution. Database level tests use pgTAP, and application level integration tests use Vitest/Playwright.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic directory setup

- [ ] T001 Create directories for contacts components and server actions in `src/components/facilities` and `src/lib/actions`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database tables, indexes, RLS policies, and basic server action stub

**⚠️ CRITICAL**: No user story work can begin until this phase is complete and database checks pass.

- [ ] T002 Create Supabase database migration for contacts table, indexes, and triggers in `supabase/migrations/20260616000002_contact_management.sql`
- [ ] T003 [P] Create pgTAP unit tests for contacts RLS and index constraints in `supabase/tests/004-contact-management.test.sql`

**Checkpoint**: Foundation ready - database tables, indexes, and RLS policies are applied and verified.

---

## Phase 3: User Story 1 - Add Contact to Facility (Priority: P1) 🎯 MVP

**Goal**: Create contacts with tenant-scoped validation, inherited permission guards, and timeline logging.

**Independent Test**:
Log in as a Sales User of Company A. Open an assigned facility. Add a contact and save. Verify the contact inherits Company A's company_id and a creation log appears on the facility activity timeline.

### Tests for User Story 1
- [ ] T004 [P] [US1] Create integration tests verifying contact creation and tenant isolation in `tests/integration/contacts.test.ts`

### Implementation for User Story 1
- [ ] T005 [US1] Implement `createContact` Server Action with tenant-scoping, validation, and activity log inserts in `src/lib/actions/contacts.ts`
- [ ] T006 [P] [US1] Create `ContactForm` component for contact creation in `src/components/facilities/ContactForm.tsx`
- [ ] T007 [US1] Integrate contact creation modal triggering on the facility detail page in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Highlight & Manage Primary Contact (Priority: P1)

**Goal**: Atomic transaction when setting a new primary contact and visual highlighting of the primary contact in the list.

**Independent Test**:
Set contact B as primary on a facility that already has primary contact A. Verify contact A is automatically unmarked, contact B is highlighted, and the event is recorded on the timeline.

### Tests for User Story 2
- [ ] T008 [P] [US2] Write database pgTAP unit tests validating that at most one contact is primary in `supabase/tests/004-contact-management.test.sql`
- [ ] T009 [P] [US2] Create integration tests validating atomic primary contact swap in `tests/integration/contacts.test.ts`

### Implementation for User Story 2
- [ ] T010 [US2] Update `createContact` and implement `updateContact` Server Action logic to support atomic primary contact swaps in `src/lib/actions/contacts.ts`
- [ ] T011 [US2] Create `ContactsSection` component to display active contacts and highlight the primary contact in `src/components/facilities/ContactsSection.tsx`
- [ ] T012 [US2] Render `ContactsSection` on the facility detail page in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx`

**Checkpoint**: User Stories 1 and 2 are fully functional and work together.

---

## Phase 5: User Story 3 - Edit Contact Details (Priority: P1)

**Goal**: Edit contact details on assigned facilities and block unauthorized edits.

**Independent Test**:
Click Edit on an assigned contact, modify their job title, save, and verify that the changes appear on the detail page and timeline.

### Tests for User Story 3
- [ ] T013 [P] [US3] Create integration tests validating contact edit authorization and timeline logging in `tests/integration/contacts.test.ts`

### Implementation for User Story 3
- [ ] T014 [US3] Update `updateContact` Server Action in `src/lib/actions/contacts.ts` to log contact edit events to the facility timeline.
- [ ] T015 [US3] Update `ContactForm` component to support edit mode with prefilled values in `src/components/facilities/ContactForm.tsx`
- [ ] T016 [US3] Integrate the contact edit form trigger inside the contact list in `src/components/facilities/ContactsSection.tsx`

**Checkpoint**: All P1 user stories (creation, editing, listing, primary highlighting) are functional.

---

## Phase 6: User Story 4 - Archive & Recover Contacts (Priority: P2)

**Goal**: Soft-delete contacts, hide archived contacts by default, allow management recovery, and clear primary flag atomically on archival.

**Independent Test**:
Archive the primary contact. Verify that it disappears from default views, their primary status is cleared, and it is logged. Log in as Supervisor, check the Show Archived toggle, click Recover, and verify it returns as a normal active contact.

### Tests for User Story 4
- [ ] T017 [P] [US4] Create integration tests verifying archival (setting `is_active` false and clearing `is_primary`) and management-only recovery in `tests/integration/contacts.test.ts`

### Implementation for User Story 4
- [ ] T018 [US4] Implement `archiveContact` and `recoverContact` Server Actions in `src/lib/actions/contacts.ts` with atomic primary clearing and role checks.
- [ ] T019 [US4] Create `ArchivedContactsModal` component to display archived contacts for management in `src/components/facilities/ArchivedContactsModal.tsx`
- [ ] T020 [US4] Update `ContactsSection` to render the Show Archived toggle and open `ArchivedContactsModal` for management roles in `src/components/facilities/ContactsSection.tsx`

**Checkpoint**: Archiving and recovery are fully functional and restricted.

---

## Phase 7: User Story 5 - Communication Affordances (Priority: P2)

**Goal**: Phone call and WhatsApp links with E.164 normalization and prefilled templates.

**Independent Test**:
Click WhatsApp on a contact card. Verify it redirects to `https://wa.me/966...` with the active company's name and message template URL-encoded.

### Tests for User Story 5
- [ ] T021 [P] [US5] Create integration tests verifying phone normalization and WhatsApp link construction in `tests/integration/contacts.test.ts`

### Implementation for User Story 5
- [ ] T022 [US5] Implement phone normalization and WhatsApp template resolver utility integrations inside the contact UI in `src/components/facilities/ContactsSection.tsx`

**Checkpoint**: All user stories are complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, linting, and manual testing

- [ ] T023 Run database tests to verify contacts RLS and constraints: `supabase db test`
- [ ] T024 Run all integration tests: `npm run test:integration`
- [ ] T025 Perform final layout validation, checking RTL styling, Tajawal font weights, and responsive break points in `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx`
- [ ] T026 Validate all steps in `quickstart.md` function as written

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phases 3 to 7)**: All depend on Foundational phase completion.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories.
- **User Story 2 (P1)**: Depends on User Story 1 (requires list and details page setup).
- **User Story 3 (P1)**: Depends on User Story 2 (needs contact list component).
- **User Story 4 (P2)**: Depends on User Story 3.
- **User Story 5 (P2)**: Depends on User Story 3.

### Parallel Opportunities

- All Setup tasks marked `[P]` can run in parallel.
- All Foundational tasks marked `[P]` can run in parallel (T003).
- Once Foundational phase is complete:
  - Developer A can work on User Story 1 (T004-T007).
  - Developer B can start setting up integration tests for later stories.
- Within stories, test files (`[P]`) can be written in parallel with the stubs.

---

## Parallel Example: User Story 1

```bash
# Launch integration test file and form component in parallel:
Task: "Create integration tests verifying contact creation and tenant isolation in tests/integration/contacts.test.ts"
Task: "Create ContactForm component for contact creation in src/components/facilities/ContactForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1 (Add Contact).
4. Complete Phase 4: User Story 2 (List & Highlight Primary Contact).
5. **STOP and VALIDATE**: Verify contact addition, tenant isolation, and primary contact highlights.
6. Progress to remaining stories.
