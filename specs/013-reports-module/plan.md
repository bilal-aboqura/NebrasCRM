# Implementation Plan: Reports Module

**Branch**: `013-reports-module` | **Date**: 2026-06-21 | **Spec**: [/specs/013-reports-module/spec.md](file:///F:/CodingProjects/NebrasCRM/specs/013-reports-module/spec.md)
**Input**: Feature specification from `/specs/013-reports-module/spec.md`

## Summary
The Reports Module provides role-aware, tenant-isolated, date-ranged analytical reporting views for sales performance, pipeline health, follow-up diligence, communication activities, and team productivity. It complements the dashboard by focusing on historical periods (e.g. "what happened over period X") with advanced filtering and Excel exports. 

To support the reports, we will perform database migrations for two prerequisites:
1. **`facility_activity` schema fix**: Convert/add structured fields `event_type` (enum), `old_value`, and `new_value` to track facility status changes cleanly.
2. **`followup_type` enum correction**: Update the enum to `('call', 'visit', 'send_offer', 'other')`, removing `email` and `whatsapp` and migrating any existing data.

The frontend is built using Next.js (App Router), Tailwind CSS, Recharts for visual charts, and SheetJS (xlsx) for server-side Arabic Excel exports.

## Technical Context

**Language/Version**: Next.js 14 (App Router), TypeScript, Node.js v20+  
**Primary Dependencies**: `recharts` (for visual reports), `xlsx` (SheetJS for Excel exports), `lucide-react` (icons)  
**Storage**: PostgreSQL (Supabase) + RLS policies  
**Testing**: Vitest  
**Target Platform**: Node.js VPS / Linux server behind Nginx  
**Project Type**: Web Application  
**Performance Goals**: Under 2-second load times using server-side SQL aggregations and indexes.  
**Constraints**: RTL layout, Tajawal font, Arabic-first copy, strict tenant isolation, role-based visibility.  
**Scale/Scope**: 6 analytical reports (Sales Pipeline, Conversion & Loss, Follow-up Performance, Communication Activity, Offers & Revenue, Team Comparison).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Principle I: Multi-Tenant Data Isolation** - Confirm all data queries and writes are scoped by `company_id` at the data-access layer.  
  *Yes. All queries run through the database's Row-Level Security (RLS) policies scoped by `company_id` obtained from the user's secure JWT session claims.*
- [ ] **Principle II: Role-Based Access Control** - Confirm server-side RBAC validation (deny-by-default) is enforced.  
  *Yes. Access to routes and API data queries checks the user's role. Sales Users are restricted from accessing Report 6 (Team Comparison) and see only their owned/assigned data in Reports 1–5. Supervisors and Admins see company-wide records.*
- [ ] **Principle III: Arabic-First, RTL, Bilingual** - Confirm UI renders correctly in RTL using the Tajawal font.  
  *Yes. The UI will render in RTL, using Arabic headers and labels, SAR currency representation, and Tajawal typography.*

## Project Structure

### Documentation (this feature)

```text
specs/013-reports-module/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── reports/
│           ├── page.tsx                          # Reports selection index
│           ├── pipeline/page.tsx                  # Report 1
│           ├── conversion-loss/page.tsx          # Report 2
│           ├── followup-performance/page.tsx     # Report 3
│           ├── communication/page.tsx            # Report 4
│           ├── offers-revenue/page.tsx           # Report 5
│           └── team-comparison/page.tsx          # Report 6 (Managers Only)
├── components/
│   └── reports/
│       ├── DateRangePicker.tsx                   # Date picker + presets
│       ├── FilterBar.tsx                         # Reusable filter container
│       ├── ExportButton.tsx                      # Excel download trigger
│       ├── InflowOutflowChart.tsx                # Recharts wrapper for Report 1
│       ├── FunnelChart.tsx                       # Recharts wrapper for Report 2
│       ├── FollowupStackedChart.tsx              # Recharts wrapper for Report 3
│       └── CommunicationBarChart.tsx             # Recharts wrapper for Report 4
├── lib/
│   ├── actions/
│   │   └── reports-actions.ts                    # Server Actions for reports aggregation
│   └── types/
│       ├── domain.ts                             # Updated FollowUp & Activity types
│       └── followups.ts                          # Updated FollowUp Zod schema
└── supabase/
    └── migrations/
        └── 20260621000001_reports_prerequisites.sql  # Database schema fixes
```

**Structure Decision**: Next.js App Router structure under `(dashboard)/reports` for all reporting pages. Shared components are placed under `components/reports/` for clean modularity, and server-side aggregation functions are declared in `lib/actions/reports-actions.ts`.

## Complexity Tracking

*No constitutional violations exist; hence no complexity tracking exceptions are required.*
