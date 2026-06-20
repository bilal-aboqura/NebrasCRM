# Implementation Plan: CBAHI Self-Assessment Tool

**Branch**: `016-cbahi-self-assessment` | **Date**: 2026-06-21 | **Spec**: [spec.md](file:///f:/CodingProjects/NebrasCRM/specs/016-cbahi-self-assessment/spec.md)
**Input**: Feature specification from `/specs/016-cbahi-self-assessment/spec.md`

## Summary

Build the CBAHI Self-Assessment Tool at the public route `/assessment`. It is a client-side-only interactive questionnaire that lets visitors (public leads) and authenticated consultants evaluate a healthcare facility's readiness for CBAHI accreditation chapter-by-chapter. The tool calculates compliance scores and lists gaps (scored 0, 0.5, or unanswered) up to a maximum of 25. It will run entirely in React state (no database/localStorage writes) and supports a customized print-friendly layout. It introduces a public `(public)` route group with its layout to organize public headers, navigation, and footers.

## Technical Context

**Language/Version**: TypeScript / Node.js v20+  
**Primary Dependencies**: Next.js 14 (App Router), React 18, TailwindCSS, Lucide React  
**Storage**: N/A (Ephemeral client-side React state, no database or localStorage)  
**Testing**: Vitest  
**Target Platform**: Web browsers (Mobile, Tablet, Desktop responsive)  
**Project Type**: Web Application Component  
**Performance Goals**: Page loads under 2s, interactive state/scoring updates <50ms  
**Constraints**: Fully public route, bypassed by auth middleware, RTL Arabic layout with Tajawal font  
**Scale/Scope**: 1 route, 2 facility types, 11/6 chapters, 33/23 items, maximum of 25 gaps displayed  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Multi-Tenant Data Isolation** - Pass. This is a public client-side-only assessment tool with no database operations or tenant-scoping in this phase.
- [x] **Principle II: Role-Based Access Control** - Pass. The page is completely public, bypasses CRM authentication, and can be accessed by both visitors and logged-in consultants.
- [x] **Principle III: Arabic-First, RTL, Bilingual** - Pass. The page will be rendered in RTL layout utilizing Arabic terminology and the Google Font Tajawal.

## Project Structure

### Documentation (this feature)

```text
specs/016-cbahi-self-assessment/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (design decisions)
├── data-model.md        # Phase 1 output (static and session state schemas)
├── quickstart.md        # Phase 1 output (how to run and test)
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── contracts/
    └── url-redirect.md  # CTA URL parameters redirect contract
```

### Source Code

```text
src/
├── app/
│   └── (public)/
│       ├── layout.tsx                # Public navigation header and footer layout
│       └── assessment/
│           └── page.tsx              # Public assessment page container
├── components/
│   └── assessment/
│       ├── FacilitySelector.tsx      # Toggle component for General vs Dental complexes
│       ├── AssessmentPanel.tsx       # Chapter filter dropdown and questions listing
│       ├── ScoringSidebar.tsx        # Ephemeral circular progress ring and action buttons
│       └── GapReportSection.tsx      # Summary card and gap analysis table (with CTA)
├── hooks/
│   └── use-cbahi-session.ts          # Custom React state hook for assessment session
├── lib/
│   └── data/
│       └── cbahi-data.ts             # Static CBAHI questions and criteria constant
└── tests/
    └── 016-cbahi-self-assessment.test.ts # Unit and interactive flow tests
```

**Structure Decision**: Single Next.js web application utilizing route groups `(public)` and `(dashboard)` to isolate public landing/assessment pages from authenticated CRM modules.

## Complexity Tracking

*No Constitution Check violations are present. All principles have been adhered to.*
