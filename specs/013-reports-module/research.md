# Research: Reports Module

This document outlines key technical and structural decisions resolved during the outline and research phases for the Reports module.

---

## 1. Follow-up Type Alignment

- **Decision**: Update the database enum `public.followup_type` via a schema migration to `('call', 'visit', 'send_offer', 'other')`, removing `email` and `whatsapp`. Update existing rows using the old values accordingly.
- **Rationale**: Email and WhatsApp are communication channels already logged via `call_logs.channel`, not distinct task types. Aligning the follow-up types with task types avoids duplication and matches the business requirements.
- **Alternatives Considered**: 
  - *Option B (Mapping in queries)*: Keeping the enum and mapping text searches in notes. Rejected as fragile and slow.
  - *Option C (UI mapping)*: Aligning reports to the existing enum. Rejected as it would fail to track specific "send_offer" tasks accurately.

---

## 2. Stage Transition Tracking

- **Decision**: Update the `public.facility_activity` schema to include structured fields `event_type` (enum), `old_value` (text), and `new_value` (text) to log facility status changes directly. Use triggers to write structured values and backfill existing rows.
- **Rationale**: Calculating stage inflow/outflow and average durations requires structured status transition logs. Reusing `facility_activity` with structured fields is cleaner and aligns with the original Feature 003 design without introducing new tables.
- **Alternatives Considered**:
  - *Option A (New Table)*: Creating a new `facility_status_history` table. Rejected to prevent table bloat and stick to the original schema specification.
  - *Option B (Regex parsing)*: Parsing unstructured messages in text logs. Rejected as extremely slow and fragile.
  - *Option C (Current stage only)*: Tracking only the current stage. Rejected as it doesn't meet the requirement to average historical stage durations.

---

## 3. Handling Inactive Representatives

- **Decision**: By default, only show active sales representatives in the Team Comparison Report (Report 6). Provide an Arabic checkbox toggle `عرض المندوبين غير النشطين` (Show Inactive Representatives) to reveal deactivated representatives who had historical activity during the selected period.
- **Rationale**: Focuses reports on active team members while still allowing access to historical data for departed team members when needed.
- **Alternatives Considered**:
  - *Option A (Exclude inactive)*: Deleting/hiding them completely. Rejected as it would result in missing historical revenue figures for managers.
  - *Option B (Always include)*: Showing inactive reps by default. Rejected as it would clutter the view with inactive users.
