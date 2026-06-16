# Interface Contracts: Contact Server Actions

This document details the TypeScript server actions acting as the API layer between the CRM frontend and the Supabase Postgres backend.

## Types

```typescript
export interface Contact {
  id: string;
  company_id: string;
  facility_id: string;
  name_ar: string;
  job_title: string;
  primary_phone: string;
  primary_phone_normalized: string;
  secondary_phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactInput {
  name_ar: string;
  job_title: string;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface UpdateContactInput {
  name_ar?: string;
  job_title?: string;
  primary_phone?: string;
  secondary_phone?: string;
  email?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## Operations

### 1. `createContact`
Adds a contact to a facility. Automatically normalizes the phone number. If `is_primary` is true, atomically unsets the previous primary contact in the same transaction.

* **Signature**:
  ```typescript
  export async function createContact(
    facilityId: string, 
    input: CreateContactInput
  ): Promise<ActionResponse<Contact>>;
  ```
* **Validation Rules**:
  * Check that the user belongs to the active `company_id`.
  * Validate that the parent facility is assigned to the current user (if `Sales User`) or belongs to their company.
  * Require `name_ar` and `job_title` to be non-empty.
  * Validate and normalize `primary_phone`.
  * If `is_primary` is set to true, verify the user has permission to set it.
* **Logging**:
  * Insert a row in `FacilityActivity` with `event_type = 'contact_added'` and details.

### 2. `updateContact`
Updates a contact's details. If `is_primary` is toggled to true, atomically unsets the previous primary. If it is toggled to false, updates that contact.

* **Signature**:
  ```typescript
  export async function updateContact(
    contactId: string, 
    input: UpdateContactInput
  ): Promise<ActionResponse<Contact>>;
  ```
* **Validation Rules**:
  * Inherited permissions verify that the user can edit the contact's parent facility.
  * Atomic transaction handles changing `is_primary` to true (unsetting others).
* **Logging**:
  * Insert a row in `FacilityActivity` with `event_type = 'contact_edited'` (or `'primary_changed'`).

### 3. `archiveContact`
Soft-deletes a contact. If the contact is primary, clears their `is_primary` flag atomically in the same transaction.

* **Signature**:
  ```typescript
  export async function archiveContact(
    contactId: string
  ): Promise<ActionResponse<void>>;
  ```
* **Validation Rules**:
  * User must have edit permissions on the parent facility.
* **Logging**:
  * Insert a row in `FacilityActivity` with `event_type = 'contact_archived'` (and `'primary_cleared'` if it was primary).

### 4. `recoverContact`
Restores an archived contact. The restored contact does *not* recover primary status to prevent double-primary errors.

* **Signature**:
  ```typescript
  export async function recoverContact(
    contactId: string
  ): Promise<ActionResponse<void>>;
  ```
* **Validation Rules**:
  * Only management roles (`Supervisor`, `Company Admin`, `Super Admin`) can recover archived contacts.
* **Logging**:
  * Insert a row in `FacilityActivity` with `event_type = 'contact_recovered'`.

### 5. `getFacilityContacts`
Retrieves a list of contacts for a facility, sorted with the primary contact at the top.

* **Signature**:
  ```typescript
  export async function getFacilityContacts(
    facilityId: string,
    showArchived?: boolean
  ): Promise<ActionResponse<Contact[]>>;
  ```
* **Validation Rules**:
  * User must have read permission on the facility.
  * If `showArchived` is true, verify user role is management.
