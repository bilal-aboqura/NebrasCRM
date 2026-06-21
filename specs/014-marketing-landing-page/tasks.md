# Tasks: Public Marketing Landing Page

**Input**: Design documents from `/specs/014-marketing-landing-page/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This feature does not touch authenticated, company-scoped, or RBAC-controlled database tables. All content is public and static, so no automated database isolation tests are required. Verification will be performed via Next.js compilation checks and manual verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initial configurations and design system setup

- [X] T001 Configure design system color tokens in [tailwind.config.ts](file:///f:/CodingProjects/NebrasCRM/tailwind.config.ts)
- [X] T002 Load Tajawal google font and assign its variable class in [layout.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/layout.tsx)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Route separation and dashboard relocation tasks (MUST be complete before starting user stories)

- [X] T003 [P] Update matcher patterns in [middleware.ts](file:///f:/CodingProjects/NebrasCRM/src/middleware.ts) to whitelist public landing routes
- [X] T004 Copy dashboard home page content to [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(dashboard)/dashboard/page.tsx)
- [X] T005 [P] Update post-login redirect path to `/dashboard` in [login-action.ts](file:///f:/CodingProjects/NebrasCRM/src/lib/auth/login-action.ts)
- [X] T006 [P] Update company brand root link to `/dashboard` in [Header.tsx](file:///f:/CodingProjects/NebrasCRM/src/components/Header.tsx)
- [X] T007 [P] Update Dashboard menu link to `/dashboard` in [SidebarNav.tsx](file:///f:/CodingProjects/NebrasCRM/src/components/SidebarNav.tsx)
- [X] T008 Delete old root page file [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(dashboard)/page.tsx)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Landing Page Navigation & Content (Priority: P1) 🎯 MVP

**Goal**: Implement the core landing page sections, sticky header, and layout structure

**Independent Test**: Navigate to `/`, verify all sections (Hero, Stats, Services, Features, Footer) render correctly in RTL Arabic, and verify that navigation links scroll smoothly.

### Implementation for User Story 1

- [X] T009 [P] [US1] Create public route layout file [layout.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/layout.tsx)
- [X] T010 [P] [US1] Create Google Tag Manager component [GtmPlaceholder.tsx](file:///f:/CodingProjects/NebrasCRM/src/components/GtmPlaceholder.tsx)
- [X] T011 [US1] Initialize page layout and static data structures in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)
- [X] T012 [US1] Build top contact bar layout in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)
- [X] T013 [US1] Build sticky header with responsive mobile hamburger drawer toggle in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)
- [X] T014 [US1] Build hero section with copy and custom CSS reception desk card in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)
- [X] T015 [US1] Build statistics bar in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)
- [X] T016 [US1] Build 7-card responsive services grid in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)
- [X] T017 [US1] Build 4-column trust feature section in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)
- [X] T018 [US1] Build lead capture placeholder and page footer sections in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)

**Checkpoint**: User Story 1 is functional and testable independently at the root URL.

---

## Phase 4: User Story 2 - Contacting & Social Engagement (Priority: P2)

**Goal**: Implement normalized, clickable contact details (phone, email, WhatsApp)

**Independent Test**: Click contact links; verify they open dialer, email composer, or WhatsApp chat with correct targets.

### Implementation for User Story 2

- [X] T019 [US2] Configure clickable tel, wa.me, and mailto schemas for contact assets in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)

**Checkpoint**: Contacting options are live and open external apps successfully.

---

## Phase 5: User Story 3 - CTA Action & CRM Access (Priority: P3)

**Goal**: Implement smooth scroll behavior for CTAs and CRM dashboard login navigation

**Independent Test**: Verify clicking "احجز تقييم" scrolls to lead form placeholder; verify clicking "دخول CRM" opens CRM login page.

### Implementation for User Story 3

- [X] T020 [US3] Implement scroll-behavior and button navigation handlers in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)

**Checkpoint**: All interactive navigation controls are validated and responsive.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final SEO tags and compilation quality check

- [X] T021 [P] Configure Arabic SEO metadata (titles, descriptions, Open Graph) in [page.tsx](file:///f:/CodingProjects/NebrasCRM/src/app/(public)/page.tsx)
- [X] T022 Run Next.js production build command `npm run build` to verify layout compilations
- [X] T023 Run manual verification checklist from [quickstart.md](file:///f:/CodingProjects/NebrasCRM/specs/014-marketing-landing-page/quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel or sequentially.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T001, T002).
- Foundational tasks T003, T005, T006, and T007 can run in parallel.
- Once Foundational phase completes, User Story 1 (P1) tasks T009 and T010 can run in parallel.
