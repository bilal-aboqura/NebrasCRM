# Implementation Plan: Sales Pipeline Board

**Branch**: `005-sales-pipeline` | **Date**: 2026-06-16 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/005-sales-pipeline/spec.md)
**Input**: Feature specification from `/specs/005-sales-pipeline/spec.md`

---

## Summary

This feature implements the sales pipeline board for the NEBRASGOO CRM, providing a visual, drag-and-drop kanban view of medical facilities across their seven lifecycle stages. It functions as a view and interaction layer over the existing facility status field without introducing new core entities. It maintains the system's strict tenant isolation, role-based access rules, Arabic-first RTL design system, and responsive web principles.

Key technical deliverables include:
- A database schema migration adding `lost_reason` and `status_changed_at` fields to `facilities`, and database triggers to track updates.
- Server-side validation of all moves utilizing the same permissions and tenant-scoping checks as Feature 003.
- An accessible drag-and-drop UI with touch support, keyboard falls, and a tabbed single-column view on mobile screens.
- Inline confirmation dialogs for terminal moves (Won / Lost) to capture metrics (e.g. loss reasons).

---

## Technical Context

**Language/Version**: TypeScript (Node.js 18+ or 20+)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `postcss`, `lucide-react`  
**Storage**: Supabase (PostgreSQL) with Row Level Security (RLS)  
**Testing**: pgTAP (database RLS and schema tests) + Vitest/Playwright (integration & E2E flows)  
**Target Platform**: Next.js standalone build on a Linux VPS behind Nginx  
**Project Type**: web-service/web-app  
**Performance Goals**: Initial column query load under 1.5s; drag-drop mutation and logging complete under 500ms  
**Constraints**: Arabic-first RTL layout, Tajawal typography, strict multi-tenant isolation, server-side RBAC, keyboard/screen-reader accessibility  
**Scale/Scope**: ~10-20 pipeline cards loaded initially per column, lazy pagination via "Load More" controls  

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
specs/005-sales-pipeline/
├── plan.md              # This file
├── research.md          # Phase 0 output: Drag-and-drop accessibility, layout choices
├── data-model.md        # Phase 1 output: Schema additions and entity relations
├── quickstart.md        # Phase 1 output: Local migrations, local seeding, and running tests
├── checklists/
│   └── requirements.md  # Quality verification checklist
└── contracts/           # API and Interface contract files
    └── pipeline-actions.md
```

### Source Code Layout

```text
supabase/
├── migrations/
│   └── 20260616000003_pipeline_lost_reason.sql -- Schema extension: lost_reason enum & status_changed_at field/trigger
└── tests/
    └── 005-sales-pipeline.test.sql             -- pgTAP tests verifying tenant-isolated status transitions and RLS

src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── pipeline/
│               └── page.tsx                    -- Pipeline Board page handler (data fetching & layout container)
├── components/
│   └── pipeline/
│       ├── KanbanBoard.tsx                     -- Grid wrapper managing columns, drag-drop state, and mobile switcher
│       ├── KanbanColumn.tsx                    -- Single stage column displaying cards, header counts, and pagination
│       ├── KanbanCard.tsx                      -- Component showing facility metadata, communications, and tap menu action
│       ├── ConfirmTerminalModal.tsx            -- Dialog for won/lost confirmations, capturing lost_reason if Lost
│       └── MobileTabbedHeader.tsx              -- Swipeable/scrollable RTL stage tab selector for viewport < 700px
├── lib/
│   ├── actions/
│   │   └── pipeline.ts                         -- Server actions handling status updates, lost_reason storage, and activity logging
│   └── utils/
│       └── pipeline.ts                         -- Helper utilities for drag event mapping and accessible fallbacks
```

**Structure Decision**: Unified Next.js single repository structure matching Features 001–004. Schema changes are managed via versioned migration files in `supabase/migrations/` and verified with pgTAP tests. Application-level actions and React components reside under `src/`.

---

## Complexity Tracking

No constitution check violations.
