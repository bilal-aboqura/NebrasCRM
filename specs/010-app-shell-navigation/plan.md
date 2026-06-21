# Implementation Plan: App Shell Navigation & Routing Wires

**Branch**: `010-app-shell-navigation` | **Date**: 2026-06-17 | **Spec**: [spec.md](file:///f:/CodingProjects/NebrasCRM/specs/010-app-shell-navigation/spec.md)
**Input**: Feature specification from `specs/010-app-shell-navigation/spec.md`

## Summary

Build the role-aware app shell navigation linking all Features 001–009 pages together and updating the dashboard landing page at `/` with live statistics cards. Ensure direct click-to-view navigation from facilities table rows and pipeline cards.

## Technical Context

**Language/Version**: TypeScript / Node.js (Next.js 14, App Router)  
**Primary Dependencies**: Next.js (App Router), Supabase SSR (`@supabase/ssr`), Tailwind CSS, Lucide React (or custom SVG icons)  
**Storage**: PostgreSQL (Supabase database)  
**Testing**: Vitest (matching current test suite in `tests/integration/`)  
**Target Platform**: Modern browsers (Edge, Chrome, Safari, Firefox), mobile and desktop responsive, RTL layout  
**Project Type**: Web Application  
**Performance Goals**: List navigation feels instant; stats cards query execution completes in < 200ms; client-side route transitions < 150ms.  
**Constraints**: strictly isolated multi-company database access (RLS policies already handle this).  
**Scale/Scope**: 1 main authenticated app shell with 8 pages, 4 live query counts on dashboard.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Principle I: Multi-Tenant Data Isolation** - All database queries for dashboard counts are run via the Supabase client under the authenticated user session, fully respecting tenant RLS isolation.
- [ ] **Principle II: Role-Based Access Control** - Sidebar navigation items and the company switcher are hidden or shown on the server/client based on the user's role claim. Server-side page guards (already implemented) prevent direct URL bypasses.
- [ ] **Principle III: Arabic-First, RTL, Bilingual** - Nav bar links, header labels, stats cards, and role badges are rendered in Arabic with RTL direction (`dir="rtl"`) using the `Tajawal` typeface and the green/gold color system.

## Project Structure

### Documentation (this feature)

```text
specs/010-app-shell-navigation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code

```text
src/
├── components/
│   ├── Sidebar.tsx      # Main server sidebar (authenticates role, renders client navigation)
│   ├── SidebarNav.tsx   # [NEW] Client component for dynamic active link highlighting
│   ├── Header.tsx       # Main header displaying logo, company name, user metadata, logout button
│   └── CompanySwitcher.tsx # Multi-company switcher component (rendered for Super Admin)
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx     # Replaces the default welcome view with the live summary cards
│   │   └── dashboard/
│   │       ├── facilities/
│   │       │   ├── page.tsx          # Facilities list wrapper
│   │       │   └── FacilitiesClient.tsx # Facilites list interactive table rows
│   └── middleware.ts    # Middleware handling session and redirect logic
```

**Structure Decision**: Next.js App Router project utilizing standard `src/components/` and `src/app/` layout directories. We will modify existing shell layout files, insert `SidebarNav.tsx` as a new client component to enable client-side path matching, and update the dashboard landing page at `src/app/(dashboard)/page.tsx`.

## Complexity Tracking

*No violations identified. The design is simple, reuse-oriented, and introduces no new tables or database structures.*
