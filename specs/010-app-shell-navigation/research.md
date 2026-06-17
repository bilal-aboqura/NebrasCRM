# Research & Design Decisions: App Shell Navigation & Routing Wires

This document outlines key design choices, tech stack configurations, and research outcomes for the App Shell Navigation feature.

## Decision 1: Client vs. Server Components for Active Link Highlighting

- **Decision**: Render a server component wrapper (`Sidebar.tsx`) that checks the user's role and passes the authorized navigation items to a client component (`SidebarNav.tsx`).
- **Rationale**: Next.js App Router server components cannot directly query the current active pathname. A client component is required to use the `usePathname` hook from `next/navigation` to dynamic highlight the active link. Splitting the sidebar into a server shell (role validation) and a client nav (routing state) balances SEO/initial load speed with client-side interactive routing.
- **Alternatives Considered**: 
  - Using `headers()` in the server component to inspect `x-url` header. (Rejected as it requires configuring middleware to inject headers and disables static optimizations).

## Decision 2: Active Company Resolution for Super Admin

- **Decision**: Read the `active_company_id` cookie on the server using Next.js `cookies().get('active_company_id')`. If the cookie is present, fetch that company name. Otherwise, fall back to the Super Admin's default profile `company_id`.
- **Rationale**: This is consistent with the RLS policy defined in the database helper `public.get_active_company_id()`, which reads `active_company_id` from request cookies.
- **Alternatives Considered**:
  - Direct database querying of active company. (Rejected, as database session state does not persist across separate HTTP connections in Server Components).

## Decision 3: Optimized Server-Side Count Queries

- **Decision**: Retrieve the counts for the four dashboard summary cards using Supabase's `select('id', { count: 'exact', head: true })` syntax.
- **Rationale**: Using `{ count: 'exact', head: true }` avoids fetching row contents and retrieves only the count integer directly from PostgreSQL. This is extremely efficient and utilizes database indexes on `company_id` and `is_archived`/`status`/`due_at`.
- **Alternatives Considered**:
  - Fetching all rows and counting them in JavaScript. (Rejected due to high memory usage and poor scalability).
