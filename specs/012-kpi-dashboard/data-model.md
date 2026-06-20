# Data Model & Scoping: Role-Aware KPI Dashboard

## Entities Involved
This feature reads and aggregates existing data from the following entities:
- **Facility** (`db.facilities`): Main driver of the CRM pipeline.
- **FollowUp** (`db.followUps`): Scheduled customer contacts.
- **Offer** (`db.offers`): Financial quotes and validity.
- **Contract** (`db.contracts`): Closed-won deals and contract values.
- **CallLog** (`db.callLogs`): Logged phone or whatsapp interactions.
- **Activity** (`db.activities`): Scoped activity timeline.
- **Profile** (`db.profiles`): System representatives and roles.

## Multi-Tenant & Role Scoping Rules (RLS Equivalent)
The database queries executed in [dashboard.ts](file:///F:/CodingProjects/NebrasCRM/src/lib/actions/dashboard.ts) must replicate the exact scoping checks implemented in the list views:

1. **Tenant Isolation**:
   * All queries MUST filter by `companyId === context.activeCompany.id`.
   * Under no circumstances should Company A's dashboard include Company B's records.

2. **Role-Based Visibility**:
   * **Sales User**:
     * Can only see records where they own the underlying facility: `facility.ownerId === context.user.id`.
     * KPI cards, Pipeline Funnel, Follow-up Alerts, and Recent Activity Feed must be restricted to their ownership.
     * Team Performance table is completely hidden.
   * **Supervisor / Company Admin / Super Admin**:
     * Can see all data within their active company.
     * Team Performance section is visible, listing all reps (`sales_user`) belonging to the active company.

## Calculation Specifications

### 1. KPI Cards
* **Total Facilities**: `COUNT` of non-archived facilities in scope.
* **Overdue Follow-ups**: `COUNT` of follow-ups where `status === 'pending'` and `dueAt` is less than the current time in Riyadh.
* **Pending Offers**:
  * `COUNT` of offers where `status === 'sent'` and `validUntil` is not past and `isActive !== false`.
  * `SUM` of `total` for those pending offers.
* **Active Contracts**:
  * `COUNT` of contracts where `status === 'active'`.
  * `SUM` of `value` for those active contracts.
* **Conversion Rate**:
  * `(COUNT of non-archived facilities in scope with status === 'contract') / (COUNT of all non-archived facilities in scope) * 100`.
  * Displayed with one decimal digit, handling division by zero gracefully.

### 2. Team Performance Period Calculations
* **Date Filters** (based on selected period):
  * **This Week**: Start of week = Sunday 00:00:00 to Saturday 23:59:59 (Asia/Riyadh timezone).
  * **This Month**: Start of calendar month 00:00:00 to end of calendar month 23:59:59 (Asia/Riyadh timezone).
  * **This Quarter**: Current calendar quarter boundaries (Asia/Riyadh timezone).
* **Metrics**:
  * **Facilities Assigned**: `COUNT` of active facilities owned by the rep (ignores period filter).
  * **Follow-ups Completed**: `COUNT` of follow-ups owned by the rep where `status === 'done'` and scheduled `dueAt` is within the period.
  * **Calls Logged**: `COUNT` of call logs recorded within the period under facilities owned by the rep.
  * **Offers Sent**: `COUNT` of offers where `sentAt` falls within the selected period and `ownerId` matches the rep.
  * **Contracts Won**: `COUNT` of contracts where `startDate` falls within the selected period, `status === 'active'`, and `ownerId` matches the rep.
