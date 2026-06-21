# Tasks: Offer (Quote) Management

**Input**: Design documents from `/specs/008-offer-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Database pgTAP tests for Row Level Security (RLS) tenant isolation and versioning constraints are mandatory. Vitest integration tests for Server Actions calculations and version chain updates are also included.

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

- [ ] T001 Create page and folder structures under `src/app/(dashboard)/dashboard/offers/` and `src/components/offers/` per implementation plan
- [ ] T002 Configure tailwind print utilities and local timezone imports in `src/app/globals.css` or layout files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database tables, triggers, and RLS policies that must be complete before any user story can be implemented

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Setup Supabase database migration file `supabase/migrations/20260617000008_offer_management.sql` defining custom enums (`public.offer_status`, `public.discount_type`), table schemas for `offers` and `offer_line_items`, and unique version constraint
- [ ] T004 [P] Implement subtotal synchronization trigger (`trg_update_offer_subtotal`) in `supabase/migrations/20260617000008_offer_management.sql`
- [ ] T005 [P] Implement server-side totals calculation trigger (`trg_calculate_offer_totals`) in `supabase/migrations/20260617000008_offer_management.sql`
- [ ] T006 [P] Implement contact lookup and immutability validation trigger (`trg_validate_offer_and_immutability`) in `supabase/migrations/20260617000008_offer_management.sql`
- [ ] T007 [P] Enable Row Level Security (RLS) policies on `offers` and `offer_line_items` in `supabase/migrations/20260617000008_offer_management.sql` for tenant isolation and visibility inheritance
- [ ] T008 [P] Write pgTAP database unit tests `supabase/tests/008-offer-management.test.sql` to verify tenant isolation, RLS visibility, server-side math calculations, and immutability constraints
- [ ] T009 Run `supabase db test` to verify database triggers and RLS policies fail/pass as expected

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and Edit Draft Offer (Priority: P1) ðŸŽ¯ MVP

**Goal**: Allows users to create a draft quote for a facility with line items, discounts, and custom tax rates, with all values calculated server-side.

**Independent Test**: Log in as a Sales User of Company A, go to Facility A detail page, click "Create Offer", add line items and discounts, save, and verify that totals are server-computed and matches SAR formats. Verify Company B users cannot access it.

### Tests for User Story 1
- [ ] T010 [P] [US1] Write integration test in `tests/integration/offers-us1.test.ts` to verify draft offer creation, line items insertion, and server-side calculation of totals (subtotal, tax, discount, grand total)
- [ ] T011 [P] [US1] Write test in `tests/integration/offers-us1.test.ts` verifying that discount exceeding subtotal throws a validation error

### Implementation for User Story 1
- [ ] T012 [US1] Define Typescript interfaces for offers, line items, and server action inputs in `src/lib/actions/offers.ts` matching contracts
- [ ] T013 [US1] Implement Server Action `createOffer` in `src/lib/actions/offers.ts` to insert draft offers and line items, logging the activity to `facility_activity`
- [ ] T014 [US1] Implement Server Action `updateDraftOffer` in `src/lib/actions/offers.ts` to update draft details and line items, recalculating totals
- [ ] T015 [P] [US1] Design the client-side component `OfferEditorModal.tsx` in `src/components/offers/OfferEditorModal.tsx` in Arabic RTL layout supporting additions/removals of line items, discount toggles, and tax-exempt option
- [ ] T016 [US1] Integrate `OfferEditorModal` into the Offers tab on the Facility Detail page `src/app/(dashboard)/dashboard/facilities/[id]/page.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Send Offer and Export (Priority: P1)

**Goal**: Marks an offer as sent, freezing its contents (immutability), and provides an Arabic RTL print-optimized route for manual sharing.

**Independent Test**: View a draft offer, click "Send Offer". Verify that the UI makes all inputs read-only. Navigate to the print route and verify browser print (Ctrl+P) displays a clean PDF layout without navigation bar.

### Tests for User Story 2
- [ ] T017 [P] [US2] Write integration test in `tests/integration/offers-us2.test.ts` to verify that after marking an offer as sent, any further update request to its pricing or details throws a validation error

### Implementation for User Story 2
- [ ] T018 [US2] Implement Server Action `sendOffer` in `src/lib/actions/offers.ts` to update status to `'sent'`, record `sent_at`, and log the event in `facility_activity`
- [ ] T019 [US2] Implement the printable page route `/dashboard/offers/[offerId]/print` in `src/app/(dashboard)/dashboard/offers/[offerId]/print/page.tsx` retrieving the offer details in a clean RTL layout
- [ ] T020 [P] [US2] Add print-specific CSS rules in `src/app/globals.css` using `@media print` to hide navigation sidebars and headers, and setting A4 margins
- [ ] T021 [US2] Add **Send Offer** button to the editor UI and enable read-only view state for sent offers

**Checkpoint**: User Story 1 AND 2 work together. Sent offers are immutable and print-ready.

---

## Phase 5: User Story 3 - Revise Sent Offer (Priority: P2)

**Goal**: Allows reps to create new revisions of sent offers, maintaining version chains and marking predecessors as superseded.

**Independent Test**: Open a sent offer, click "Revise/Edit". Verify a new draft (v2) is created copying details, the original is marked superseded, and the version list displays them in a chain.

### Tests for User Story 3
- [ ] T022 [P] [US3] Write integration test in `tests/integration/offers-us3.test.ts` to verify that revising an offer increments the version, links the `parent_offer_id`, and sets predecessor `is_superseded = true`

### Implementation for User Story 3
- [ ] T023 [US3] Implement Server Action `createOfferRevision` in `src/lib/actions/offers.ts` to generate a new draft revision, copy line items, increment `version`, set `parent_offer_id`, set predecessor `is_superseded = true`, and log the event
- [ ] T024 [US3] Design revision rendering in `OffersSection.tsx` at `src/components/facilities/OffersSection.tsx` grouping offers by root chain and showing version numbers ("Ù†Ø³Ø®Ø© N")
- [ ] T025 [US3] Add the **Revise/Edit** button on sent offers in the UI, invoking the revision action and redirecting to the editor

**Checkpoint**: Versioning chains are functional. Concurrent edits fail version integrity checks.

---

## Phase 6: User Story 4 - Record Client Decision (Priority: P1)

**Goal**: Captures the customer's decision (Accept/Reject) on sent offers and prompts the user to advance the facility's lifecycle stage upon acceptance.

**Independent Test**: Open a sent offer, click "Accept Offer". Verify that a dialog box pops up to confirm advancing the facility stage (reusing Feature 005 logic), and the acceptance is logged in the activity timeline.

### Tests for User Story 4
- [ ] T026 [P] [US4] Write integration test in `tests/integration/offers-us4.test.ts` to verify recording decisions updates offer status, logs events with values, and blocks editing of metadata

### Implementation for User Story 4
- [ ] T027 [US4] Implement Server Action `recordOfferDecision` in `src/lib/actions/offers.ts` to update status, record timestamps/notes, and log the event in `facility_activity`
- [ ] T028 [P] [US4] Design the client-side component `RecordDecisionModal.tsx` in `src/components/offers/RecordDecisionModal.tsx` in Arabic RTL for selecting decisions and inputs
- [ ] T029 [US4] Update client-side callback to trigger the Feature 005 terminal-stage status prompt on offer acceptance

**Checkpoint**: Decided offers are closed, and acceptance guides facility stage advancement.

---

## Phase 7: User Story 5 - Dedicated Offers Directory and Scoped Access (Priority: P1)

**Goal**: Provides a global Offers tab filterable by status and owner (for managers) with total values, scoped to the current user's role and company isolation.

**Independent Test**: Navigate to "Ø§Ù„Ø¹Ø±ÙˆØ¶". Verify Sales User A only sees active offers of assigned facilities, while Supervisor A sees all. Filter by "Draft" and verify total sum updates.

### Tests for User Story 5
- [ ] T030 [P] [US5] Write integration test in `tests/integration/offers-us5.test.ts` verifying that Sales Users cannot query offers of unassigned facilities, and Company A users are blocked from querying Company B offers

### Implementation for User Story 5
- [ ] T031 [US5] Implement the Global Offers page at `src/app/(dashboard)/dashboard/offers/page.tsx` querying scoped offers
- [ ] T032 [P] [US5] Implement filter logic (status and assigned owner dropdowns) and totals summary calculation on `src/app/(dashboard)/dashboard/offers/page.tsx`
- [ ] T033 [US5] Ensure the active offers query automatically filters out offers belonging to soft-archived facilities via a dynamic join

**Checkpoint**: Global directory is active, filterable, and strictly isolated.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Archival logic, localization keys, timezone validation, and final checks

- [ ] T034 Implement soft-archiving (`archiveOffer`) and recovery (`recoverOffer`) Server Actions in `src/lib/actions/offers.ts`, updating the whole revision chain and logging the event in `facility_activity`
- [ ] T035 [P] Add translation keys in translation dictionaries for offer statuses, actions, and audit logs
- [ ] T036 Verify that expired offers (sent, past validity date, no decision) display with the derived "Expired" status in Riyadh timezone
- [ ] T037 Run quickstart.md validation steps to ensure all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. BLOCKS all user stories.
- **User Stories (Phases 3 to 7)**: Depend on Foundational completion.
  - User Story 1 (Drafts) is the MVP and must be completed first.
  - User Story 2 (Sending/Printing) depends on User Story 1.
  - User Story 3 (Revisions) depends on User Story 2.
  - User Story 4 (Decisions) depends on User Story 2.
  - User Story 5 (Directory) can run in parallel after User Story 1.
- **Polish (Phase 8)**: Depends on all user stories being completed.

### Parallel Opportunities

- Within **Phase 2**: Triggers (`T004`, `T005`, `T006`, `T007`) and pgTAP tests (`T008`) can be designed in parallel.
- Within **Phase 3**: Client component `OfferEditorModal.tsx` (`T015`) can be built in parallel with backend Server Actions (`T013`, `T014`).
- Once **Phase 2** completes:
  - Developer A can work on **Phase 3** (User Story 1 - MVP).
  - Developer B can start setting up **Phase 7** UI mockups (User Story 5 - Directory).

---

## Parallel Example: User Story 1

```bash
# Developer A implements database triggers and Server Actions:
Task: "Implement Server Action createOffer in src/lib/actions/offers.ts"
Task: "Implement Server Action updateDraftOffer in src/lib/actions/offers.ts"

# Developer B builds the form inputs and styling:
Task: "Design the client-side component OfferEditorModal.tsx in src/components/offers/OfferEditorModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup**.
2. Complete **Phase 2: Foundational** (Must pass pgTAP tests `T009`).
3. Complete **Phase 3: User Story 1** (Draft Offer creation).
4. **STOP and VALIDATE**: Test draft offer creation on a facility page. Verify server-computed subtotals and tenant isolation.

### Incremental Delivery

1. Setup + Foundation ready.
2. Deploy User Story 1 (Create Drafts) -> MVP is live.
3. Deploy User Story 2 (Send & Print) -> Reps can print and send quotes.
4. Deploy User Story 3 (Revisions) -> Reps can revise sent quotes.
5. Deploy User Story 4 (Decisions) -> Reps can close quotes and update facility stages.
6. Deploy User Story 5 (Directory) -> Managers can view and filter all company offers.
