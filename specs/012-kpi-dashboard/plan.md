# Implementation Plan: Role-Aware KPI Dashboard

**Branch**: `012-kpi-dashboard` | **Date**: 2026-06-20 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/012-kpi-dashboard/spec.md)
**Input**: Feature specification from `/specs/012-kpi-dashboard/spec.md`

## Summary
We will replace the placeholder home page dashboard with a comprehensive, tenant-scoped, role-aware dashboard. The page will render top-level KPI cards, a pipeline funnel visualization using Recharts, overdue follow-up alerts, a recent activity feed, and a team performance section (visible only to managers). All data fetches will be performed server-side via server actions/components to guarantee strict RLS-like scoping, tenant isolation, and sub-2-second load times.

## Technical Context

**Language/Version**: Next.js 14 (App Router), TypeScript (Node v20+)  
**Primary Dependencies**: React 18, TailwindCSS, Lucide React, Recharts  
**Storage**: Memory database (`db` in `@/lib/data/store`, backing local mocks)  
**Testing**: Vitest  
**Target Platform**: Node.js server VPS  
**Project Type**: Web application  
**Performance Goals**: Dashboard loads in under 1 second under standard conditions.  
**Constraints**: strictly scoped by `activeCompany.id`, RLS-guarded by user role, zero client-side evaluation of other tenants' data.  
**Scale/Scope**: Aggregates for up to thousands of facilities/offers/contracts per tenant.

## Constitution Check

- [ ] **Principle I: Multi-Tenant Data Isolation** - Confirm all data queries and writes are scoped by `company_id` at the data-access layer.
- [ ] **Principle II: Role-Based Access Control** - Confirm server-side RBAC validation (deny-by-default) is enforced.
- [ ] **Principle III: Arabic-First, RTL, Bilingual** - Confirm UI renders correctly in RTL using the Tajawal font.

## Project Structure

### Documentation (this feature)

```text
specs/012-kpi-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (to be created by /speckit-tasks)
```

### Source Code

```text
src/
├── app/
│   └── (dashboard)/
│       └── page.tsx                 # Dashboard home page controller (Server Component)
├── components/
│   └── dashboard/
│       ├── DashboardClient.tsx      # Handles layout, state for period filter
│       ├── KpiCards.tsx             # Renders top-row metrics
│       ├── PipelineFunnel.tsx       # Renders Recharts-based stage visualization
│       ├── FollowUpAlerts.tsx       # Renders actionable overdue alerts
│       ├── RecentActivityFeed.tsx   # Renders scoped facility activity log
│       └── TeamPerformance.tsx      # Renders per-rep activity tables (managers only)
└── lib/
    └── actions/
        └── dashboard.ts             # [NEW] Server action for optimized aggregates
```

**Structure Decision**: Monorepo/single Next.js project. We will add a new server action file at [dashboard.ts](file:///F:/CodingProjects/NebrasCRM/src/lib/actions/dashboard.ts) and modular components in `src/components/dashboard/` to separate visual rendering from data-access logic.
