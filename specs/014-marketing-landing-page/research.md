# Research & Technical Decisions: Public Marketing Landing Page

## 1. Routing & Layout Separation

### Decision
Move the authenticated CRM dashboard home page from `src/app/(dashboard)/page.tsx` to `src/app/(dashboard)/dashboard/page.tsx`. Create a new route group `(public)` with its own layout and page components at `src/app/(public)/page.tsx` mapping to the root `/`.

### Rationale
This prevents layout collision between the public landing page (which must not have the CRM sidebar or headers) and the CRM itself. It aligns with standard Next.js App Router route nesting.

### Alternatives Considered
- Serving the marketing page at `/home` and redirecting `/` to `/dashboard`. Rejected because the client wants the landing page to be the unauthenticated entry point at the root `/`.

---

## 2. Font Loading & Tajawal Typeface

### Decision
Initialize the `Tajawal` font in `src/app/layout.tsx` using `next/font/google` and assign it to a CSS custom property `--font-tajawal`. Update the Tailwind configuration to match this custom property.

### Rationale
Using `next/font/google` optimizes font loading, prevents layout shifts (CLS), and ensures compatibility across all browsers without fetching assets from external CDNs at runtime.

---

## 3. Mobile Navigation Menu

### Decision
Implement the mobile hamburger overlay drawer using standard React `useState` in a client component or inline script, using Tailwind for transitions.

### Rationale
Keeps the client-side JavaScript minimal to maintain high Lighthouse scores (>90) while meeting accessibility requirements.

---

## 4. Google Tag Manager Integration

### Decision
Create a reusable `GtmPlaceholder` component that checks `process.env.NEXT_PUBLIC_GTM_ID`. If present, it injects the standard GTM script tag into the head and the iframe snippet in the body. If undefined, it does not render.

### Rationale
Allows marketing analytics to be easily configured via environment variables in different environments (staging, production) without hardcoding credentials in source code.
