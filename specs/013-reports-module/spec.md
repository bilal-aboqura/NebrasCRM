# Feature Specification: Reports Module

**Feature Branch**: `013-reports-module`  
**Created**: 2026-06-21  
**Status**: Draft  
**Input**: User description: "Build the reports module for the NEBRASGOO CRM: filterable, date-ranged analytical views that let managers drill into sales performance, pipeline health, and team productivity over time. This complements the Dashboard (Feature 011): the dashboard shows a current-state snapshot; reports answer 'what happened over period X' with filtering and export. It builds on Features 001–011 and must respect all tenant isolation, role-based visibility, and design system rules."

## Clarifications

### Session 2026-06-21

- Q: How should we resolve the discrepancy between the requested report types (call / visit / send_offer / other) and the existing database follow-up types (call / visit / email / whatsapp)? → A: Update the database enum to match the original Feature 006 spec: `call`, `visit`, `send_offer`, `other`. Remove `email`/`whatsapp` from `followup_type` as they are communication channels already tracked in `call_logs.channel` (Feature 007), not task types. This requires a migration to alter the enum and update any existing rows using the old values.
- Q: How should stage transitions be recorded and queried to calculate average durations? → A: Do not create a new table. The `facility_activity` table will be modified to include structured fields: `event_type`, `old_value`, and `new_value` (event_type = 'status_change', old_value = previous status, new_value = new status) to match the original Feature 003 specification. Stage durations will be queried directly from `facility_activity` by selecting rows where `event_type = 'status_change'` ordered by `created_at` per facility, and computing durations between consecutive transitions.
- Q: How should the Team Comparison Report handle sales representatives who are now deactivated but have historical activity within the selected date range? → A: Show active representatives by default, and provide a toggle/checkbox to "Show Inactive Representatives" (عرض المندوبين غير النشطين) if they have historical data within the selected period.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sales Pipeline & Conversion Reports (Priority: P1)

As a CRM user (Sales User or Manager), I want to view reports on the Sales Pipeline (Report 1) and Conversion & Loss (Report 2) over a selected date range, so that I can see the movement of facilities through stages and understand why deals are lost.

**Why this priority**: Core value of the reporting module, providing basic analytical insights into pipeline health and conversion rates, which are critical for any sales organization.

**Independent Test**: Log in as Sales User or Manager, click "التقارير" (Reports) in the sidebar. Select "تقرير تدفق المبيعات" (Sales Pipeline) or "تقرير التحويل والخسارة" (Conversion & Loss). Pick a date range (e.g., this month), see the stage movement, inflows, outflows, funnel progression, win rates, and loss reasons updated dynamically, then export to Excel.

**Acceptance Scenarios**:

1. **Given** any authenticated user is logged in, **When** they view the Sidebar, **Then** they see a dedicated "التقارير" navigation item.
2. **Given** a user navigates to "التقارير", **When** they select the "Sales Pipeline" report, **Then** they see inflow, outflow, net change, and stage duration averages, along with a stage-by-stage bar chart showing inflows/outflows per stage.
3. **Given** a user navigates to "التقارير", **When** they select the "Conversion & Loss" report, **Then** they see the conversion funnel count (new → contacted → interested → offer → negotiation → contract), a win rate percentage, and a bar or pie chart showing lost reasons.
4. **Given** a Sales User views these reports, **When** they apply filters, **Then** the report metrics only reflect facilities assigned to them.
5. **Given** a Manager (Supervisor, Company Admin, or Super Admin) views these reports, **When** they apply filters, **Then** the report metrics reflect all company-wide facilities.
6. **Given** any report view, **When** the user clicks "تصدير إلى إكسل" (Export to Excel), **Then** a valid `.xlsx` file is generated containing Arabic headers, details of the active filters, and the report data matching what is on-screen.

---

### User Story 2 - Follow-up & Communication Performance (Priority: P2)

As a CRM user, I want to view reports on Follow-up Performance (Report 3) and Communication Activity (Report 4) within a selected period, so that I can evaluate team productivity and outreach effectiveness.

**Why this priority**: Operational analytics that help reps and managers track daily activities, follow-up diligence, and communication logs.

**Independent Test**: Log in, select the "Follow-up Performance" or "Communication Activity" report, filter by date range, and verify that the counts of follow-ups and calls match the list views. Verify that per-rep breakdowns are only visible to Managers.

**Acceptance Scenarios**:

1. **Given** a user views "Follow-up Performance", **When** they select a date range, **Then** they see total follow-ups created, completed, cancelled, overdue, the on-time completion rate, and the average time to complete, broken down by follow-up type.
2. **Given** a user views "Communication Activity", **When** they select a date range, **Then** they see total calls and WhatsApp messages logged, broken down by direction (inbound/outbound) and outcome.
3. **Given** a Sales User views the "Communication Activity" report, **When** they load the page, **Then** they only see their own aggregate metrics without any rep breakdown.
4. **Given** a Manager views the "Communication Activity" report, **When** they load the page, **Then** they see a per-rep activity breakdown table in addition to the company-wide aggregates.

---

### User Story 3 - Offers, Revenue, and Team Comparison (Priority: P3)

As a CRM user (Sales User for Report 5, Manager only for Report 6), I want to view Offers & Revenue (Report 5) and Team Comparison (Report 6) to analyze financial performance and compare representatives side-by-side.

**Why this priority**: Financial reports and competitive team grids that are essential for planning, budgeting, and performance management.

**Independent Test**: Log in as a Sales User, verify Report 6 is completely hidden and inaccessible. Log in as a Manager, view the side-by-side rep grid, sort by different columns, and verify that the revenue totals match active contracts.

**Acceptance Scenarios**:

1. **Given** a user views "Offers & Revenue", **When** they select a date range, **Then** they see offers sent, accepted, rejected, expired, along with total and average values in SAR, average decision times, and contracts activated (count and SAR value).
2. **Given** a Sales User views "Offers & Revenue", **When** they load the page, **Then** they only see their own metrics and cannot see the "Revenue by Rep" section.
3. **Given** a Manager views "Offers & Revenue", **When** they load the page, **Then** they see the "Revenue by Rep" section showing the financial contributions of each representative.
4. **Given** a Manager is logged in, **When** they select "Team Comparison" from the reports menu, **Then** they see a side-by-side comparison table of all reps with metrics for the selected period, which is sortable by any column and highlights top/bottom performers.
5. **Given** a Sales User is logged in, **When** they access reports, **Then** the "Team Comparison" report is not shown in the navigation, and accessing its route directly redirects them to the reports index or shows a permissions error.

---

### Edge Cases

- **No Data in Date Range**: If a selected range has no matching activities, the report must show zeros or empty states with a friendly Arabic message (e.g., "لا توجد بيانات للفترة المحددة").
- **Deleted/Archived Entities**: Archived facilities, deleted contacts, or superseded/draft offers must be excluded from all calculations.
- **Timezone Rollovers**: Queries must convert timestamps strictly using `Asia/Riyadh` to prevent records logged near midnight from appearing in the wrong day.
- **Overdue Calculations**: Follow-ups are marked overdue based on their `due_at` timestamp relative to the end date of the period or current time, whichever is earlier.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: **Tenant Isolation**: The system MUST scope all report calculations, filters, and exports to the active company of the authenticated user.
- **FR-002**: **Role-Aware Filters & Scope**: 
  - Sales Users: Calculations MUST only process facilities and related records owned by/assigned to the user.
  - Managers (Supervisor, Company Admin, Super Admin): Calculations MUST process all records in the company.
- **FR-003**: **Reports Navigation**: The sidebar MUST include a "التقارير" nav item linking to a reports selection page. For Sales Users, Report 6 (Team Comparison) MUST be omitted from the UI.
- **FR-004**: **Date Range Picker**: Every report page MUST contain a date filter component in Arabic supporting custom bounds and presets:
  - اليوم (Today)
  - هذا الأسبوع (This Week - starting Sunday)
  - هذا الشهر (This Month)
  - هذا الربع (This Quarter)
  - هذه السنة (This Year)
- **FR-005**: **Sales Pipeline Report (Report 1)**: The system MUST display:
  - Facilities entered each stage during the selected period.
  - Facilities exited each stage during the selected period.
  - Net change (entered - exited) per stage.
  - Average stage duration (time spent in stage before moving) computed using transition logs.
- **FR-006**: **Conversion & Loss Report (Report 2)**: The system MUST display:
  - Funnel conversion counts (new → contacted → interested → offer → negotiation → contract).
  - Count of facilities moved to "lost" status grouped by `lost_reason`.
  - Win rate: contracts won / (contracts won + lost) within the period.
- **FR-007**: **Follow-up Performance Report (Report 3)**: The system MUST display:
  - Count of follow-ups created, completed, cancelled, and overdue.
  - On-time completion rate: completed on/before `due_at` / total completed.
  - Average time to complete.
  - Breakdown by type (call, visit, send_offer, other).
- **FR-008**: **Communication Activity Report (Report 4)**: The system MUST display:
  - Count of calls and WhatsApp logs.
  - Breakdown by direction (inbound/outbound) and outcome.
  - Per-rep aggregate list (for Managers only).
- **FR-009**: **Offers & Revenue Report (Report 5)**: The system MUST display:
  - Count and total SAR value of offers sent, accepted, rejected, expired.
  - Average offer value and average time from sent to decision.
  - Count and total SAR value of contracts activated (status "active" and start date in period).
  - Revenue by rep (for Managers only).
- **FR-010**: **Team Comparison Report (Report 6)**: The system MUST render a sortable side-by-side rep comparison table for managers showing: facilities assigned, follow-ups completed, calls made, offers sent, contracts won, and total revenue. Top and bottom performers MUST be highlighted visually. The table MUST show active representatives by default, with a toggle/checkbox to "Show Inactive Representatives" (عرض المندوبين غير النشطين) who have historical data in the selected period.
- **FR-011**: **Excel Export**: All reports MUST support export to `.xlsx` containing the filtered data, Arabic column headers, active filters description, and a summary/totals row at the bottom.
- **FR-012**: **Performance and Optimization**: Report queries MUST use server-side aggregation (SQL `GROUP BY` and functions) to minimize data transfer and ensure fast page loads even with large date ranges.

### Key Entities

- **FacilityActivity**: Tracks history logs and lifecycle changes of a facility. Key attributes:
  - `facility_id` (UUID references facilities)
  - `company_id` (UUID references companies)
  - `actor_id` (UUID references profiles)
  - `event_type` (type: status_change, owner_change, archived, recovered, created, edited)
  - `old_value` (text)
  - `new_value` (text)
  - `created_at` (timestamptz)
- **Facility**: Represents the client. Key attributes: `company_id`, `owner_id`, `status`, `is_active`, `lost_reason`, `status_changed_at`.
- **Followup**: Represents tasks. Key attributes: `company_id`, `owner_id`, `status`, `type` (call, visit, send_offer, other), `due_at`, `completed_at` (or derived from status update).
- **CallLog**: Represents communications. Key attributes: `company_id`, `facility_id`, `channel`, `direction`, `outcome`, `occurred_at`.
- **Offer**: Represents proposals. Key attributes: `company_id`, `owner_id`, `status`, `total`, `sent_at`, `decision_at`, `valid_until`.
- **Contract**: Represents wins. Key attributes: `company_id`, `owner_id`, `status`, `value`, `start_date`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All reports load in under 2 seconds for a standard 1-month date range on standard network conditions.
- **SC-002**: 100% of the numbers shown in any report match their corresponding filtered values in list views or dashboard cards.
- **SC-003**: 100% tenant isolation is maintained at the query level (data from Company A is never visible to users of Company B).
- **SC-004**: Non-manager users (Sales Users) have a 0% exposure rate to Report 6 or other reps' metrics.
- **SC-005**: Excel exports generate correct Arabic names, formats, and values matching the on-screen data.

## Assumptions

- **Timezone**: All date boundaries and calculations are based on `Asia/Riyadh` timezone.
- **Week Start**: The calendar week starts on Sunday.
- **Average Stage Duration**: Handled using `facility_activity` records where `event_type = 'status_change'`. Consecutive status changes for a facility are ordered by `created_at` to compute the duration in each stage. For the current stage, the duration is calculated from `status_changed_at` or the latest status change record until the end of the period (or current time).
- **On-Time Completion**: A follow-up is on-time if it was updated to `done` on or before its `due_at` timestamp.
- **Expired Offers**: Offers in `sent` or `draft` status where `valid_until` is in the past.
- **Contract Activation**: A contract is active if status is `active` and its `start_date` falls within the period.
- **Follow-up Type Migration**: The database enum `public.followup_type` will be updated via a database migration to `('call', 'visit', 'send_offer', 'other')`, removing `email` and `whatsapp`. Any existing rows will be updated/mapped accordingly.
- **Facility Activity Schema Update**: A migration will modify the `public.facility_activity` table to add `event_type` (enum), `old_value` (text), and `new_value` (text) fields, converting/mapping existing unstructured text logs to this structured format.
