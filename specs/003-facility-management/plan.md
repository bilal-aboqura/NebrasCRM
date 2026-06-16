# Implementation Plan: Facility Management

**Branch**: `003-facility-management` | **Date**: 2026-06-16 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/003-facility-management/spec.md)
**Input**: Feature specification from `/specs/003-facility-management/spec.md`

---

## Summary

This feature implements the core CRM customer/lead management for medical facilities, introducing tenant-scoped database schemas, PostgreSQL Row Level Security (RLS) policies, automatic phone normalization triggers, and a chronological history timeline stream. The interface is built inside the authenticated Next.js dashboard shell using Tailwind CSS and the Tajawal typeface in RTL Arabic, ensuring strict tenant isolation and role-aware navigation.

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
**Scale/Scope**: 2 seed companies (tenants), 4 roles (Super Admin, Company Admin, Supervisor, Sales User), Saudi regions (13) and cities seeds  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Multi-Tenant Data Isolation** - Confirm all data queries and writes are scoped by `company_id` at the data-access layer.
- [x] **Principle II: Role-Based Access Control** - Confirm server-side RBAC validation (deny-by-default) is enforced.
- [x] **Principle III: Arabic-First, RTL, Bilingual** - Confirm UI renders correctly in RTL using the Tajawal font.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-facility-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── facility-actions.md
└── tasks.md             # Phase 2 output (to be generated next)
```

### Source Code Layout

```text
supabase/
├── migrations/
│   └── 20260616000001_facility_management.sql -- Schema changes, triggers, RLS, and seed data
└── tests/
    └── 003-facility-management.test.sql       -- pgTAP unit tests for facilities RLS

src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── facilities/
│               ├── page.tsx                    -- Facilities directory (paginated list, search, filters)
│               └── [id]/
│                   └── page.tsx                -- Facility detail hub with activity timeline
├── components/
│   └── facilities/
│       ├── FacilityForm.tsx                    -- Create & edit modal form
│       └── ActivityTimeline.tsx                -- Chronological timeline of updates
├── lib/
│   ├── actions/
│   │   └── facilities.ts                       -- Server Actions for CRM CRUD operations
│   └── utils/
│       └── phone.ts                            -- Shared phone normalization utility
```

**Structure Decision**: Unified Next.js single repository structure. Supabase CLI manages the local development database, schema migrations, and seeding, while the `src/` directory houses the TypeScript application code.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution check violations.
