# Tasks: Reports Module

**Input**: Design documents from `/specs/013-reports-module/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All task descriptions specify the target file paths.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project routing and menu entry setup

- [ ] T001 Create page files for the reports index and the 6 individual report routes in `src/app/(dashboard)/reports/`
- [ ] T002 Add the "التقارير" (Reports) navigation item to the dashboard menu in `src/components/SidebarNav.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema corrections and shared utility components

- [ ] T003 Write SQL migration file at `supabase/migrations/20260621000001_reports_prerequisites.sql` to correct the `followup_type` enum and add structured fields (`event_type`, `old_value`, `new_value`) to `facility_activity`
- [ ] T004 Apply the migration file using `npx supabase db push` or direct execution
- [ ] T005 Update the follow-up and activity TypeScript type definitions in `src/lib/types/domain.ts`
- [ ] T006 Update the follow-up creation validation schema in `src/lib/types/followups.ts`
- [ ] T007 [P] Create the `DateRangePicker.tsx` component with Asia/Riyadh boundaries and presets in `src/components/reports/DateRangePicker.tsx`
- [ ] T008 [P] Create the `FilterBar.tsx` container component in `src/components/reports/FilterBar.tsx`
- [ ] T009 [P] Create the `ExportButton.tsx` SheetJS-based helper component in `src/components/reports/ExportButton.tsx`
- [ ] T010 Implement the main dashboard selection page in `src/app/(dashboard)/reports/page.tsx`

**Checkpoint**: Foundation ready - database corrected, shared pickers and exports functional, and landing page visible.

---

## Phase 3: User Story 1 - Sales Pipeline & Conversion Reports (Priority: P1) 🎯 MVP

**Goal**: Deliver the core sales pipeline stage movement (Report 1) and conversion funnel/lost reasons (Report 2) with RLS isolation.

**Independent Test**: Open reports index, select Sales Pipeline or Conversion & Loss, apply filters, and verify inflow/outflow charts and funnel numbers correctly isolate Company A vs Company B data.

- [ ] T011 [US1] Implement server-side aggregation for the Sales Pipeline Report (inflows, outflows, net change, stage duration) in `src/lib/actions/reports-actions.ts`
- [ ] T012 [US1] Implement server-side aggregation for the Conversion & Loss Report (funnel counts, lost reasons, win rate) in `src/lib/actions/reports-actions.ts`
- [ ] T013 [P] [US1] Create the Recharts-based `InflowOutflowChart.tsx` component in `src/components/reports/InflowOutflowChart.tsx`
- [ ] T014 [P] [US1] Create the Recharts-based `FunnelChart.tsx` component in `src/components/reports/FunnelChart.tsx`
- [ ] T015 [US1] Implement the Sales Pipeline report UI rendering inputs, metrics, chart, and detailed table in `src/app/(dashboard)/reports/pipeline/page.tsx`
- [ ] T016 [US1] Implement the Conversion & Loss report UI rendering inputs, funnel, win rate, and lost reasons pie/bar charts in `src/app/(dashboard)/reports/conversion-loss/page.tsx`
- [ ] T017 [US1] Write automated integration tests for pipeline calculations, conversion funnel, tenant isolation, and role restrictions in `src/tests/reports-us1.test.ts`

**Checkpoint**: MVP scope complete. Pipeline and Conversion reports are functional and isolated.

---

## Phase 4: User Story 2 - Follow-up & Communication Performance (Priority: P2)

**Goal**: Deliver follow-up (Report 3) and communication (Report 4) metrics with rep breakdown restrictions.

**Independent Test**: Verify follow-up on-time rates and call counts match list pages. Verify that Sales Users see their own aggregates while Managers see the per-rep table.

- [ ] T018 [US2] Implement server-side aggregation for the Follow-up Performance Report (created, completed, cancelled, overdue, averages) in `src/lib/actions/reports-actions.ts`
- [ ] T019 [US2] Implement server-side aggregation for the Communication Activity Report (calls/WhatsApp count, direction, outcome, rep list) in `src/lib/actions/reports-actions.ts`
- [ ] T020 [P] [US2] Create the Recharts-based `FollowupStackedChart.tsx` component in `src/components/reports/FollowupStackedChart.tsx`
- [ ] T021 [P] [US2] Create the Recharts-based `CommunicationBarChart.tsx` component in `src/components/reports/CommunicationBarChart.tsx`
- [ ] T022 [US2] Implement the Follow-up Performance report UI in `src/app/(dashboard)/reports/followup-performance/page.tsx`
- [ ] T023 [US2] Implement the Communication Activity report UI (with role-restricted rep breakdown) in `src/app/(dashboard)/reports/communication/page.tsx`
- [ ] T024 [US2] Write automated tests for follow-up aggregates, communication outcomes, and role-based rep tables in `src/tests/reports-us2.test.ts`

**Checkpoint**: Phase 4 complete. Productivity reports are functional and role-aware.

---

## Phase 5: User Story 3 - Offers, Revenue, and Team Comparison (Priority: P3)

**Goal**: Deliver Offers & Revenue metrics (Report 5) and the manager-only Team Comparison side-by-side grid (Report 6) with inactive reps toggle.

**Independent Test**: Log in as a Sales User, verify Report 6 route is blocked. Log in as Manager, sort Team Comparison columns, toggle inactive reps, and verify revenue maps to active contracts.

- [ ] T025 [US3] Implement server-side aggregation for the Offers & Revenue Report (sent, accepted, rejected, expired values, decision times, contract activations) in `src/lib/actions/reports-actions.ts`
- [ ] T026 [US3] Implement server-side aggregation for the Team Comparison Report (rep metrics grid, filtering active/inactive reps) in `src/lib/actions/reports-actions.ts`
- [ ] T027 [US3] Implement the Offers & Revenue report UI in `src/app/(dashboard)/reports/offers-revenue/page.tsx`
- [ ] T028 [US3] Implement the Team Comparison report UI (grid with sorting, performance highlights, and inactive toggle) in `src/app/(dashboard)/reports/team-comparison/page.tsx`
- [ ] T029 [US3] Write automated tests for offer calculations, team grid sorting, inactive rep toggle, and page route access control in `src/tests/reports-us3.test.ts`

**Checkpoint**: All reporting pages are fully functional, verified, and secure.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: UI refinement, Excel export formatting validation, and build verification.

- [ ] T030 Verify the `.xlsx` export structure, Arabic headers, active filters list, summary row, and RLS correctness across all reports
- [ ] T031 Polish RTL layout spacing, responsive chart scaling, and Tajawal font representation across all report screens
- [ ] T032 Run `quickstart.md` validation, ensuring local build compiles successfully and all Vitest suites pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1), US2 (P2), and US3 (P3) can proceed sequentially in priority order
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### Parallel Opportunities

- Within **Phase 2**: Foundational components T007, T008, T009 can be developed in parallel.
- Within **Phase 3**: Recharts wrappers T013 and T014 can be developed in parallel.
- Within **Phase 4**: Recharts wrappers T020 and T021 can be developed in parallel.

---

## Parallel Example: User Story 1

```bash
# Developer A implements Recharts pipeline chart:
Task: "Create the Recharts-based InflowOutflowChart.tsx component in src/components/reports/InflowOutflowChart.tsx"

# Developer B implements Recharts funnel chart:
Task: "Create the Recharts-based FunnelChart.tsx component in src/components/reports/FunnelChart.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1 - Sales Pipeline & Conversion).
3. **STOP and VALIDATE**: Verify charts update, filters respect RLS, and Excel export runs correctly.
4. Deploy the MVP.

### Incremental Delivery

1. Foundation ready (Phase 1 & 2 complete).
2. Add Pipeline & Conversion reports (US1 - MVP).
3. Add Follow-up & Communication reports (US2).
4. Add Offers & Revenue and Team Comparison reports (US3).
5. Run complete polish pass (Phase 6).
