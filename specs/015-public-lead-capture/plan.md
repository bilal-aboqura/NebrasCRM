# Implementation Plan: Public Lead Capture Form

**Branch**: `015-public-lead-capture` | **Date**: 2026-06-21 | **Spec**: [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/015-public-lead-capture/spec.md)
**Input**: Feature specification from [spec.md](file:///F:/CodingProjects/NebrasCRM/specs/015-public-lead-capture/spec.md)

## Summary

The public lead-capture form allows unauthenticated landing page visitors to request a free CBAHI readiness assessment. When submitted, the form invokes a secure, public Server Action. The Server Action rate-limits requests by IP, validates and sanitizes input data, normalizes the primary phone number, and performs a duplicate check across all CRM tenants. If the lead already exists, it is either reactivated (if archived) or gracefully rejected as a duplicate. If it is new, it is inserted into the facilities database as an unassigned facility mapped to the configured target company.

## Technical Context

**Language/Version**: TypeScript / Node.js v20+  
**Primary Dependencies**: Next.js 14 (App Router), React 18, TailwindCSS, Lucide React  
**Storage**: PostgreSQL / Supabase Memory Store (mock) in development; Server Action uses service role key to bypass client authentication RLS  
**Testing**: Vitest (`npm run test` using `vitest.config.ts`)  
**Target Platform**: Web (Next.js App Router)  
**Project Type**: Web Application  
**Performance Goals**: Submissions process in <1.5 seconds; rate-limit check resolves in <50ms  
**Constraints**: Maximum 5 submissions per IP per hour; no visitor authentication; zero internal system ID exposure  
**Scale/Scope**: Open to all public web traffic  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Principle I: Multi-Tenant Data Isolation** - Confirmed. All writes default to the `DEFAULT_LEAD_COMPANY_ID` environment variable context. Duplicate checks are run across all tenants because the phone number must be unique CRM-wide for this public portal.
- [ ] **Principle II: Role-Based Access Control** - Confirmed. This endpoint is public (unauthenticated) by design, but it implements strict, hardcoded server-side field-level writes. It cannot be used to modify arbitrary fields, assign users, or select arbitrary companies.
- [ ] **Principle III: Arabic-First, RTL, Bilingual** - Confirmed. The React form UI is fully localized in Arabic, follows RTL layout direction, uses the Tajawal font, and renders inline error messages in Arabic.

## Project Structure

### Documentation (this feature)

```text
specs/015-public-lead-capture/
├── plan.md              # This file
├── research.md          # Technology choices and resolution of unknowns
├── data-model.md        # Extended domain structures
├── quickstart.md        # Instructions for running and testing
└── contracts/           # API and data contracts
    └── submission.md    # Form submission interface contract
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (public)/
│   │   └── page.tsx            # Public landing page (Feature 014 component host)
│   └── api/
│       └── submit-lead/
│           └── route.ts        # Optional Route Handler fallback [NEW]
├── components/
│   └── public/
│       └── LeadCaptureForm.tsx # Public lead-capture form component [NEW]
├── lib/
│   ├── actions/
│   │   ├── facilities.ts       # CRM facility actions (existing)
│   │   └── lead-capture.ts     # Public unauthenticated Server Action [NEW]
│   ├── data/
│   │   └── store.ts            # Memory DB mock access (existing)
│   ├── utils/
│   │   └── phone.ts            # Phone normalization utility (existing)
│   └── rate-limit/
│       └── memory.ts           # In-memory IP rate limiter helper [NEW]
tests/
└── integration/
    └── public-lead-capture.test.ts # Public lead-capture integration tests [NEW]
```

**Structure Decision**: Next.js App Router (Option 2 style). The form component is placed in `src/components/public/` to keep page layout clean. The logic resides in a dedicated Server Action file at `src/lib/actions/lead-capture.ts` (using Supabase server/mock DB context) and a rate-limiting helper in `src/lib/rate-limit/memory.ts`.

## Complexity Tracking

*No violations of Constitution Check are present.*
