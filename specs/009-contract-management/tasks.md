# Tasks: Contract Management

**Input**: Design documents from `/specs/009-contract-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Database pgTAP tests for RLS isolation, sequence counter row-locking, active immutability, and private storage policies are mandatory. Vitest integration tests for Server Actions secure uploads and URL signature expirations are also included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Paths assume a unified repository structure where backend database configurations live in `supabase/` and frontend pages/logic live in `src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and folder structure setup

- [X] T001 Create page and folder structures under `src/app/(dashboard)/dashboard/contracts/`, `src/components/contracts/`, and `src/lib/secure-storage/` per implementation plan
- [X] T002 Configure size-limit and content-type validation parameters for contract file uploads in `src/config/storage.ts` or utility configs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database tables, triggers, secure storage configuration, and RLS policies that must be complete before any user story can be implemented

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Setup Supabase database migration file `supabase/migrations/20260617000009_contract_management.sql` defining custom enum `public.contract_status`, tables `contracts` and `contract_sequence_counters`, and RLS policies
- [X] T004 [P] Implement concurrency-safe reference ID generator trigger (`trg_generate_contract_reference_number`) in `supabase/migrations/20260617000009_contract_management.sql`
- [X] T005 [P] Implement active contract immutability and date validation trigger (`trg_validate_contract_rules_and_immutability`) in `supabase/migrations/20260617000009_contract_management.sql`
- [X] T006 [P] Configure storage bucket `contracts` and write storage RLS policies in `supabase/migrations/20260617000009_contract_management.sql` restricting file access by company tenant and contract visibility
- [X] T007 [P] Write pgTAP database unit tests `supabase/tests/009-contract-management.test.sql` to verify RLS, sequence counters, active immutability, and storage bucket RLS policies
- [ ] T008 Run `supabase db test` to verify database triggers, constraints, and storage RLS policies fail/pass as expected
- [X] T009 Create reusable helper module `src/lib/secure-storage.ts` for handling secure bucket uploads, permission checks, and signed URLs

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create Contract from Accepted Offer (Priority: P1) ðŸŽ¯ MVP

**Goal**: Allows users to create a draft contract from an accepted offer (pre-filling value and linked contacts), assigning a concurrency-safe unique reference number CON-YYYY-XXXX.

**Independent Test**: Log in as a Sales User of Company A, go to Facility A detail page, find an accepted offer, click "Create Contract". Verify that value, facility, and contacts pre-fill. Save, and check that the reference number CON-YYYY-XXXX is generated. Verify Company B users cannot access this contract.

### Tests for User Story 1
- [X] T010 [P] [US1] Write integration test in `tests/integration/contracts-us1.test.ts` to verify draft contract creation, pre-filling from accepted offers, and automatic unique reference number generation
- [X] T011 [P] [US1] Write test in `tests/integration/contracts-us1.test.ts` verifying that creating multiple contracts for the same accepted offer fails unique key constraints

### Implementation for User Story 1
- [X] T012 [US1] Define TypeScript interfaces for contracts, sequence counters, and Server Action inputs in `src/lib/actions/contracts.ts` matching contracts
- [X] T013 [US1] Implement Server Action `createContract` in `src/lib/actions/contracts.ts` to pre-fill contract details from accepted offers, perform duplicate validations, and log `contract_created` to the timeline
- [X] T014 [US1] Implement Server Action `updateDraftContract` in `src/lib/actions/contracts.ts` to edit draft contract details
- [X] T015 [P] [US1] Design client-side component `ContractEditorModal.tsx` in `src/components/contracts/ContractEditorModal.tsx` in Arabic RTL for creating and editing draft contracts (with file upload drag-and-drop)
- [X] T016 [US1] Integrate `ContractEditorModal` into the Contracts section of the Facility Detail page `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Contract Activation and Facility Stage Sync (Priority: P1)

**Goal**: Activates a draft contract requiring signed document upload, prompts the user to transition the facility stage, and locks active contract pricing (immutability).

**Independent Test**: On a draft contract, upload a PDF, fill dates, and click "Activate". Verify status changes to active and the UI prompts to transition the facility to "Contract" (Feature 005 logic). Confirm and check that core contract fields are now read-only.

### Tests for User Story 2
- [X] T017 [P] [US2] Write integration test in `tests/integration/contracts-us2.test.ts` to verify that active contracts are immutable, and any direct edit to value or dates returns a validation error
- [X] T018 [P] [US2] Write integration test in `tests/integration/contracts-us2.test.ts` to verify that activating a contract requires a document path and valid date boundaries

### Implementation for User Story 2
- [X] T019 [US2] Implement Server Action `activateContract` in `src/lib/actions/contracts.ts` to update status to `'active'`, log `contract_activated` to the activity timeline, and save changes
- [X] T020 [P] [US2] Implement secure document upload logic `uploadContractDocument` in `src/lib/actions/contracts.ts` utilizing `src/lib/secure-storage.ts` to save signed contract files to the private bucket and write activity logs
- [X] T021 [US2] Add the **Activate Contract** action to `ContractEditorModal.tsx` in `src/components/contracts/ContractEditorModal.tsx`, requiring start/end dates and the signed document file
- [X] T022 [US2] Integrate the callback on contract activation to prompt the user to advance the parent facility lifecycle stage to "Contract", reusing the Feature 005 terminal-stage confirmation behavior

**Checkpoint**: User Stories 1 AND 2 work together. Contracts can be securely uploaded, activated, and synced with pipeline stage.

---

## Phase 5: User Story 3 - Contract Lifecycle and Derived States (Priority: P2)

**Goal**: Allows managers to complete or terminate active contracts early, and dynamically calculates expiring warnings and expired states.

**Independent Test**: Log in as a Sales User; verify complete/terminate actions are hidden. Log in as a Supervisor; click "Early Termination", input date and reason. Verify status updates to terminated. Open an active contract expiring within 60 days; verify it displays as "Expiring Soon".

### Tests for User Story 3
- [X] T023 [P] [US3] Write integration test in `tests/integration/contracts-us3.test.ts` to verify that complete and terminate actions succeed for managers but fail with 403 Forbidden for Sales Users

### Implementation for User Story 3
- [X] T024 [US3] Implement Server Action `completeContract` in `src/lib/actions/contracts.ts` (restricted to managers) to mark active contracts completed
- [X] T025 [US3] Implement Server Action `terminateContract` in `src/lib/actions/contracts.ts` (restricted to managers) to terminate active contracts with a date and reason notes
- [X] T026 [P] [US3] Design `TerminateContractModal.tsx` in `src/components/contracts/TerminateContractModal.tsx` in Arabic RTL for managers to input early termination details
- [X] T027 [US3] Add complete and terminate actions to the contract UI view, restricted to users with `Supervisor`, `Company Admin`, or `Super Admin` roles
- [X] T028 [US3] Implement dynamic warnings calculation in Server Actions, flagging active contracts past their end date as "Expired" and within the company's threshold as "Expiring Soon" in Riyadh timezone

**Checkpoint**: Contract status transitions are secure and derived warnings are live.

---

## Phase 6: User Story 4 - Contracts Directories and Scoped Access (Priority: P1)

**Goal**: Provides a global contracts directory filterable by status and owner with total values, scoped to role permissions and tenant isolation.

**Independent Test**: Navigate to the global contracts view. Verify Sales User A only sees contracts of assigned facilities. Filter by "Active" and check that totals sum up. Verify contracts of soft-archived facilities are excluded.

### Tests for User Story 4
- [X] T029 [P] [US4] Write integration test in `tests/integration/contracts-us4.test.ts` verifying that Sales Users cannot query contracts of unassigned facilities, and Company A users are blocked from querying Company B contracts

### Implementation for User Story 4
- [X] T030 [US4] Implement the Global Contracts page at `src/app/(dashboard)/dashboard/contracts/page.tsx` querying scoped contracts
- [X] T031 [P] [US4] Implement filter controls (status and owner dropdowns) and totals summary calculation on `src/app/(dashboard)/dashboard/contracts/page.tsx`
- [X] T032 [US4] Design `ContractsSection.tsx` in `src/components/facilities/ContractsSection.tsx` to list a facility's contracts and version addenda chains in descending order, automatically hiding contracts of soft-archived facilities

**Checkpoint**: Scoped directories are active, filterable, and isolated.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Addendum chains, secure URL view generation, archival, and final checks

- [X] T033 Implement Server Action `createContractAddendum` in `src/lib/actions/contracts.ts` to support modifying active contract values via linked addendum version chains
- [X] T034 Implement Server Action `getSignedDocumentUrl` in `src/lib/actions/contracts.ts` to retrieve 15-minute signed URLs on-demand for contract document viewing and log the download
- [X] T035 Implement soft-archiving (`archiveContract`) and recovery (`recoverContract`) Server Actions in `src/lib/actions/contracts.ts` for the version chain, writing timeline activities
- [X] T036 Add translation keys in translation dictionaries for contract statuses, sequence logs, and early termination reasons
- [ ] T037 Verify that direct URLs to private storage files return 403 Access Denied unless accessed via Server Action signed URLs
- [ ] T038 Run quickstart.md validation steps to ensure all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. BLOCKS all user stories.
- **User Stories (Phases 3 to 6)**: Depend on Foundational completion.
  - User Story 1 (Create Drafts) is the MVP and must be completed first.
  - User Story 2 (Activation & Sync) depends on User Story 1.
  - User Story 3 (Lifecycle Transitions) depends on User Story 2.
  - User Story 4 (Directory & Scoped Access) can run in parallel after User Story 1.
- **Polish (Phase 7)**: Depends on all user stories being completed.

### Parallel Opportunities

- Within **Phase 2**: Triggers (`T004`, `T005`, `T006`) and pgTAP tests (`T007`) can be designed in parallel.
- Within **Phase 3**: Client component `ContractEditorModal.tsx` (`T015`) can be built in parallel with backend Server Actions (`T013`, `T014`).
- Once **Phase 2** completes:
  - Developer A can work on **Phase 3** (User Story 1 - MVP).
  - Developer B can start setting up **Phase 6** UI layout and filters (User Story 4 - Directory).

---

## Parallel Example: User Story 1

```bash
# Developer A implements database triggers and Server Actions:
Task: "Implement Server Action createContract in src/lib/actions/contracts.ts"
Task: "Implement Server Action updateDraftContract in src/lib/actions/contracts.ts"

# Developer B builds the form inputs and file upload drop-zone:
Task: "Design client-side component ContractEditorModal.tsx in src/components/contracts/ContractEditorModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup**.
2. Complete **Phase 2: Foundational** (Must pass pgTAP tests `T008`).
3. Complete **Phase 3: User Story 1** (Draft Contract creation from accepted offer).
4. **STOP and VALIDATE**: Test draft contract creation on a facility page. Verify reference number generation and tenant isolation.

### Incremental Delivery

1. Setup + Foundation ready.
2. Deploy User Story 1 (Create Drafts) -> MVP is live.
3. Deploy User Story 2 (Activation & PDF Upload) -> Reps can upload documents, activate contracts, and sync facility stages.
4. Deploy User Story 3 (Lifecycle Transitions) -> Managers can complete and terminate active contracts.
5. Deploy User Story 4 (Directory) -> Managers can view and filter all contracts.
