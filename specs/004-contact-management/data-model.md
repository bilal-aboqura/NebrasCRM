# Data Model: Contact Management

## Database Schema

The schema introduces the `contacts` table to store individuals associated with medical facilities, along with indices and constraints to maintain data integrity.

### `contacts` Table

```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name_ar VARCHAR(150) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    primary_phone VARCHAR(20) NOT NULL,
    primary_phone_normalized VARCHAR(20) NOT NULL,
    secondary_phone VARCHAR(20),
    email VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Constraints & Indexes

1. **Tenant Isolation Index**:
   ```sql
   CREATE INDEX idx_contacts_company_id ON contacts(company_id);
   ```

2. **Parent Facility Index**:
   ```sql
   CREATE INDEX idx_contacts_facility_id ON contacts(facility_id);
   ```

3. **Primary Contact Unique Invariant**:
   Enforces that at most one active contact can be marked as primary for a facility.
   ```sql
   CREATE UNIQUE INDEX contacts_facility_primary_idx 
   ON contacts(facility_id) 
   WHERE (is_primary = true AND is_archived = false);
   ```

4. **Updated At Trigger**:
   Applies the standard automatic updated_at timestamp modification trigger.
   ```sql
   CREATE TRIGGER update_contacts_updated_at
       BEFORE UPDATE ON contacts
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column();
   ```

---

## Row Level Security (RLS)

RLS is enabled by default to isolate tenant companies and inherit facility visibility.

```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

1. **Select Policy (Inherited Visibility)**:
   Users can only view contacts belonging to facilities they are authorized to see under Feature 003's RLS rules.
   ```sql
   CREATE POLICY contacts_select_policy ON contacts
   FOR SELECT
   USING (
     company_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)::UUID
     AND EXISTS (
       SELECT 1 FROM facilities
       WHERE facilities.id = contacts.facility_id
     )
   );
   ```

2. **Insert Policy (Inherited Modification)**:
   Users can only add contacts to facilities they are authorized to modify.
   ```sql
   CREATE POLICY contacts_insert_policy ON contacts
   FOR INSERT
   WITH CHECK (
     company_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)::UUID
     AND EXISTS (
       SELECT 1 FROM facilities
       WHERE facilities.id = contacts.facility_id
       -- Facility edit rights check: Sales User must be owner, or management role
       AND (
         ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) IN ('Supervisor', 'Company Admin', 'Super Admin')
         OR facilities.assigned_owner_id = auth.uid()
       )
     )
   );
   ```

3. **Update Policy (Inherited Modification)**:
   Users can only modify contacts on facilities they have edit access to.
   ```sql
   CREATE POLICY contacts_update_policy ON contacts
   FOR UPDATE
   USING (
     company_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)::UUID
     AND EXISTS (
       SELECT 1 FROM facilities
       WHERE facilities.id = contacts.facility_id
       AND (
         ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) IN ('Supervisor', 'Company Admin', 'Super Admin')
         OR facilities.assigned_owner_id = auth.uid()
       )
     )
   )
   WITH CHECK (
     company_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)::UUID
     AND EXISTS (
       SELECT 1 FROM facilities
       WHERE facilities.id = contacts.facility_id
       AND (
         ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) IN ('Supervisor', 'Company Admin', 'Super Admin')
         OR facilities.assigned_owner_id = auth.uid()
       )
     )
   );
   ```

---

## Log Extensions: `FacilityActivity`

The existing `FacilityActivity` log table records updates to contacts. The `event_type` is extended with:
- `contact_added`: New contact created.
- `contact_edited`: Contact details modified (logs field-specific updates).
- `contact_archived`: Contact soft-deleted.
- `contact_recovered`: Contact restored to active status.
- `primary_changed`: A new contact designated as primary.
- `primary_cleared`: Current primary contact archived or flag explicitly toggled off.
