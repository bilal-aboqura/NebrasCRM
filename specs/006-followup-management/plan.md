# Implementation Plan: Follow-up Management

**Branch**: `006-followup-management` | **Date**: 2026-06-16 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/006-followup-management/spec.md)
**Input**: Feature specification from `/specs/006-followup-management/spec.md`

---

## Summary

This feature implements follow-up management for facilities in the NEBRASGOO CRM, including schema definitions for follow-ups (calls, visits, offers, etc.), postgres RLS rules for multi-tenant isolation, automated owners-cascading triggers upon facility owner reassignment, Server Actions, and Arabic-first RTL views. The UI includes a tab/section on the facility detail page and a dedicated "المتابعات" page that defaults to an "All Pending" consolidated list sorted by urgency.

---

## Technical Context

**Language/Version**: TypeScript (Node.js 18+ or 20+)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `postcss`, `lucide-react`  
**Storage**: Supabase (PostgreSQL) with Row Level Security (RLS)  
**Testing**: pgTAP (database unit tests) + Vitest/Playwright (integration & UI flows)  
**Target Platform**: Next.js standalone build on a Linux VPS behind Nginx  
**Project Type**: web-service/web-app  
**Performance Goals**: First meaningful paint under 2s, search/filter latency under 300ms  
**Constraints**: Arabic-first RTL design, Tajawal typography, strict data isolation, server-side RBAC  
**Scale/Scope**: 2 seed companies (tenants), 4 roles (Super Admin, Company Admin, Supervisor, Sales User), Saudi regions and cities, facility contacts, activity timeline  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Principle I: Multi-Tenant Data Isolation** - Confirm all data queries and writes are scoped by `company_id` at the data-access layer.
- [ ] **Principle II: Role-Based Access Control** - Confirm server-side RBAC validation (deny-by-default) is enforced.
- [ ] **Principle III: Arabic-First, RTL, Bilingual** - Confirm UI renders correctly in RTL using the Tajawal font.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-followup-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── followup-actions.md
└── tasks.md             # Phase 2 output (to be generated next)
```

### Source Code Layout

```text
supabase/
├── migrations/
│   └── 20260616000004_followup_management.sql  -- Schema changes, status enums, RLS, triggers, cascading logic
└── tests/
    └── 006-followup-management.test.sql        -- pgTAP unit tests for RLS, cascade, and constraints

src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── followups/
│               └── page.tsx                    -- Dedicated "المتابعات" view (All Pending, tabs, manager filter)
├── components/
│   ├── facilities/
│   │   └── FollowUpsSection.tsx                -- Tab/section component on the facility detail page
│   └── followups/
│       ├── FollowUpModal.tsx                   -- Create/Edit/Reschedule/Cancel modal
│       └── CompleteFollowUpModal.tsx           -- Low-friction completion modal with outcome selector
├── lib/
│   └── actions/
│       ├── followups.ts                        -- Server Actions for follow-up CRUD and status mutations
│       └── facilities.ts                       -- Updated to handle atomic owner reassignment cascade
```

**Structure Decision**: Unified Next.js single repository structure matching established patterns. Supabase CLI manages migrations and local unit tests, while the Next.js Server Actions and React components live in their respective `src/` subdirectories.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution check violations.
