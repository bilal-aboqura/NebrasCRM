# Implementation Plan: Offer (Quote) Management

**Branch**: `008-offer-management` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-offer-management/spec.md`

---

## Summary

This feature implements the Offer (Quote) Management system for the NEBRASGOO CRM. It allows representatives to create and manage commercial proposals (quotes) for medical facilities, tracking monetary value, discounts, taxes, and validity, while keeping version histories and recording customer decisions (Accept/Reject).

Key features include:
1. **Supabase Schema & Triggers**:
   - `offers` and `offer_line_items` tables with strict RLS isolation by `company_id`.
   - Sequential version integrity constraint: `UNIQUE (company_id, root_offer_id, version)`.
   - Automatic database triggers that compute subtotals, discount amounts, tax amounts, and grand totals server-side, preventing negative totals.
   - An immutability trigger preventing modification of sent/decided offers.
2. **Next.js App Router UI**:
   - Offers list on the **Facility Detail** page, showing version chains, statuses, and values.
   - A global **"العروض" (Offers)** directory showing all active offers filterable by status and owner, with summary totals.
   - An **Offer Editor** for draft offers supporting line item additions, discount type toggling (fixed vs percentage), tax rate override (default 15%), and contacts lookup.
   - A standalone **Print Route** (`/dashboard/offers/[offerId]/print`) optimized for browser-native print-to-PDF (`@media print` in CSS) to support correct Arabic RTL text shaping.
3. **Transition Prompt on Acceptance**:
   - Reuses the Feature 005 terminal-stage confirmation prompt to guide users to manually advance a facility's stage when an offer is accepted.
4. **Derived Archival Visibility**:
   - Filters out offers whose parent facility is soft-archived via database joins instead of cascading updates, preventing the cascade-restore hazard.

---

## Technical Context

**Language/Version**: TypeScript (Node.js 18+ or 20+)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `postcss`, `lucide-react`  
**Storage**: Supabase (PostgreSQL) with Row Level Security (RLS)  
**Testing**: pgTAP (database unit tests) + Vitest/Playwright (integration & UI flows)  
**Target Platform**: Next.js standalone build on a Linux VPS behind Nginx  
**Project Type**: web-service/web-app  
**Performance Goals**: First meaningful paint under 1.5s, list fetch latency under 200ms, print page load under 1s  
**Constraints**: Arabic-first RTL design, Tajawal typography, strict tenant isolation, server-side math validation, browser-native print  
**Scale/Scope**: Multi-line item quotes, 2 tenants, 4 user roles, version lineage tree.

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
specs/008-offer-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist (Complete)
└── contracts/           # Phase 1 output
    └── offer-actions.md
```

### Source Code Layout

```text
supabase/
├── migrations/
│   └── 20260617000008_offer_management.sql     -- Database schema, offers, offer_line_items, triggers, constraints, RLS policies
└── tests/
    └── 008-offer-management.test.sql           -- pgTAP unit tests for RLS, math correctness, revisions, and archival behavior

src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           ├── facilities/
│           │   └── [id]/
│           │       └── page.tsx                -- Updated to include OffersSection
│           └── offers/
│               ├── page.tsx                    -- Dedicated "العروض" view for active offers with filters and totals
│               └── [offerId]/
│                   └── print/
│                       └── page.tsx            -- Standalone print route optimized for native browser printing (Ctrl+P)
├── components/
│   ├── facilities/
│   │   └── OffersSection.tsx                   -- Lists a facility's offers grouped by version chain, showing statuses and values
│   └── offers/
│       ├── OfferEditorModal.tsx                -- Modal form for creating/editing draft offers (add/remove lines, discounts, tax override)
│       └── RecordDecisionModal.tsx             -- Modal form to record client's accept/reject decision with notes
├── lib/
│   └── actions/
│       └── offers.ts                           -- Next.js Server Actions for offers, revisions, decisions, archiving, and RLS checks
```

**Structure Decision**: Unified Next.js single repository structure matching established patterns. Database modifications and testing are managed via Supabase CLI in `supabase/`, and Next.js UI components/Server Actions live under `src/`.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution check violations.
