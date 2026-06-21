# Implementation Plan: Assessment Persistence and CRM Linking

**Branch**: `017-assessment-persistence` | **Date**: 2026-06-21 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/017-assessment-persistence/spec.md)
**Input**: Feature specification from `/specs/017-assessment-persistence/spec.md`

## Summary

This feature implements persistent storage for CBAHI self-assessments inside the NebrasCRM platform. Users (consultants, managers, supervisors) will be able to save completed assessments, link them to specific facilities, view assessment history and scores/trends on the facility detail page, and trigger new assessments with pre-linked metadata. The solution uses Next.js Server Actions, Supabase PostgreSQL, and strict multi-tenant Row Level Security (RLS) to ensure data isolation.

## Technical Context

**Language/Version**: TypeScript / Node.js v20+  
**Primary Dependencies**: Next.js 14 (App Router), TailwindCSS, Lucide React, React 18  
**Storage**: PostgreSQL (Supabase) + pg_cron/pgTAP for database validation  
**Testing**: Vitest for server logic/actions, PG unit tests for RLS  
**Target Platform**: Node.js VPS deployment behind Nginx  
**Project Type**: Multi-tenant Web Application  
**Performance Goals**: DB queries under 50ms, page load time under 200ms, save actions under 3s  
**Constraints**: Zero cross-tenant leakage, Arabic-first RTL rendering, strict immutability of historical assessments  
**Scale/Scope**: ~10k+ assessments, supporting up to 100+ concurrent consultants auditing facilities  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Principle I: Multi-Tenant Data Isolation** - Confirm all data queries and writes are scoped by `company_id` at the data-access layer.
- [ ] **Principle II: Role-Based Access Control** - Confirm server-side RBAC validation (deny-by-default) is enforced.
- [ ] **Principle III: Arabic-First, RTL, Bilingual** - Confirm UI renders correctly in RTL using the Tajawal font.

## Project Structure

### Documentation (this feature)

```text
specs/017-assessment-persistence/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── facilities/
│   │           └── [id]/            # Extended facility detail page
│   └── (public)/
│       └── assessment/              # Extended assessment page with conditional UI
├── components/
│   ├── assessment/
│   │   ├── FacilitySelector.tsx     # New facility picker for direct assessments
│   │   ├── SavedAssessmentModal.tsx # Read-only view for historical assessments
│   │   └── SaveAssessmentButton.tsx # Save button conditional on auth
│   └── facilities/
│       └── SelfAssessmentHistory.tsx# New history section component on facility detail page
├── lib/
│   ├── actions/
│   │   └── assessment-actions.ts    # Server actions for saving/archiving assessments
│   └── types/
│       └── assessment.ts            # Assessment interfaces and types
supabase/
└── migrations/
    └── 20260621000000_create_assessments_table.sql # Migration for assessments table + RLS
tests/
└── 017-assessment-persistence.test.ts # Automation tests for tenant isolation & server-side score validation
```

**Structure Decision**: Single Next.js web application utilizing existing App Router conventions, sharing the `src/` hierarchy and Supabase migration folders.

## Complexity Tracking

*No violations of the Constitution identified. The design strictly conforms to all principles.*
