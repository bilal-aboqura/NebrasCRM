# Implementation Plan: Public Marketing Landing Page

**Branch**: `014-marketing-landing-page` | **Date**: 2026-06-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-marketing-landing-page/spec.md`

## Summary
Build the public-facing marketing landing page for NEBRASGOO at the root route `/` using Next.js (App Router), TypeScript, and TailwindCSS. The implementation separates public routes from the authenticated CRM by introducing a `(public)` route group with its own layout, moving the dashboard home page to `/dashboard`, updating navigation links/redirects in CRM layouts, and updating the auth middleware to prevent interception of public routes.

## Technical Context

**Language/Version**: Next.js 14 (App Router), TypeScript (Node.js v20+)  
**Primary Dependencies**: React 18, TailwindCSS, Lucide React, `next/font/google`  
**Storage**: N/A (Static marketing page)  
**Testing**: Vitest  
**Target Platform**: Linux VPS  
**Project Type**: web-service  
**Performance Goals**: Lighthouse performance score >90, First Contentful Paint (FCP) < 1.5s  
**Constraints**: RTL layout, Tajawal font loading, responsive at 700px/1050px breakpoints  
**Scale/Scope**: Single page with 8 static sections plus CRM redirect/layout changes  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Principle I: Multi-Tenant Data Isolation** - Pass. The page contains static content only and does not perform database queries or mutations.
- [ ] **Principle II: Role-Based Access Control** - Pass. Public page requires no authentication. The auth middleware matches and protects `/dashboard` and `/admin` while whitelisting the root route `/` and static assets.
- [ ] **Principle III: Arabic-First, RTL, Bilingual** - Pass. Root layout sets `lang="ar"` and `dir="rtl"`. Fonts loaded using Google Font Tajawal optimized via next/font.

## Project Structure

### Documentation (this feature)

```text
specs/014-marketing-landing-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── routing.md       # URL mapping and scroll anchors
```

### Source Code

```text
src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx     # Public marketing layout (no dashboard sidebar/header)
│   │   └── page.tsx       # Marketing landing page (sections 1-8)
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx   # Authenticated CRM dashboard home (moved from app/(dashboard)/page.tsx)
│   │   └── layout.tsx
│   ├── layout.tsx         # Root layout (updates for Tajawal font loading)
│   └── middleware.ts      # Routing & auth middleware config
├── components/
│   ├── Header.tsx         # CRM Header link fix (href="/" -> "/dashboard")
│   ├── SidebarNav.tsx     # CRM Sidebar link fix (href="/" -> "/dashboard")
│   └── GtmPlaceholder.tsx # GTM Script Injection Component
└── tailwind.config.ts     # Design tokens sync (constitution color scheme)
```

**Structure Decision**: Single Next.js web application with route groups `(public)` and `(dashboard)` separating layouts.
