# Server Actions Contracts: Call and Communication Logging

This contract defines the Next.js Server Actions used to manage Call Logs and trigger side effects such as atomic follow-up completion and facility timeline logging.

---

## 1. Type Definitions

```typescript
export type CommunicationChannel = 'call' | 'whatsapp';
export type CommunicationDirection = 'inbound' | 'outbound';
export type CommunicationOutcome = 
  | 'answered' 
  | 'no_answer' 
  | 'busy' 
  | 'wrong_number' 
  | 'callback_requested' 
  | 'not_reachable';

export interface CreateCallLogInput {
  facilityId: string;
  contactId?: string; // Optional: specific contact
  followupId?: string; // Optional: linked follow-up
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  occurredAt?: Date; // Defaults to NOW if not provided
  outcome: CommunicationOutcome;
  durationSeconds?: number; // Optional duration in seconds
  notes?: string; // Optional free-text notes
  completeFollowUp?: boolean; // If true, atomically complete linked followupId
}

export interface UpdateCallLogInput {
  outcome: CommunicationOutcome;
  durationSeconds?: number;
  notes?: string;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface CallLog {
  id: string;
  companyId: string;
  facilityId: string;
  contactId: string | null;
  followupId: string | null;
  createdByUserId: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  occurredAt: string;
  outcome: CommunicationOutcome;
  durationSeconds: number | null;
  notes: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  archivedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  lastEditedByUserId: string | null;
  lastEditedAt: string | null;
}
```

---

## 2. Server Actions

### 2.1 `createCallLog`
Creates a manual call log and optionally marks a linked follow-up as completed.

* **Signature**:
  ```typescript
  export async function createCallLog(input: CreateCallLogInput): Promise<ActionResponse<CallLog>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and extract `company_id` and `role`.
  2. Verify user has write permissions on the parent facility (Sales User must be assigned owner; Supervisors/Admins must belong to same company).
  3. Validate that `occurredAt` is not in the future.
  4. Validate that `contactId` (if set) belongs to the same `facilityId`.
  5. Validate that `followupId` (if set) is pending, belongs to the same `facilityId` and same `companyId`.
* **Execution (Single Transaction)**:
  1. Insert `call_logs` row.
  2. If `completeFollowUp` is true and `followupId` is provided:
     - Execute the follow-up completion script: update status to `done`, record completing user and timestamp, and save outcome notes.
     - Log a `followup_complete` event in `facility_activity`.
  3. Log a `call_logged` event in `facility_activity` in Arabic (e.g. `تم تسجيل اتصال صادر مع جهة الاتصال (تم الرد)`).
  4. Return the new call log.

---

### 2.2 `updateCallLog`
Modifies the outcome, duration, or notes of an existing call log (subject to the 24-hour edit lock window).

* **Signature**:
  ```typescript
  export async function updateCallLog(id: string, input: UpdateCallLogInput): Promise<ActionResponse<CallLog>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and extract `company_id` and `role`.
  2. Fetch existing call log. Verify it belongs to the user's `company_id`.
  3. Verify edit rights on the parent facility.
  4. Check the 24-hour window:
     - If user role is `Sales User` and `NOW() - created_at > 24 hours`, return `403 Forbidden` ("لا يمكن تعديل السجل بعد مرور 24 ساعة من إنشائه").
     - If user role is `Sales User`, verify they are the creator (`created_by_id = auth.uid()`).
     - Supervisors/Admins bypass the 24-hour check.
* **Execution**:
  1. Update the record's editable fields: `outcome`, `duration_seconds`, `notes`, `last_edited_by_id = auth.uid()`, `last_edited_at = NOW()`.
  2. Log a `call_log_edited` event in `facility_activity`.
  3. Return updated call log.

---

### 2.3 `archiveCallLog`
Soft-archives a call log (hiding it from active views).

* **Signature**:
  ```typescript
  export async function archiveCallLog(id: string): Promise<ActionResponse<void>>
  ```
* **Server-Side Validation**:
  1. Authenticate user. Verify user has write permissions on the parent facility.
  2. Verify that they are either the creator or a manager.
* **Execution**:
  1. Set `is_archived = true`, `archived_at = NOW()`, `archived_by_id = auth.uid()`.
  2. Log a `call_log_archived` event in `facility_activity`.

---

### 2.4 `recoverCallLog`
Restores a soft-archived call log.

* **Signature**:
  ```typescript
  export async function recoverCallLog(id: string): Promise<ActionResponse<void>>
  ```
* **Server-Side Validation**:
  1. Authenticate user. Verify user has management role (`Supervisor`, `Company Admin`, `Super Admin`).
* **Execution**:
  1. Set `is_archived = false`, `archived_at = null`, `archived_by_id = null`.
  2. Log a `call_log_recovered` event in `facility_activity`.
