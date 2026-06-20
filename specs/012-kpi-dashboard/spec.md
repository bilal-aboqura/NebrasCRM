# Feature Specification: Role-Aware KPI Dashboard

**Feature Branch**: `012-kpi-dashboard`  
**Created**: 2026-06-20  
**Status**: Draft  
**Input**: User description: "Build the full KPI dashboard for the NEBRASGOO CRM, replacing the current placeholder landing page with a comprehensive, role-aware analytics view. This feature consumes data from all prior features (facilities, pipeline stages, follow-ups, call logs, offers with monetary values, and contracts with revenue) and presents it in a single glanceable screen. It builds on Features 001–010 and must respect all tenant isolation, role-based visibility, and design system rules."

## Clarifications

### Session 2026-06-20

- Q: How should the time period filter apply to the "Facilities Assigned" count for a representative in the Team Performance section? → A: Count all active (non-archived) facilities currently owned by the representative, ignoring the time period filter.
- Q: For the "this week" date range calculation, which day of the week is considered the starting day? → A: Sunday (standard Middle East business week start).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tenant and Role-Scoped Summary KPIs & Funnel (Priority: P1)

As any authenticated user (Sales User or Manager), I want to see a summary of active facilities, pipeline stage counts, overdue follow-ups, pending offers, active contracts, and conversion rates, along with a visual pipeline funnel, so that I can understand my current workload and performance at a single glance.

**Why this priority**: This is the core value of the dashboard, providing the high-level metrics and funnel shape that immediately answers "how is the pipeline doing?" within the user's allowed scope.

**Independent Test**: Log in as a Sales User, verify that only my assigned facilities are counted in the cards and funnel, and verify that the counts exactly match the corresponding list pages (when unfiltered). Log in as a Supervisor, and verify that the metrics reflect all company-wide facilities under my active company, and Company B's data is completely excluded.

**Acceptance Scenarios**:

1. **Given** a Sales User is logged in, **When** they view the dashboard home page, **Then** they see Summary KPI cards (Total Facilities, Stage breakdown, Overdue follow-ups, Pending offers with total SAR value, Active contracts with total SAR value, and Conversion rate) and the Pipeline Funnel calculated using ONLY the facilities assigned to them.
2. **Given** a Manager (Supervisor, Company Admin, or Super Admin) is logged in, **When** they view the dashboard home page, **Then** they see the Summary KPI cards and Pipeline Funnel calculated using ALL non-archived facilities belonging to their active company.
3. **Given** any user views the dashboard, **When** they check the conversion rate card, **Then** it shows the percentage of scoped facilities in the "contract" status relative to all scoped facilities.
4. **Given** any user views the dashboard, **When** they look at the Pipeline Funnel, **Then** it displays a horizontal breakdown or funnel of the facility counts in order of status (new → contacted → qualified → proposal → contract → lost) using system status colors.

---

### User Story 2 - Actionable Follow-up Alerts & Recent Activity Feed (Priority: P2)

As any authenticated user, I want to see a list of my nearest overdue/due-today follow-ups and a feed of recent activities, so that I know what tasks require immediate attention and can track recent updates.

**Why this priority**: Provides interactive, day-to-day operational value to reps and supervisors by highlighting critical upcoming tasks and showing recent events chronologically.

**Independent Test**: Schedule a follow-up for today/past-due under an assigned facility. Go to the dashboard, and verify it appears in the "Follow-up alerts" list. Click on the link, and verify it navigates to that facility's detail page.

**Acceptance Scenarios**:

1. **Given** a user has pending/overdue follow-ups within their scope, **When** they view the dashboard, **Then** the "Follow-up alerts" section displays the top 5–10 nearest overdue and due-today follow-ups, showing the facility name, follow-up type, due date (in Asia/Riyadh timezone), and a direct link to the facility.
2. **Given** recent activity exists in the system within the user's scope, **When** they view the dashboard, **Then** the "Recent Activity Feed" displays the latest 10–15 facility activity entries (e.g., facility created, status changed, offer sent, contract activated) ordered newest first, with each entry linking to its respective facility.

---

### User Story 3 - Team Performance Section for Management Roles (Priority: P3)

As a Manager (Supervisor, Company Admin, or Super Admin), I want to see a summary table of the performance of each sales representative in my company over a selectable time period (this week, this month, or this quarter), so that I can monitor team activity and deal closing rates.

**Why this priority**: Adds management-level oversight and reporting capabilities, which are restricted to administrative roles and not needed by standard sales representatives.

**Independent Test**: Log in as a Sales User, verify the "Team Performance" section is completely hidden. Log in as a Supervisor, verify the section is visible, displays a row for each active representative, and allows selecting "this week", "this month", or "this quarter" to filter metrics.

**Acceptance Scenarios**:

1. **Given** a Sales User is logged in, **When** they view the dashboard, **Then** the Team Performance section does not render at all.
2. **Given** a Manager is logged in, **When** they view the dashboard, **Then** the Team Performance section is visible, showing a list of all active sales representatives in the company.
3. **Given** the Team Performance table is visible, **When** a manager selects a time range (this week / this month / this quarter), **Then** each representative's row updates to display the count of facilities assigned, follow-ups completed, calls logged, offers sent, and contracts won during that period (computed in Asia/Riyadh timezone).

---

### Edge Cases

- **No Facilities/Data in Scope**: If a user has no assigned facilities or a company is brand new, the cards must display `0` or `0.00 ر.س` (instead of throwing errors or returning empty states), the funnel should show zero counts, and the feeds/tables should display a friendly Arabic empty-state message (e.g., "لا توجد بيانات لعرضها").
- **Timezone Boundaries**: Follow-up due dates or activities created right at midnight must align with the Asia/Riyadh timezone to avoid off-by-one errors (e.g., showing a follow-up due tomorrow as due today).
- **Archived/Inactive Records**: Archived facilities, superseded offers, or archived contracts must be excluded from all dashboard counts, consistent with their corresponding list pages.
- **Decimal/Monetary Formatting**: High values must be formatted cleanly in SAR (e.g., `1,250,500.00 ر.س`) using standard Arabic locale representation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST scope all metrics, feeds, and sections to the current active company of the authenticated user to maintain tenant isolation.
- **FR-002**: For Sales Users, the system MUST scope all facility-related metrics, follow-ups, activity feed items, offers, and contracts to those assigned to/owned by the Sales User.
- **FR-003**: The Summary KPI section MUST display the following metrics:
  - Total active (non-archived) facilities.
  - Active facilities count grouped by each pipeline stage.
  - Count of overdue/due-today pending follow-ups.
  - Count and total SAR value of pending offers (offers status "sent" and not expired).
  - Count and total SAR value of active contracts (contracts status "active").
  - Conversion rate (percentage of non-archived facilities in "contract" stage out of total non-archived facilities).
- **FR-004**: The system MUST display a Pipeline Funnel visual representation using the ordering: new (جديد) → contacted (تم التواصل) → qualified (مؤهل) → proposal (عرض سعر) → contract (عقد) → lost (مفقود).
- **FR-005**: The Follow-Up Alerts section MUST show up to 10 pending/overdue follow-ups due on or before today, ordered by due date, with a link to the facility detail.
- **FR-006**: The Recent Activity section MUST show the latest 10–15 activity log records within the user's scope, ordered by creation date descending, with a link to the facility.
- **FR-007**: The Team Performance section MUST only be visible to roles: `super_admin`, `company_admin`, and `supervisor`.
- **FR-008**: The Team Performance section MUST display a per-rep summary containing:
  - Rep Display Name.
  - Number of facilities assigned (all active/non-archived facilities currently owned by the representative, ignoring the selected time period filter).
  - Number of follow-ups completed (status "done" with due date in period).
  - Number of call logs recorded (occurredAt in period for facilities owned by the rep).
  - Number of offers sent (sentAt in period).
  - Number of contracts won (startDate in period and status "active").
- **FR-009**: The Team Performance section MUST allow selecting a date range filter (this week, this month, this quarter) computed server-side in Asia/Riyadh timezone.
- **FR-010**: All numerical and monetary figures MUST exactly match the values shown in the underlying list pages when filtered to the same scope.

### Key Entities

- **Facility**: Represents the client facility. Attributes include `ownerId` (sales rep), `status` (pipeline stage), `companyId` (tenant), and `isArchived`.
- **Follow-up**: Represents a scheduled task. Attributes include `ownerId`, `status` ("pending" / "done" / "cancelled"), `dueAt` (due date/time), and `facilityId`.
- **Offer**: Represents a monetary proposal. Attributes include `companyId`, `facilityId`, `status` ("draft", "sent", "accepted", "rejected"), `total` (SAR value), and `sentAt`.
- **Contract**: Represents a won deal. Attributes include `companyId`, `facilityId`, `status` ("active"), `value` (SAR value), and `startDate`.
- **Activity**: Represents log entries. Attributes include `companyId`, `facilityId`, `kind`, and `createdAt`.
- **Profile**: Represents the system user/rep. Attributes include `companyId`, `role`, and `status`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The home page dashboard loads in under 1 second under standard network conditions by using server-side pre-aggregations instead of raw client-side looping.
- **SC-002**: 100% of the figures shown on the dashboard match the filtered count of their respective list views when compared side-by-side.
- **SC-003**: 100% of data rendered is verified to be tenant-isolated; a user from Company A can never view any card value, alert, activity, or team performance row belonging to Company B.
- **SC-004**: Non-manager users (Sales Users) have a 0% exposure rate to the Team Performance section, with zero console errors or leaked elements.

## Assumptions

- **Timezone & Week Start**: All date calculations are performed relative to the Asia/Riyadh timezone (e.g., today's boundaries for due-today tasks). The first day of the week for "this week" calculations is Sunday.
- **Call Log Rep Mapping**: Since `CallLog` does not contain an `ownerId` field, a call log is associated with the representative who is the `ownerId` of the facility the call log is recorded under.
- **Date Filtering for Team Performance**:
  - Facilities Assigned: Count all active (non-archived) facilities currently owned by the representative, ignoring the selected time period filter.
  - Follow-ups Completed: Follow-ups where `status === "done"` and the scheduled `dueAt` date falls within the selected period.
  - Calls Logged: Call logs where `occurredAt` falls within the selected period under a facility owned by the rep.
  - Offers Sent: Offers where `sentAt` falls within the selected period.
  - Contracts Won: Contracts where `startDate` falls within the selected period and status is "active".
