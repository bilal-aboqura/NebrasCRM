# Tasks: Public Lead Capture Form

**Input**: Design documents from `/specs/015-public-lead-capture/`
**Prerequisites**: [plan.md](file:///f:/CodingProjects/NebrasCRM/specs/015-public-lead-capture/plan.md) (required), [spec.md](file:///f:/CodingProjects/NebrasCRM/specs/015-public-lead-capture/spec.md) (required for user stories), [research.md](file:///f:/CodingProjects/NebrasCRM/specs/015-public-lead-capture/research.md), [data-model.md](file:///f:/CodingProjects/NebrasCRM/specs/015-public-lead-capture/data-model.md), [contracts/submission.md](file:///f:/CodingProjects/NebrasCRM/specs/015-public-lead-capture/contracts/submission.md)

**Tests**: This feature introduces a public, unauthenticated write endpoint that bypasses CRM auth constraints. Automated tests are critical to ensure that data isolation (writes are strictly scoped to the default company), input validation/sanitization, rate-limiting, and duplication rules function correctly.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initial local configuration

- [ ] T001 Configure default target company ID `DEFAULT_LEAD_COMPANY_ID=company-a` in local environment file [.env.local](file:///f:/CodingProjects/NebrasCRM/.env.local)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure setup (MUST be complete before starting user stories)

- [ ] T002 Create client IP rate limiter utility in [src/lib/rate-limit/memory.ts](file:///f:/CodingProjects/NebrasCRM/src/lib/rate-limit/memory.ts)
- [ ] T003 [P] Add `lead_source` optional field to the `Facility` type declaration in [src/lib/types/domain.ts](file:///f:/CodingProjects/NebrasCRM/src/lib/types/domain.ts)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Public Lead Request Submission (Priority: P1) 🎯 MVP

**Goal**: Implement the basic submission action and landing page form component allowing successful new lead registration in the CRM.

**Independent Test**: Load the form, fill in valid details, submit, and verify that the facility is created in the target company's CRM database with `lead_source = website_form` and an activity timeline log.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [ ] T004 [P] [US1] Create integration test file [tests/integration/015-public-lead-capture.test.ts](file:///f:/CodingProjects/NebrasCRM/tests/integration/015-public-lead-capture.test.ts) with test cases verifying successful public lead submission, record fields, activity timeline logging, and unauthenticated access.

### Implementation for User Story 1

- [ ] T005 [US1] Implement lead capture Server Action `submitLeadAction` in [src/lib/actions/lead-capture.ts](file:///f:/CodingProjects/NebrasCRM/src/lib/actions/lead-capture.ts) with input sanitization, phone normalization, and record insertion into `db.facilities` (defaulting status to `new`, owner to `null`, and company to `DEFAULT_LEAD_COMPANY_ID`).
- [ ] T006 [P] [US1] Create React form component [src/components/public/LeadCaptureForm.tsx](file:///f:/CodingProjects/NebrasCRM/src/components/public/LeadCaptureForm.tsx) rendering fields for name, type, phone, and city in Arabic (RTL, Tajawal) with loading states and client-side validation.
- [ ] T007 [US1] Embed the LeadCaptureForm component in the public landing page layout [src/app/(public)/page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx) in place of the Feature 013/014 placeholder.

**Checkpoint**: User Story 1 MVP is fully functional and testable at the root URL.

---

## Phase 4: User Story 2 - Duplicate Lead Submission Handling (Priority: P1)

**Goal**: Prevent duplicate records for active facilities using the same phone, and reactivate/restore archived facilities that re-submit.

**Independent Test**: Submit a lead with an existing active phone (verify duplicate message, no new record). Submit a lead with an existing archived phone (verify unarchived, status reset, updated details, new activity timeline log).

### Tests for User Story 2

- [ ] T008 [P] [US2] Add duplicate integration tests in [tests/integration/015-public-lead-capture.test.ts](file:///f:/CodingProjects/NebrasCRM/tests/integration/015-public-lead-capture.test.ts) to assert active duplicate blocking and archived reactivation.

### Implementation for User Story 2

- [ ] T009 [US2] Update `submitLeadAction` in [src/lib/actions/lead-capture.ts](file:///f:/CodingProjects/NebrasCRM/src/lib/actions/lead-capture.ts) to query all facilities for primary phone match:
  - If active: block write and return duplicate flag.
  - If archived: restore record (`isArchived = false`), reset status to `new`, reset owner to `null`, update name/type, append city to notes, and log `facility_recovered` activity.
- [ ] T010 [US2] Update [src/components/public/LeadCaptureForm.tsx](file:///f:/CodingProjects/NebrasCRM/src/components/public/LeadCaptureForm.tsx) to handle the duplicate response, replacing the form in-place with an amber warning card.

**Checkpoint**: User Stories 1 and 2 work seamlessly together, protecting the DB from duplicates.

---

## Phase 5: User Story 3 - Submission Rate Limiting and Abuse Prevention (Priority: P2)

**Goal**: Enforce a maximum of 5 submissions per IP per hour.

**Independent Test**: Perform 6 submissions from the same IP; verify the 6th is throttled and returns the 429 error.

### Tests for User Story 3

- [ ] T011 [P] [US3] Add rate-limiting test cases in [tests/integration/015-public-lead-capture.test.ts](file:///f:/CodingProjects/NebrasCRM/tests/integration/015-public-lead-capture.test.ts).

### Implementation for User Story 3

- [ ] T012 [US3] Integrate IP rate limit validation check in [src/lib/actions/lead-capture.ts](file:///f:/CodingProjects/NebrasCRM/src/lib/actions/lead-capture.ts) leveraging the IP tracking Map.
- [ ] T013 [US3] Add rate-limit banner alert display above the form inputs in [src/components/public/LeadCaptureForm.tsx](file:///f:/CodingProjects/NebrasCRM/src/components/public/LeadCaptureForm.tsx).

**Checkpoint**: The endpoint is secured against flooding and API spam.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final production quality steps and metrics integration

- [ ] T014 [P] Trigger GTM dataLayer event `lead_form_submitted` on successful non-duplicate submissions in [src/components/public/LeadCaptureForm.tsx](file:///f:/CodingProjects/NebrasCRM/src/components/public/LeadCaptureForm.tsx)
- [ ] T015 Run Next.js production build (`npm run build`) to ensure all compilation paths pass
- [ ] T016 Run and verify all integration tests pass successfully using `npm run test`
- [ ] T017 Complete all manual verification checklist items outlined in [quickstart.md](file:///f:/CodingProjects/NebrasCRM/specs/015-public-lead-capture/quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks User Stories.
- **User Stories (Phases 3-5)**: Depend on Foundational completion.
  - Implement sequentially (US1 → US2 → US3) or in parallel.
- **Polish (Phase 6)**: Depends on all user stories being complete.

---

## Parallel Example: User Story 1

```bash
# Launch test creation and layout form creation in parallel:
Task: "Create integration test file tests/integration/015-public-lead-capture.test.ts"
Task: "Create React form component src/components/public/LeadCaptureForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1).
3. Verify new lead capture works end-to-end.

### Incremental Delivery
1. Add User Story 2 (Duplicate handling) and verify archived unarchiving.
2. Add User Story 3 (IP rate limiting) and verify endpoint lockdown.
3. Apply GTM analytics and run the full test suite.
