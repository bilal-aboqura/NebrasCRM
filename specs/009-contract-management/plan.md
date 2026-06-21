# Implementation Plan: Contract Management

**Branch**: `009-contract-management` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-contract-management/spec.md`

---

## Summary

This feature implements the Contract Management system for the NEBRASGOO CRM. It allows deals won to be recorded as contracts linked to facilities and contacts (often generated directly from accepted offers), tracking values, periods, and payment terms. It also introduces secure document uploads (signed contract attachments) utilizing private Supabase Storage buckets.

Key features include:
1. **Supabase Schema, Triggers, & Storage**:
   - `contracts` and `contract_sequence_counters` tables in PostgreSQL.
   - Concurrency-safe unique reference generator: `CON-YYYY-XXXX`, scoped per company and calendar year, enforced via `UNIQUE` constraints and row-locking.
   - Immutability trigger protecting active, completed, or terminated contracts from direct edits.
   - Private Supabase Storage bucket `contracts` with RLS policies restricting file uploads/downloads to authorized tenant users with visibility access.
2. **Next.js Server Actions**:
   - CRUD actions on draft contracts, activation stage syncing (prompting facility stage transition to "Contract" using Feature 005 logic).
   - Management-only actions for completing and terminating contracts.
   - Secure document uploader and downloader Server Actions verifying permissions and generating 15-minute signed URLs.
3. **App Router UI**:
   - Facility details page tab listing contracts and addenda chains.
   - Global **"العقود" (Contracts)** directory page listing user-scoped contracts with filters and totals.
   - Contract editor supporting secure uploads, read-only active states, and manager-only completion actions.

---

## Technical Context

**Language/Version**: TypeScript (Node.js 18+ or 20+)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `postcss`, `lucide-react`  
**Storage**: Supabase (PostgreSQL + secure private Storage buckets) with Row Level Security (RLS)  
**Testing**: pgTAP (database schema, RLS, and storage RLS tests) + Vitest/Playwright (integration & UI flows)  
**Target Platform**: Next.js standalone build on a Linux VPS behind Nginx  
**Project Type**: web-service/web-app  
**Performance Goals**: First meaningful paint under 1.5s, list fetch latency under 200ms, signed URL generation under 500ms  
**Constraints**: Arabic-first RTL design, Tajawal typography, strict tenant isolation, server-side RBAC, immutable active contracts  
**Scale/Scope**: PDF/image attachments (up to 10MB), version addenda chain, 60-day warning settings, 15-min TTL URLs.

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
specs/009-contract-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist (Complete)
└── contracts/           # Phase 1 output
    └── contract-actions.md
```

### Source Code Layout

```text
supabase/
├── migrations/
│   └── 20260617000009_contract_management.sql  -- Database schema, contracts, sequence counters, triggers, constraints, RLS and private Storage policies
└── tests/
    └── 009-contract-management.test.sql        -- pgTAP unit tests for RLS, storage bucket RLS, sequence numbers, and active immutability

src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           ├── facilities/
│           │   └── [id]/
│           │       └── page.tsx                -- Updated to include ContractsSection
│           └── contracts/
│               └── page.tsx                    -- Dedicated Contracts directory list with filter and status summary
├── components/
│   ├── facilities/
│   │   └── ContractsSection.tsx                -- Lists a facility's contracts with references, values, periods, and status badges
│   └── contracts/
│       ├── ContractEditorModal.tsx             -- Modal form for creating/editing drafts, uploading signed PDFs, and initiating activation
│       └── TerminateContractModal.tsx          -- Modal form for managers to terminate active contracts with dates and reasons
├── lib/
│   ├── actions/
│   │   └── contracts.ts                        -- Next.js Server Actions for contracts, activations, completions, terminations, and storage operations
│   └── secure-storage.ts                       -- Reusable helper module for secure bucket uploads, permission checks, and signed URLs
```

**Structure Decision**: Unified Next.js single repository structure matching established patterns. Database modifications, Storage bucket configurations, and testing are managed via Supabase CLI in `supabase/`, and Next.js UI components/Server Actions live under `src/`.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution check violations.
