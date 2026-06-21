# Implementation Plan: User and Company Administration

**Branch**: `002-user-company-admin` | **Date**: 2026-06-16 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/002-user-company-admin/spec.md)
**Input**: Feature specification from `/specs/002-user-company-admin/spec.md`

---

## Summary

This feature implements the administration panel for managing companies (tenants) and users, along with user self-service profile/password updates. It builds directly on the Next.js, Tailwind, and Supabase foundational layer established in Feature 001. All access boundaries are enforced both server-side (Server Actions & Route Handlers) and in PostgreSQL RLS policies. A secure tokenized invitation flow is used for password creation.

---

## Technical Context

**Language/Version**: TypeScript (Node.js 18+ or 20+)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `postcss`, `lucide-react`  
**Storage**: Supabase (PostgreSQL) with Row Level Security (RLS)  
**Testing**: pgTAP (for database RLS policy unit testing) + Vitest/Playwright (for integration and authentication flows)  
**Target Platform**: Next.js standalone build on a Linux VPS behind Nginx  
**Project Type**: web-service/web-app  
**Performance Goals**: First meaningful paint under 2s, search/filter latency under 300ms  
**Constraints**: Arabic-first RTL design, Tajawal typography, strict data isolation, server-side RBAC  
**Scale/Scope**: 2 seed companies (tenants), 4 roles (Super Admin, Company Admin, Supervisor, Sales User)

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
specs/002-user-company-admin/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── admin-actions.md
```

### Source Code (repository root)

```text
supabase/
├── migrations/
│   └── 20260616000000_user_company_admin.sql -- Schema changes, triggers, and RLS
└── tests/
    └── 002-user-company-admin.test.sql       -- pgTAP RLS validation tests

src/
├── app/
│   ├── (auth)/
│   │   └── invite/
│   │       └── page.tsx        -- Password set page for invited users
│   └── (dashboard)/
│       ├── admin/
│       │   ├── companies/
│       │   │   └── page.tsx    -- Companies directory & management (Super Admin only)
│       │   └── users/
│       │       └── page.tsx    -- Users directory & creation (Role-scoped)
│       └── profile/
│           └── page.tsx        -- Self-service display name & password edit page
├── lib/
│   └── actions/
│       ├── admin.ts            -- Server Actions for company & user administration
│       └── profile.ts          -- Server Actions for self-service profile updates
```

**Structure Decision**: Single project layout using Next.js App Router and local Supabase CLI for database migrations and testing.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution check violations.
