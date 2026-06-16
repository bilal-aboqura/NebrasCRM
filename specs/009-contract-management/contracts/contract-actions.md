# Server Actions Contracts: Contract Management

This contract defines the Next.js Server Actions used to manage Contracts, execute server-side state transitions, manage secure document uploads/downloads, and write audit history.

---

## 1. Type Definitions

```typescript
export type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated';

export interface CreateContractInput {
  facilityId: string;
  contactId?: string; // Optional: linked contact
  offerId?: string; // Optional: linked accepted offer
  title: string;
  value: number; // SAR
  startDate: string; // ISO Date String
  endDate: string; // ISO Date String
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateDraftContractInput {
  contactId?: string;
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  paymentTerms?: string;
  notes?: string;
}

export interface TerminateContractInput {
  terminatedAt: string; // ISO Date String
  terminatedReason: string;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface Contract {
  id: string;
  companyId: string;
  facilityId: string;
  contactId: string | null;
  offerId: string | null;
  createdBy: string;
  rootContractId: string | null;
  parentContractId: string | null;
  referenceNumber: string;
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  paymentTerms: string | null;
  terminatedAt: string | null;
  terminatedReason: string | null;
  documentPath: string | null;
  version: number;
  isSuperseded: boolean;
  isActive: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Server Actions

### 2.1 `createContract`
Creates a new draft contract, validating links and pre-filling details if from an accepted offer.

* **Signature**:
  ```typescript
  export async function createContract(input: CreateContractInput): Promise<ActionResponse<Contract>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and extract `company_id`.
  2. Verify user has write permissions on the parent facility.
  3. Validate that `contactId` (if provided) belongs to the facility.
  4. If `offerId` is provided:
     - Verify the offer status is `'accepted'` and belongs to the same facility.
     - Verify the offer is not already linked to another contract (UNIQUE constraint).
* **Execution (Single Transaction)**:
  1. Insert `contracts` row (status defaults to `'draft'`, version defaults to `1`).
  2. *(Database trigger automatically generates reference number CON-YYYY-XXXX).*
  3. Log `contract_created` in `facility_activity`.
  4. Return the created contract.

---

### 2.2 `updateDraftContract`
Modifies a draft contract's fields.

* **Signature**:
  ```typescript
  export async function updateDraftContract(id: string, input: UpdateDraftContractInput): Promise<ActionResponse<Contract>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify write permissions.
  2. Fetch existing contract and verify its status is `'draft'`. If status is not `'draft'`, reject with `400 Bad Request`.
  3. Validate `startDate` is before `endDate`.
* **Execution**:
  1. Update `contracts` record fields.
  2. Return updated contract.

---

### 2.3 `activateContract`
Activates a draft contract, prompting a facility lifecycle stage transition.

* **Signature**:
  ```typescript
  export async function activateContract(id: string): Promise<ActionResponse<Contract>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify permissions.
  2. Check that status is `'draft'` and dates are valid.
* **Execution**:
  1. Update contract status to `'active'`.
  2. Log `contract_activated` with its value in `facility_activity`.
  3. Return updated contract.
  * *Note: The Next.js client UI catches success and prompts the user to advance the facility status to "Contract".*

---

### 2.4 `completeContract`
Marks an active contract as successfully completed (Management-only).

* **Signature**:
  ```typescript
  export async function completeContract(id: string): Promise<ActionResponse<Contract>>
  ```
* **Server-Side Validation**:
  1. Authenticate user. Verify user role is `Supervisor`, `Company Admin`, or `Super Admin` (deny Sales Users).
  2. Verify contract status is `'active'`.
* **Execution**:
  1. Update status to `'completed'`.
  2. Log `contract_completed` in `facility_activity`.

---

### 2.5 `terminateContract`
Terminates an active contract early with reasons (Management-only).

* **Signature**:
  ```typescript
  export async function terminateContract(id: string, input: TerminateContractInput): Promise<ActionResponse<Contract>>
  ```
* **Server-Side Validation**:
  1. Authenticate user. Verify user role is `Supervisor`, `Company Admin`, or `Super Admin`.
  2. Verify status is `'active'`. Validate `terminatedAt` is not before `startDate`.
* **Execution**:
  1. Update status to `'terminated'`, set `terminated_at = input.terminatedAt`, `terminated_reason = input.terminatedReason`.
  2. Log `contract_terminated` in `facility_activity` in Arabic with details.

---

### 2.6 `createContractAddendum`
Creates a new draft addendum contract to revise an active contract.

* **Signature**:
  ```typescript
  export async function createContractAddendum(parentContractId: string): Promise<ActionResponse<Contract>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify permissions.
  2. Fetch parent contract. Verify status is `'active'`.
* **Execution (Single Transaction)**:
  1. Insert a new `contracts` row:
     - Copy `title`, `value`, `contact_id`, `offer_id`, `notes` from parent.
     - Set `status = 'draft'`.
     - Set `parent_contract_id = parentContractId`.
     - Set `root_contract_id = COALESCE(parent.root_contract_id, parent.id)`.
     - Set `version = parent.version + 1`.
  2. Update parent contract set `is_superseded = true`.
  3. Log `contract_addended` event in `facility_activity` in Arabic.
  4. Return the new contract addendum.

---

### 2.7 `uploadContractDocument`
Uploads the signed contract file to the secure private bucket.

* **Signature**:
  ```typescript
  export async function uploadContractDocument(id: string, fileData: { base64: string, name: string, type: string }): Promise<ActionResponse<string>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify edit permissions for the contract.
  2. Verify status is `'draft'`.
  3. Validate file type (must be `application/pdf` or `image/*`) and size (must be <= 10MB).
* **Execution**:
  1. Format path: `company_[company_id]/contracts/[contract_id]/[name]`.
  2. Upload base64 payload to the private `contracts` bucket using admin client.
  3. Update `contracts` table set `document_path = [path]`.
  4. Log `contract_document_uploaded` in `facility_activity`.
  5. Return the document path.

---

### 2.8 `getSignedDocumentUrl`
Generates a short-lived URL for authorized viewing of contract documents.

* **Signature**:
  ```typescript
  export async function getSignedDocumentUrl(id: string): Promise<ActionResponse<string>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and extract claims.
  2. Verify user has visibility rights to the parent contract (Sales User must own facility; Managers must belong to same company).
* **Execution**:
  1. Retrieve `document_path` from the contract record.
  2. Read the company settings or config for signed-URL TTL (default 15 minutes / 900 seconds).
  3. Generate signed URL via Supabase Storage SDK.
  4. Log `contract_document_viewed` in `facility_activity`.
  5. Return the URL.
