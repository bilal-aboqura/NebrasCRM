# Research: Contact Management

## Decision 1: Database Invariant for Single Active Primary Contact

* **Decision**: Enforce the "at most one primary contact per facility among active contacts" rule using a partial unique index on PostgreSQL:
  ```sql
  CREATE UNIQUE INDEX contacts_facility_primary_idx 
  ON contacts (facility_id) 
  WHERE (is_primary = true AND is_archived = false);
  ```
* **Rationale**: Enforcing this invariant at the database engine level is a robust defense-in-depth practice. It guarantees that, regardless of concurrent edits, UI bugs, or direct API manipulation, it is physically impossible to store more than one active primary contact for a single facility.
* **Alternatives Considered**: 
  * *Server-side Validation Only*: Validating in Server Actions before insert/update. Rejected because it is vulnerable to race conditions where two concurrent requests check for primary presence, find none, and proceed to insert two primary contacts.
  * *PostgreSQL Before Triggers*: Running a trigger that unsets other primaries. Replaced by combining a transactional swap in the server action and the unique index as a hard gate.

## Decision 2: Atomic Transaction for Primary Contact Swap

* **Decision**: Perform primary contact swaps in a single transactional unit (Server Action or PostgreSQL function/transaction block). When setting a new contact as primary, first set `is_primary = false` for all contacts under the same `facility_id`, then set `is_primary = true` on the target contact.
* **Rationale**: Prevents violating the unique index constraint during updates and guarantees that the transition is completely atomic (all or nothing).
* **Alternatives Considered**:
  * *Client-driven sequential calls*: Making two API calls (one to unset the old, one to set the new). Rejected because network failure or user cancellation between the calls would leave the system in an inconsistent or broken state.

## Decision 3: Archival State Clean-Up of Primary Flag

* **Decision**: When a primary contact is archived (soft-deleted), clear its `is_primary` flag (set to `false`) in the same database transaction.
* **Rationale**: Archived contacts are hidden from default views. If an archived contact retained its primary status, the facility would appear to have no primary contact in the UI, but the database would block setting a new primary contact because of the unique index constraint. Clearing the flag ensures that the system allows a new active primary contact to be added immediately.
* **Alternatives Considered**:
  * *Keep primary flag on archived contact*: Disallowed because it blocks creating another primary contact for the facility due to the partial index constraint.

## Decision 4: RLS Inherited Permissions

* **Decision**: The Row Level Security (RLS) policies on the `contacts` table will inspect the visibility of the corresponding `facility_id` in the `facilities` table.
  ```sql
  CREATE POLICY contacts_select_policy ON contacts
  FOR SELECT
  USING (
    company_id = auth.jwt() ->> 'company_id'::text
    AND EXISTS (
      SELECT 1 FROM facilities
      WHERE facilities.id = contacts.facility_id
    )
  );
  ```
* **Rationale**: Rather than repeating owner assignment checking and supervisor logic on the `contacts` table, using `EXISTS` on the `facilities` table ensures that contact visibility and mutate permissions automatically sync with facility permissions. It guarantees that any user who loses access to a facility instantly loses access to its contacts.
* **Alternatives Considered**:
  * *Direct assignments check on contacts*: Replicating `assigned_owner_id` logic. Rejected because it violates DRY and increases database query overhead.
