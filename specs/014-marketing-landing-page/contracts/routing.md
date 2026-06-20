# Integration Contracts & URL Routing: Public Marketing Landing Page

This document defines the routing boundaries and page anchors required for integration with other features, particularly Feature 014 (Lead Capture Form).

## 1. URL Path Routes

| Path | Access Level | Description |
|:---|:---|:---|
| `/` | Public (Unauthenticated) | This landing page. |
| `/login` | Public (Unauthenticated) | CRM login entry point. |
| `/dashboard` | Protected (Authenticated) | Scoped dashboard home page. |

---

## 2. Scroll Anchors (Internal Navigation)

Other components (such as buttons, navigation links, and service cards) rely on the following HTML ID elements to perform smooth-scroll actions:

| Element ID | Target Section | Used By |
|:---|:---|:---|
| `#hero` | Page Top (Hero section) | "الرئيسية" nav link, footer logo |
| `#about` | About NEBRASGOO section | "عن نبراسكو" nav link |
| `#services` | 7-card Services Grid | "خدماتنا" nav link |
| `#lead-capture` | Lead Capture Form Section | "احجز تقييم جاهزية مجاني" CTA, Service card "المزيد" links |
| `#contact` | Contact details & Footer | "تواصل مع مستشار" CTA, "تواصل معنا" nav link |

---

## 3. Environment Variables Contract

| Variable Name | Required | Description |
|:---|:---|:---|
| `NEXT_PUBLIC_GTM_ID` | Optional | Google Tag Manager Container ID (e.g., `GTM-XXXXXX`). If not set, GTM scripts will not inject. |
