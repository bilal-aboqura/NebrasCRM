# Implementation Plan: Contact Management

**Branch**: `004-contact-management` | **Date**: 2026-06-16 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/004-contact-management/spec.md)
**Input**: Feature specification from `/specs/004-contact-management/spec.md`

## Summary

This feature adds contact management to the NEBRASGOO CRM, enabling sales representatives and managers to maintain a directory of decision-makers linked to medical facilities. Contacts inherit the visibility and multi-tenant isolation parameters of their parent facilities. The database constraints enforce a strict "at most one primary contact" rule per facility, handled via atomic transactions. The interface integrates directly into the existing facility detail hub, utilizing RTL, the Tajawal typeface, and communication affordances (tel: and WhatsApp chat integration).

## Technical Context

**Language/Version**: TypeScript (Node.js 18+ or 20+)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `postcss`, `lucide-react`  
**Storage**: Supabase (PostgreSQL) with Row Level Security (RLS)  
**Testing**: pgTAP (database unit tests) + Vitest/Playwright (integration & UI flows)  
**Target Platform**: Next.js standalone build on a Linux VPS behind Nginx  
**Project Type**: web-service/web-app  
**Performance Goals**: Contact list loading under 300ms, atomic transaction execution under 100ms  
**Constraints**: Arabic-first RTL design, Tajawal typography, strict data isolation, server-side RBAC  
**Scale/Scope**: Scoped per company tenant, 4 roles, multiple contacts per facility, at most 1 primary contact  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Multi-Tenant Data Isolation** - Confirm all data queries and writes are scoped by `company_id` at the data-access layer.
- [x] **Principle II: Role-Based Access Control** - Confirm server-side RBAC validation (deny-by-default) is enforced.
- [x] **Principle III: Arabic-First, RTL, Bilingual** - Confirm UI renders correctly in RTL using the Tajawal font.

## Project Structure

### Documentation (this feature)

```text
specs/004-contact-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── contact-actions.md
└── tasks.md             # Phase 2 output (to be generated next)
```

### Source Code Layout

```text
supabase/
├── migrations/
│   └── 20260616000002_contact_management.sql -- Schema changes, RLS, partial index, activity logs seed
└── tests/
    └── 004-contact-management.test.sql       -- pgTAP unit tests for contacts RLS & invariants

src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── facilities/
│               └── [id]/
│                   └── page.tsx                -- Integrated contacts section and action hubs
├── components/
│   └── facilities/
│       ├── ContactsSection.tsx                 -- Renders list, highlight primary contact, actions (call, WhatsApp)
│       ├── ContactForm.tsx                     -- Add & edit modal form for contacts
│       └── ArchivedContactsModal.tsx           -- Modal to view and recover archived contacts
├── lib/
│   ├── actions/
│   │   └── contacts.ts                         -- Server Actions for contact CRUD & transactions (primary toggles)
│   └── utils/
│       └── phone.ts                            -- Reused shared phone normalization utility
```

**Structure Decision**: Next.js App Router single repository structure matching Feature 003, using Next Server Actions for CRUD operations and transaction triggers. Database RLS and constraints are enforced in a versioned Postgres migration file.

## Complexity Tracking

No constitution check violations.
