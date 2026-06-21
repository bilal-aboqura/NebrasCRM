# Implementation Plan: Call and Communication Logging

**Branch**: `007-call-logging` | **Date**: 2026-06-16 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/007-call-logging/spec.md)
**Input**: Feature specification from `/specs/007-call-logging/spec.md`

---

## Summary

This feature implements manual call and communication logging (Call Logs) for facilities and contacts in the NEBRASGOO CRM. It builds on the existing multi-tenant isolation and role-based access control models. 

Key features include:
1. A new `call_logs` table in Supabase (PostgreSQL) with `company_id` for strict RLS isolation, cascading deletes on facility deletion, and validation checks ensuring linked contacts/follow-ups belong to the parent facility.
2. An outcome-aware follow-up completion integration: completing a call log offers to atomically close its linked follow-up, using the default toggle checked for success outcomes (answered, callback_requested) and unchecked for no-answers (busy, no_answer).
3. A Next.js App Router UI including:
   - A scrollable, chronological, paginated history of communications on the Facility detail page.
   - A manual "تسجيل اتصال" (Log Communication) modal.
   - A focus-triggered `QuickLogBanner` that prompts users to log call outcomes when returning to the CRM tab after clicking click-to-call (`tel:`) or WhatsApp (`wa.me`) affordances.
4. Auditable timeline logs written in Arabic for call log creation, editing, and soft-archiving/recovery.
5. Server-enforced edit constraints: creators are locked from editing outcome, notes, and duration after a strict 24-hour window, while managers (`Supervisor`, `Company Admin`, `Super Admin`) retain edit rights indefinitely.

---

## Technical Context

**Language/Version**: TypeScript (Node.js 18+ or 20+)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `postcss`, `lucide-react`  
**Storage**: Supabase (PostgreSQL) with Row Level Security (RLS)  
**Testing**: pgTAP (database unit tests) + Vitest/Playwright (integration & UI flows)  
**Target Platform**: Next.js standalone build on a Linux VPS behind Nginx  
**Project Type**: web-service/web-app  
**Performance Goals**: First meaningful paint under 2s, list fetch latency under 200ms, instant banner trigger  
**Constraints**: Arabic-first RTL design, Tajawal typography, strict data isolation, server-side RBAC, manual-only logging  
**Scale/Scope**: 2 seed companies (tenants), 4 roles (Super Admin, Company Admin, Supervisor, Sales User), facility contacts, follow-up links, 24h edit window.

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
specs/007-call-logging/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist (Complete)
└── contracts/           # Phase 1 output
    └── call-actions.md
```

### Source Code Layout

```text
supabase/
├── migrations/
│   └── 20260616000005_call_logging.sql         -- Schema modifications, call_logs table, validation trigger, RLS policies
└── tests/
    └── 007-call-logging.test.sql               -- pgTAP unit tests for RLS isolation, cross-facility/cross-company FK validation, and edit lock windows

src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── facilities/
│               └── [id]/
│                   └── page.tsx                -- Updated detail view incorporating CallLogsSection and QuickLogBanner
├── components/
│   └── facilities/
│       ├── CallLogsSection.tsx                 -- Chronological list of call logs on the facility detail page
│       ├── LogCommunicationModal.tsx           -- Manual log form (channel, direction, outcome, duration, outcome-aware completion toggle, notes)
│       └── QuickLogBanner.tsx                  -- Tab focus-triggered overlay banner (pre-fills context, saves or dismisses, does not block)
├── lib/
│   └── actions/
│       ├── call-logs.ts                        -- Server Actions for call log CRUD, soft-archiving/recovery, and RLS checks
│       └── followups.ts                        -- Updated completion logic to allow atomic call log creation
```

**Structure Decision**: Unified Next.js single repository structure matching established patterns. Database modifications and testing are managed via Supabase CLI in `supabase/`, and Next.js UI components/Server Actions live under `src/`.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution check violations.
