<!--
SYNC IMPACT REPORT
==================
- Version change: None -> 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. Multi-Tenant Data Isolation (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] -> II. Role-Based Access Control, Deny by Default
  - [PRINCIPLE_3_NAME] -> III. Arabic-First, RTL, Bilingual
  - [PRINCIPLE_4_NAME] -> IV. Design System is the Single Source of Truth
  - [PRINCIPLE_5_NAME] -> V. Code Quality / VI. Testing Standards (mandatory coverage areas) / VII. Performance / VIII. Security & Privacy / IX. Responsive & Accessible
- Added sections:
  - Design System (SECTION_2_NAME)
  - Architectural Constraints (SECTION_3_NAME)
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated: f:/CodingProjects/NebrasCRM/.specify/templates/plan-template.md
  - ✅ updated: f:/CodingProjects/NebrasCRM/.specify/templates/tasks-template.md
- Follow-up TODOs:
  - None
-->

# NEBRASGOO Platform Constitution

A single, unified, Arabic-first **multi-tenant platform** for **NEBRASGOO (نبراس الجودة)**. It combines three surfaces under one brand and one codebase:

1. A public marketing website (CBAHI / سباهي accreditation consulting).
2. A CBAHI self-assessment tool (readiness scoring + gap report).
3. An internal sales **CRM** for managing medical-facility leads through to contracts.

Two companies — **نبراس الجودة** and **تقنية الارتقاء** — operate as **separate tenants** within the same system, sharing one visual brand, with **strictly isolated data** keyed by `company_id`. This is one Multi-Tenant system, never two separate sites.

These principles govern every spec, plan, and task. When a downstream document conflicts with this constitution, the constitution wins.

## Core Principles

### I. Multi-Tenant Data Isolation (NON-NEGOTIABLE)
Every operational table MUST carry a `company_id`. Every read and write MUST be scoped to the authenticated user's company at the data-access layer — never relying on UI filtering alone. Cross-tenant data leakage is treated as a critical defect, not a bug. Only the `Super Admin` role may operate across tenants, and only through an explicit, audited company-switch action. No query, export, report, or API response may ever return another tenant's rows.

*Rationale: the entire commercial promise of the system is safe separation of two companies' customer data.*

### II. Role-Based Access Control, Deny by Default
Four roles MUST be enforced **server-side**: `Super Admin`, `Company Admin`, `Sales User`, `Supervisor`. Permissions are deny-by-default: an action is forbidden unless explicitly granted to the user's role and scoped to their company. The client UI may hide controls for convenience, but authorization MUST be re-checked on the server for every protected operation. A `Sales User` sees only records assigned to them; a `Supervisor` sees their company's team data; a `Company Admin` manages one company; a `Super Admin` manages all.

### III. Arabic-First, RTL, Bilingual
Arabic (`ar`) is the primary language; the default document direction is **RTL** (`dir="rtl"`, `lang="ar"`). All new UI MUST render correctly in RTL with the **Tajawal** typeface. User-facing copy MUST be externalized (no hardcoded strings buried in logic) so an English layer can be added. Numbers, dates, currency (SAR), and phone formats follow Saudi conventions.

### IV. Design System is the Single Source of Truth
All visual styling MUST come from the shared design tokens and components defined in the **Design System** section below. No ad-hoc colors, font sizes, or one-off component styles. New components extend the system; they do not bypass it. Every screen across the three surfaces MUST feel like one product.

### V. Code Quality
Code MUST be modular, readable, and free of duplication (DRY). Clear, intention-revealing names. Business logic separated from presentation. Tenant-scoping and authorization logic live in shared, reusable layers — never copy-pasted per feature. No dead code, no commented-out blocks merged to main, no secrets in source. Prefer typed interfaces and validated inputs at every boundary.

### VI. Testing Standards (mandatory coverage areas)
The following MUST have automated tests, regardless of stack:
- **Tenant isolation:** a user of company A can never read or mutate company B's data.
- **Authorization:** each role can do exactly what it is allowed and nothing more.
- **Critical CRM flows:** create lead → move through pipeline → schedule follow-up → log call → create offer → create contract.
- **Lead capture:** public assessment-booking form correctly creates a scoped lead.
Bug fixes MUST add a regression test. Tenant-isolation and authorization tests are blocking — a feature is not "done" without them.

### VII. Performance
List/table views MUST paginate (or virtualize) and MUST NOT load an entire tenant's dataset at once. Database access MUST be index-aware on `company_id` and common filter columns. Target: meaningful first paint under ~2s on a typical connection; list filtering feels instant (<300ms perceived). Avoid N+1 queries; batch related reads. Assets (fonts, images) are optimized and cached.

### VIII. Security & Privacy
Passwords MUST be hashed (never stored or logged in plaintext). All input is validated and sanitized server-side. Authorization is enforced on every protected route. Personal data (facility contacts, phone numbers) is never exposed in URLs, logs, or to other tenants. Sensitive actions (user creation, company creation, role changes, cross-tenant access) SHOULD be auditable.

### IX. Responsive & Accessible
Mobile-first responsive layouts are required for every screen (the source designs already define breakpoints at ~1050px and ~700px). Interactive elements MUST be keyboard-reachable, color contrast MUST meet WCAG AA, and form fields MUST have associated labels.

## Design System

The canonical brand is **deep green + gold on a warm cream base**. Earlier mockups included a navy CRM variant; it is hereby consolidated — navy is retired in favor of the green/ink scale below so the whole platform shares one identity.

### Color Tokens
```
/* Brand */
--green-900:  #003d2f;   /* primary brand, headings, primary buttons, sidebar */
--green-700:  #075540;   /* gradient partner for primary green */
--ink-900:    #071d33;   /* deepest surface: footer, dark panels */

/* Accent */
--gold-500:   #c4a35a;   /* primary accent, rings, highlights, secondary CTAs */
--gold-600:   #b58d3a;   /* gold hover / nav underline */
--gold-200:   #f1d796;   /* light gold for gradients & accent text on dark */

/* Neutrals */
--bg:         #fbfaf7;   /* page background (cream) */
--soft:       #f6f2e9;   /* soft tinted surfaces, stat tiles */
--surface:    #ffffff;   /* cards, panels, inputs */
--line:       #e7ddc9;   /* borders & dividers */
--text:       #102820;   /* body text */
--muted:      #68766f;   /* secondary text, captions */

/* Status */
--success:    #18a96b;
--warning:    #c38312;
--danger:     #d75151;
--info:       #286fd1;
```

### Typography
- **Family:** `Tajawal` (Google Fonts), fallback `Arial, sans-serif`.
- **Weights in use:** 400, 500, 700, 800, 900.
- **Display headings:** weight 800–900, color `--green-900`.
- **Section accent words:** color `--gold-500/600`.
- **Body:** weight 400–500, color `--text`, line-height ~1.8 for Arabic readability.
- **Captions/labels:** color `--muted`, weight 700–800.

### Shape, Spacing & Elevation
- **Radius:** pills `999px`; buttons/inputs `12–15px`; cards/panels `22–34px`.
- **Section padding:** ~42–70px desktop, ~18–28px mobile.
- **Shadows:** soft and layered, green-tinted, e.g. `0 18px 45px rgba(0,61,47,.07)`; stronger on hero/floating cards.
- **Borders:** 1px `--line` on cards and inputs is the default separator.

### Component Conventions
- **Buttons:** `primary` = green gradient (`--green-900 → --green-700`) on white text; `outline` = white bg, green border + green text; `accent` = gold bg on dark text. Weight 900, radius ~14px.
- **Status tags (CRM):** rounded `999px` pills, tinted background + matching text per lifecycle stage (new / contacted / interested / offer / contract / lost), mapped to the status palette.
- **Cards & panels:** white surface, 1px `--line` border, rounded, soft shadow.
- **Tables (CRM):** RTL, right-aligned cells, header background `#f7f9fc`, row dividers in `--line`, inline action buttons (call / WhatsApp).
- **Score ring (assessment):** circular `conic-gradient` in gold over a neutral track, percentage centered in `--green-900`.
- **Forms:** labeled fields, 1px `--line` borders, radius ~12px, full-width on mobile.

### Iconography & Voice
- Clean, professional, healthcare-quality tone. Arabic copy is formal-but-warm.
- Contact affordances (phone, WhatsApp `wa.me`, email) are first-class throughout the CRM.

## Architectural Constraints

- **One system, not many.** A single multi-tenant application serves all surfaces and both companies. No forking per company.
- **`company_id` everywhere.** Schema baseline tables: `companies`, `users`, `facilities`, `contacts`, `followups`, `offers`, `contracts`, `call_logs` — every operational table carries `company_id`.
- **Separation of concerns.** Public site, assessment tool, and CRM may share components and design tokens, but the assessment and lead-capture surfaces feed the CRM through a defined boundary (a lead/facility record), not by reaching into CRM internals.
- **Stack is decided in `/speckit.plan`, not here.** This constitution is stack-agnostic; it constrains *how* we build, not *what library* we build with.

## Governance

- This constitution supersedes conflicting practices. Specs (`/speckit.specify`), plans (`/speckit.plan`), and tasks (`/speckit.tasks`) MUST comply.
- **Amendments** require: a written rationale, a version bump, and an updated "Last Amended" date. Use semantic versioning — MAJOR for removing/redefining a principle, MINOR for adding a principle or section, PATCH for clarifications.
- **Compliance review:** every plan MUST include a short check confirming it respects Principles I, II, and III (isolation, RBAC, Arabic/RTL) before implementation begins.
- **Non-negotiables** (Principles I and II) cannot be waived by any single feature spec.

**Version**: 1.0.0 | **Ratified**: 2026-06-16 | **Last Amended**: 2026-06-16
