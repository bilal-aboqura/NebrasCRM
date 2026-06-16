# Implementation Plan: Foundational Access Layer (Authentication & Tenant Isolation)

**Branch**: `001-auth-tenant-isolation` | **Date**: 2026-06-16 | **Spec**: [spec.md](file:///f:/CodingProjects/NebrasCRM/specs/001-auth-tenant-isolation/spec.md)
**Input**: Feature specification from `/specs/001-auth-tenant-isolation/spec.md`

## Summary

This feature implements the core authentication and multi-tenant security architecture for the NEBRASGOO platform. We establish a unified login screen using Supabase Auth, cookie-based session management, Next.js Middleware route guards, dynamic role-based rendering in the App Shell, and strict tenant data isolation enforced by PostgreSQL Row Level Security (RLS) policies.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+ or 20+)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `postcss`, `lucide-react`  
**Storage**: Supabase (PostgreSQL) with Row Level Security (RLS) and Custom Claims hook  
**Testing**: pgTAP (for database RLS policy unit testing) + Vitest/Playwright (for integration and authentication flows)  
**Target Platform**: Next.js standalone build on a Linux VPS behind Nginx  
**Project Type**: web-service/web-app  
**Performance Goals**: First meaningful paint under 2s, search/filter latency under 300ms  
**Constraints**: Arabic-first RTL design, Tajawal typography, strict data isolation, server-side RBAC  
**Scale/Scope**: 2 seed companies (tenants), 4 roles (Super Admin, Company Admin, Supervisor, Sales User)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Multi-Tenant Data Isolation** - Confirm all data queries and writes are scoped by `company_id` at the data-access layer.
- [x] **Principle II: Role-Based Access Control** - Confirm server-side RBAC validation (deny-by-default) is enforced.
- [x] **Principle III: Arabic-First, RTL, Bilingual** - Confirm UI renders correctly in RTL using the Tajawal font.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-tenant-isolation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # API and Interface contract files
│   └── auth-api.md
└── tasks.md             # Phase 2 output (to be generated next)
```

### Source Code Layout

The project follows a unified Next.js App Router layout with a dedicated Supabase configuration folder:

```text
supabase/                # Supabase configurations & database migrations
├── migrations/          # SQL files containing table schemas, triggers, and RLS
├── tests/               # Database unit tests using pgTAP
└── seed.sql             # Tenant and test user seed data

src/
├── app/                 # Next.js pages, actions, and route handlers
│   ├── layout.tsx       # Root layout containing Tajawal font config & dir="rtl"
│   ├── middleware.ts    # Route guard: refreshes sessions and checks authentication
│   ├── (auth)/          # Unauthenticated authentication routes
│   │   ├── login/       # Login page
│   │   └── reset/       # Password reset instruction page
│   └── (dashboard)/     # Authenticated app shell and views
│       ├── layout.tsx   # Dashboard App Shell (sidebar + header with role-awareness)
│       └── page.tsx     # Scoped dashboard home
├── components/          # Shared components (sidebar, header, alerts, forms)
├── lib/                 # Shared utilities
│   ├── auth/            # Server actions & authorization middleware helpers
│   └── supabase/        # Factory functions for client-side and server-side Supabase clients
└── styles/
    └── globals.css      # Core Tailwind CSS and custom design tokens (Tajawal, colors)
```

**Structure Decision**: Unified Next.js single repository structure. Supabase CLI manages the local development database, schema migrations, and seeding, while the `src/` directory houses the TypeScript application code.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution check violations.
