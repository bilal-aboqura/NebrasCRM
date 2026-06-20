# Research & Design Decisions: Assessment Persistence and CRM Linking

## 1. Database Immutability
- **Decision**: Enforce assessment immutability using a PostgreSQL trigger that rejects `UPDATE` operations on all fields except `is_active`, `archived_at`, and `archived_by`.
- **Rationale**: Historical audits are compliance snapshots that must never be altered retroactively. If an audit contains mistakes, a new assessment session must be completed.
- **Alternatives Considered**: 
  - Application-level immutability (rejected because database direct access or scripts could accidentally bypass the guard).

## 2. Server-Side Score Recalculation
- **Decision**: The Next.js Server Action will receive only raw answer inputs (item code and status) and recompute the overall percentage score and readiness tier.
- **Rationale**: Prevents malicious or erroneous client-side requests from saving falsified readiness scores.
- **Alternatives Considered**: 
  - Trusting the client score (rejected due to integrity risks).

## 3. Row Level Security (RLS) policies
- **Decision**: Define RLS rules on the `assessments` table that join with the `facilities` table to inherit visibility.
  - Read: `auth.uid() in (select owner_id from facilities where id = facility_id) OR role in ('supervisor', 'company_admin')` scoped to `company_id`.
- **Rationale**: Keeps authorization consistent with the facility management module (Feature 003).

## 4. Trend progression
- **Decision**: Avoid complex chart libraries in the tab/section and render a simple text representation comparing the oldest assessment to the newest.
- **Rationale**: Highly readable and matches the Arabic RTL UI requirements cleanly.
