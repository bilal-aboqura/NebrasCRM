# NEBRASGOO CRM Implementation Notes

This pass implements the Spec Kit features 001 through 010 as a mock-backed Next.js application with Supabase schema artifacts.

## Scope

- Authentication shell, role-aware navigation, company switching, profile, login, reset, and invitation screens.
- Super Admin and Company Admin company/user administration actions and pages.
- Facility, contact, follow-up, call-log, pipeline, offer, and contract action modules.
- Dashboard pages and reusable Arabic-first RTL components for the core CRM workflows.
- Supabase migrations and pgTAP smoke tests for the tables, enums, triggers, and RLS foundations described by the specs.
- Vitest integration tests covering the mock-backed action behavior.

## Local Verification

- `npm test`
- `npm run test:integration`
- `npm run build`

Database verification requires Docker Desktop and the local Supabase stack:

- `npx supabase start`
- `npx supabase db test`
