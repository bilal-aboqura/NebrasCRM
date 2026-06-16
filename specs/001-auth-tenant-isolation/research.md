# Research Notes: Foundational Access Layer (Authentication & Tenant Isolation)

This document outlines the architectural decisions, rationale, and alternatives considered for implementing the authentication, multi-tenant scoping, role-based access control, and auditing mechanisms.

---

## 1. Multi-Tenant Scoping and Isolation at DB Layer

- **Decision**: Single pooled database schema using Postgres Row Level Security (RLS) and custom JWT claims.
- **Rationale**: 
  - Having a single database with `company_id` column isolation matches the "one system, not two" requirement and keeps maintenance and deployment simple.
  - Row Level Security (RLS) is standard, robust, and acts as the ultimate backstop. Even if application queries forget to filter by `company_id`, the database automatically scopes the result set.
  - To prevent performance degradation from checking the `profiles` table on every query, we use Supabase's Custom Claims Hook to embed `company_id` and `role` into the user's JWT. RLS policies can then check `auth.jwt() ->> 'company_id'` directly, which is a fast in-memory operation.
- **Alternatives Considered**:
  - *Schema-per-tenant*: Rejected because it introduces complexity in running migrations across schemas, requires dynamic connection routing, and makes super-admin cross-tenant actions difficult.
  - *Application-level filtering only*: Rejected because it violates the constitution's Principle I (non-negotiable data isolation at the data-access layer).

---

## 2. Super Admin Cross-Tenant Switching

- **Decision**: Server-validated `httpOnly` cookie containing the active `company_id` override.
- **Rationale**:
  - When a `super_admin` performs a company switch, the active target company ID is sent to the server, validated, and stored in a secure, encrypted `httpOnly` cookie.
  - Database calls for `super_admin` read this cookie value to resolve their effective `company_id` for queries, rather than relying on client-submitted headers.
  - This ensures data isolation is secure, server-side validated, and cannot be spoofed by a client.
- **Alternatives Considered**:
  - *Client-state header injection*: Rejected because headers could be spoofed by the client, presenting a security risk.
  - *Database session variable*: Rejected because managing serverless state/connection pooling makes maintaining transaction-level PostgreSQL session variables unreliable in Next.js Server Actions.

---

## 3. Cookie-Based Session Management in Next.js

- **Decision**: Use `@supabase/ssr` to manage cookies for session state across Server Components, Server Actions, Route Handlers, and Middleware.
- **Rationale**:
  - Allows Next.js App Router to fully leverage React Server Components (RSC) by reading the user session on the server during rendering.
  - Next.js Middleware can intercept requests and safely redirect unauthenticated users to `/login`.
- **Alternatives Considered**:
  - *Token stored in localStorage (Client-only)*: Rejected because client-only authentication prevents Server Components from serving scoped HTML, resulting in a flash of unauthenticated state or layout shifting.

---

## 4. Local Database Testing (pgTAP)

- **Decision**: Use pgTAP inside the local Supabase Docker instance to unit test RLS policies.
- **Rationale**:
  - Testing RLS policies directly in SQL via pgTAP ensures that isolation rules are verified independently of application-level bugs.
  - Run within the local Supabase environment as part of automated CI/CD checks.
- **Alternatives Considered**:
  - *Jest/Vitest integration tests with client queries*: Good for end-to-end flows, but harder to verify all edge cases of database constraints. We will use a combination: pgTAP for SQL policies and integration tests in the application layer.

---

## 5. Brute-Force Login Throttling

- **Decision**: Track failed attempts in a dedicated `public.login_attempts` table, combining it with Supabase's built-in auth rate limits.
- **Rationale**:
  - Allows the application layer to enforce a 30-second cooldown after 5 failed login attempts per email/IP.
  - This table is checked server-side (in Route Handlers/Server Actions) *before* invoking Supabase Auth, preventing password-guessing attempts.
- **Alternatives Considered**:
  - *Relying only on Supabase Auth rate limits*: Supabase's built-in rate limits are global and IP-based, but don't provide the fine-grained custom per-account lockout messaging and logging needed for strict business audit requirements.
