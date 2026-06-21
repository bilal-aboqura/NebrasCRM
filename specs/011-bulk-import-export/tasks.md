# Tasks: Bulk Import & Export

**Input**: Design documents from `/specs/011-bulk-import-export/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Install `xlsx` dependency in package.json
- [X] T002 Create database migration script in supabase/migrations/20260620000000_bulk_import_export.sql
- [ ] T003 Apply database migration by executing supabase/migrations/20260620000000_bulk_import_export.sql

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create parser module in src/lib/import-export/parser.ts
- [X] T005 [P] Create generator module in src/lib/import-export/generator.ts
- [X] T006 [P] Create validator module in src/lib/import-export/validator.ts
- [X] T007 Setup mock/helper files for integration tests in tests/integration/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Download Import Template (Priority: P1) 🎯 MVP

**Goal**: Authorized users download a pre-formatted Arabic-labeled Excel template to match expected schema.

**Independent Test**: Log in as a Company Admin, navigate to facilities, click "Download Template" and verify `template.xlsx` downloads with RTL-oriented Arabic headers.

### Tests for User Story 1

- [X] T008 [US1] Write integration test for template download in tests/integration/import-template.test.ts

### Implementation for User Story 1

- [X] T009 [US1] Implement route handler in src/app/api/facilities/import/template/route.ts
- [X] T010 [US1] Add template download trigger button on facilities view in src/app/\(dashboard\)/dashboard/facilities/page.tsx

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Upload & Preview Import (Priority: P1)

**Goal**: Upload an Excel or CSV file and preview the parsed data, validation errors, and duplicates in Arabic.

**Independent Test**: Upload a test CSV containing a mix of valid, invalid, and duplicate rows. Verify summary stats count matches.

### Tests for User Story 2

- [X] T011 [US2] Write integration tests for preview validation and limits in tests/integration/import-preview.test.ts

### Implementation for User Story 2

- [X] T012 [US2] Implement preview route handler in src/app/api/facilities/import/preview/route.ts
- [X] T013 [US2] Create import modal component in src/app/\(dashboard\)/dashboard/facilities/components/ImportModal.tsx
- [X] T014 [US2] Integrate ImportModal trigger button on facilities list page in src/app/\(dashboard\)/dashboard/facilities/page.tsx

**Checkpoint**: User Stories 1 AND 2 work independently.

---

## Phase 5: User Story 3 - Confirm Import & Activity Logs (Priority: P1)

**Goal**: Commit previewed valid, non-duplicate rows to the database in a single transaction and log activities.

**Independent Test**: Click confirm, verify records are inserted with unassigned owner and status "new", and check that aggregate and timeline logs are created.

### Tests for User Story 3

- [X] T015 [US3] Write integration tests for confirm import transaction and logs in tests/integration/import-confirm.test.ts

### Implementation for User Story 3

- [X] T016 [US3] Implement confirmation route handler in src/app/api/facilities/import/confirm/route.ts
- [X] T017 [US3] Connect confirm button to confirm API in src/app/\(dashboard\)/dashboard/facilities/components/ImportModal.tsx

**Checkpoint**: Import flow is fully operational.

---

## Phase 6: User Story 4 - Export Filtered Facilities (Priority: P1)

**Goal**: Export filtered and scoped facilities list matching visibility to an Excel file.

**Independent Test**: Apply city/status filters, click export, open downloaded spreadsheet and verify rows match filters and only own company data is visible.

### Tests for User Story 4

- [X] T018 [US4] Write integration test for facilities export in tests/integration/export-facilities.test.ts

### Implementation for User Story 4

- [X] T019 [US4] Implement export route handler in src/app/api/facilities/export/route.ts
- [X] T020 [US4] Create reusable export button component in src/app/\(dashboard\)/dashboard/facilities/components/ExportButton.tsx
- [X] T021 [US4] Add ExportButton to facilities list page in src/app/\(dashboard\)/dashboard/facilities/page.tsx

**Checkpoint**: Facilities export is fully functional.

---

## Phase 7: User Story 5 - Export Follow-ups, Offers, and Contracts Lists (Priority: P2)

**Goal**: Export other CRM lists (followups, offers, contracts) using the same pattern.

**Independent Test**: Filter offers list, click export, verify downloaded file content matches and matches role permission scope.

### Tests for User Story 5

- [X] T022 [US5] Write integration tests for other exports in tests/integration/export-other.test.ts

### Implementation for User Story 5

- [X] T023 [US5] Implement export route handler in src/app/api/followups/export/route.ts
- [X] T024 [US5] Implement export route handler in src/app/api/offers/export/route.ts
- [X] T025 [US5] Implement export route handler in src/app/api/contracts/export/route.ts
- [X] T026 [US5] Integrate ExportButton on follow-ups, offers, and contracts pages in src/app/\(dashboard\)/dashboard/followups/page.tsx, src/app/\(dashboard\)/dashboard/offers/page.tsx, and src/app/\(dashboard\)/dashboard/contracts/page.tsx

**Checkpoint**: All exports are fully functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, documentation, and final validation.

- [X] T027 [P] Create documentation in docs/import-export.md
- [ ] T028 Validate all quickstart procedures in specs/011-bulk-import-export/quickstart.md and run test suite with npm test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phases 3 to 7)**: All depend on Foundational completion.
  - US1 (Phase 3) is a prerequisite for US2/US3 (import UI relies on template being available).
  - US2 (Phase 4) is a prerequisite for US3 (Phase 5).
  - US4 (Phase 6) and US5 (Phase 7) can run in parallel with US1-US3 once Foundation is complete.
- **Polish (Phase 8)**: Depends on all implementation tasks being complete.

### Parallel Opportunities

- Foundational modules T004, T005, and T006 can be built in parallel.
- Integration tests and API endpoint development within each user story can run in parallel.
- US4 (Facilities Export) can run in parallel with the Import user stories.

---

## Parallel Example: Foundational Modules

```bash
# Developer A builds parser:
Task: "T004 [P] Create parser module in src/lib/import-export/parser.ts"

# Developer B builds generator:
Task: "T005 [P] Create generator module in src/lib/import-export/generator.ts"

# Developer C builds validator:
Task: "T006 [P] Create validator module in src/lib/import-export/validator.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)
1. Complete Setup and Foundational blocks.
2. Complete US1 (Template download), US2 (File upload + preview), and US3 (Confirm bulk import).
3. Validate import functionality and activity logging.

### Incremental Delivery
1. Release Import Flow (MVP).
2. Release Facility Export (US4).
3. Release Followups, Offers, and Contracts Exports (US5).
