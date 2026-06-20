# Feature Specification: Public Marketing Landing Page

**Feature Branch**: `014-marketing-landing-page`  
**Created**: 2026-06-21  
**Status**: Draft  
**Input**: User description: "Build the public-facing marketing landing page for NEBRASGOO. This is the unauthenticated entry point — the website visitors see before logging in. It presents the company's CBAHI accreditation consulting services, builds trust, and drives visitors toward two conversion actions: booking a free readiness assessment, and contacting a consultant. It is based on the client's existing home.html mockup. This feature is independent of the CRM (no auth required) but shares the same Next.js project, design tokens, and Tajawal/RTL styling."

## Clarifications

### Session 2026-06-21

- Q: How should the navigation menu links in the sticky header behave on mobile viewports (under 700px)? → A: Collapse into a standard mobile hamburger menu toggle that opens a drawer/overlay menu.
- Q: Do we need to integrate or prepare placeholders for web analytics (e.g., Google Analytics, Meta Pixel) or custom event tracking for button clicks? → A: Include standard placeholders/scripts for Google Tag Manager / Google Analytics.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Landing Page Navigation & Content Consumption (Priority: P1)

As a website visitor, I want to view the landing page sections (Hero, Services, Features, Stats, Footer) and navigate between them using smooth-scroll links, so that I can learn about NEBRASGOO's CBAHI accreditation consulting services.

**Why this priority**: This is the core purpose of the landing page. Visitors must be able to read about the company's services and value propositions to establish trust.

**Independent Test**: Can be fully tested by loading the root URL, verifying all sections display correctly, and clicking the nav links to verify smooth scrolling.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to the root landing page, **When** the page loads, **Then** the layout displays in Arabic (RTL) using Tajawal font, with a sticky header and sections for Hero, Stats, Services, Features, and Footer.
2. **Given** the visitor is on the landing page, **When** they click any navigation link (الرئيسية, عن نبراسكو, خدماتنا, تواصل معنا), **Then** the browser performs a smooth scroll to the corresponding section.

---

### User Story 2 - Contacting & Social Engagement (Priority: P2)

As a medical facility representative, I want to quickly call, email, or message NEBRASGOO via WhatsApp using clickable links in the top bar and footer, so that I can easily reach out for custom inquiries.

**Why this priority**: High priority as it directly drives secondary lead conversion (contacting a consultant).

**Independent Test**: Can be tested by clicking the phone, email, and WhatsApp links, verifying that they open the respective native apps (dialer, mail client, WhatsApp) with correct pre-filled values.

**Acceptance Scenarios**:

1. **Given** the visitor is viewing the contact bar or footer, **When** they click the phone link (+966 50 265 8846), **Then** it triggers a dial action to that number.
2. **Given** the visitor is viewing the contact bar or footer, **When** they click the WhatsApp link (+966 53 537 0955), **Then** it opens a WhatsApp chat window pointing to that number.

---

### User Story 3 - Call-To-Action Scroll & CRM Access (Priority: P3)

As a visitor interested in a readiness assessment or logging into the CRM, I want to click the CTA buttons to smooth-scroll directly to the assessment/contact sections or click the CRM link to navigate to the CRM login page.

**Why this priority**: Medium priority. Leads who want to book an assessment need to find the form section quickly, and existing CRM users need an entry point.

**Independent Test**: Can be tested by clicking the hero CTA buttons and the "دخول CRM" button, verifying correct navigation.

**Acceptance Scenarios**:

1. **Given** the visitor clicks "احجز تقييم جاهزية مجاني", **When** clicked, **Then** the page smooth-scrolls to the lead capture placeholder section.
2. **Given** the visitor clicks "دخول CRM", **When** clicked, **Then** the browser navigates to the CRM login page path.

---

### Edge Cases

- **Mobile Viewports (under 700px)**: The navigation bar MUST collapse into a standard mobile hamburger menu toggle that opens an overlay/drawer menu for navigation links, ensuring the layout does not break and remains fully usable.
- **Desktop Viewports without Native Apps**: Clicking phone or WhatsApp links on a desktop device must fail gracefully or open standard web fallbacks (e.g., wa.me web redirect).
- **Service Detail Placeholders**: Clicking "المزيد" links on the service cards must be handled gracefully since detail pages are out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render the public-facing landing page at the root route (`/`) without requiring authentication.
- **FR-002**: The layout MUST support Right-to-Left (RTL) reading order, use the Tajawal font, and adhere to the brand's color palette (deep green `#003d2f`, gold `#c4a35a`, and cream `#fbfaf7`).
- **FR-003**: The system MUST display a top contact bar showing phone (☎ +966 50 265 8846), WhatsApp (💬 +966 53 537 0955), email (✉ NEBRASGOO@GMAIL.COM), and the tagline "جودة اليوم .. اعتماد الغد".
- **FR-004**: The header MUST be sticky and include: the NEBRASGOO logo mark ("N" in a gold-bordered circle), the company name, the subtitle "نبراس الجودة للتميز والاعتماد الصحي", nav links (الرئيسية, عن نبراسكو, خدماتنا, تواصل معنا), and a "دخول CRM" button linking to the CRM login page.
- **FR-005**: The Hero section MUST show a trust badge ("شريكك الموثوق في الجودة والاعتماد"), the main headline ("شريككم نحو اعتماد سباهي والتميز في الجودة الصحية"), a description of services, CTA buttons, and a visual branding element (reception-desk styled card).
- **FR-006**: The Statistics bar MUST show the static key numbers: +65 medical facilities supported, +15 years of experience, +2 hospitals supported, and +100 successfully completed projects.
- **FR-007**: The Services section MUST present a responsive grid of 7 service cards with relevant visual indicators/emojis, titles, descriptions, and "المزيد" placeholder links.
- **FR-008**: The "المزيد" links in the Services grid MUST smooth-scroll the visitor down to the contact form/consultant section (acting as a secondary call-to-action).
- **FR-009**: The Features/Trust section MUST display a 4-column row highlighting: certified experts, custom solutions, continuous support, and professional confidentiality.
- **FR-010**: The Lead Capture section MUST display a clear heading "احجز تقييم جاهزية مجاني", a description, and a visual placeholder area designating where the Feature 014 form will be embedded.
- **FR-011**: The Footer MUST display NEBRASGOO branding, a brief summary of services, and repeating contact links (phone, WhatsApp, email) with a dark background.
- **FR-012**: The page MUST include standard environment-driven script placeholders for Google Tag Manager (GTM) or Google Analytics (GA) inside the HTML head and body tags.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The landing page loads in under 1.5 seconds on a standard desktop connection and under 2.5 seconds on 3G mobile connections (static resources only).
- **SC-002**: 100% of interactive elements (navigation links, CTAs, contact links) are functional and perform their designated action (smooth scroll, redirect, or external app launch).
- **SC-003**: The design is fully responsive and free of horizontal scroll overflows across desktop (>= 1200px), tablet (1050px), and mobile (700px) viewport widths.

## Assumptions

- The landing page is Arabic-only.
- All contact details (phone, email, WhatsApp) provided in the mockup are correct and active.
- The CRM login page path is `/login` or `/auth/login` and is accessible from the root domain.
- The visual assets for the reception-desk mockup and logo will be styled using Tailwind/CSS without requiring custom external media files, or will use generated static placeholder graphics.
