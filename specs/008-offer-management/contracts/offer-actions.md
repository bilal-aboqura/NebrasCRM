# Server Actions Contracts: Offer (Quote) Management

This contract defines the Next.js Server Actions used to manage Offers, execute server-side financial calculations, manage revision chains, and write audit log history.

---

## 1. Type Definitions

```typescript
export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
export type DiscountType = 'percentage' | 'fixed';

export interface OfferLineItemInput {
  description: string;
  amount: number;
  ordering: number;
}

export interface CreateOfferInput {
  facilityId: string;
  contactId?: string; // Optional: linked contact
  title: string;
  validUntil: string; // ISO Date String
  notes?: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate?: number; // Optional override, defaults to company settings (e.g. 15%)
  lineItems: OfferLineItemInput[];
}

export interface UpdateDraftOfferInput {
  contactId?: string;
  title: string;
  validUntil: string;
  notes?: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate?: number;
  lineItems: OfferLineItemInput[];
}

export interface RecordDecisionInput {
  decision: 'accepted' | 'rejected';
  decisionNote?: string;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface Offer {
  id: string;
  companyId: string;
  facilityId: string;
  contactId: string | null;
  createdBy: string;
  rootOfferId: string | null;
  parentOfferId: string | null;
  title: string;
  currency: 'SAR';
  status: OfferStatus;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  validUntil: string; // Date portion
  sentAt: string | null;
  decisionAt: string | null;
  decisionNote: string | null;
  version: number;
  isSuperseded: boolean;
  isActive: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: OfferLineItem[];
}

export interface OfferLineItem {
  id: string;
  offerId: string;
  description: string;
  amount: number;
  ordering: number;
  createdAt: string;
}
```

---

## 2. Server Actions

### 2.1 `createOffer`
Creates a new draft offer with server-side totals verification.

* **Signature**:
  ```typescript
  export async function createOffer(input: CreateOfferInput): Promise<ActionResponse<Offer>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and extract `company_id`.
  2. Verify user has write permissions on the parent facility (Sales User must own it; Supervisors/Admins must belong to same company).
  3. Validate that `contactId` (if provided) belongs to the same facility.
  4. Ensure line items are not empty and carry positive amounts.
* **Execution (Single Transaction)**:
  1. Insert `offers` row (status defaults to `'draft'`, version defaults to `1`).
  2. Insert `offer_line_items` rows.
  3. *(Database triggers automatically calculate subtotal, discount, tax, and grand_total).*
  4. Log `offer_created` event in `facility_activity` in Arabic (e.g. `تم إنشاء مسودة عرض سعر جديد بقيمة [مجموع] ر.س.`).
  5. Return the created offer.

---

### 2.2 `updateDraftOffer`
Modifies a draft offer's fields and line items.

* **Signature**:
  ```typescript
  export async function updateDraftOffer(id: string, input: UpdateDraftOfferInput): Promise<ActionResponse<Offer>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify write permissions.
  2. Fetch existing offer and verify its status is `'draft'`. If status is not `'draft'`, reject with `400 Bad Request` ("لا يمكن تعديل العروض المرسلة أو النهائية").
  3. Validate `contactId` (if provided) belongs to the facility.
* **Execution (Single Transaction)**:
  1. Update `offers` header metadata.
  2. Delete all existing `offer_line_items` for `offer_id = id`.
  3. Re-insert updated `offer_line_items`.
  4. *(Database triggers automatically recalculate and verify totals).*
  5. Return updated offer.

---

### 2.3 `sendOffer`
Marks a draft offer as sent, freezing its content.

* **Signature**:
  ```typescript
  export async function sendOffer(id: string): Promise<ActionResponse<Offer>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify permissions.
  2. Check that the offer status is `'draft'`.
* **Execution**:
  1. Update offer status to `'sent'` and set `sent_at = NOW()`.
  2. Log `offer_sent` event in `facility_activity` in Arabic (e.g., `تم إرسال عرض السعر "[العنوان]" بقيمة [مجموع] ر.س.`).

---

### 2.4 `createOfferRevision`
Creates a new draft version of a sent/rejected offer, superseding the predecessor.

* **Signature**:
  ```typescript
  export async function createOfferRevision(parentOfferId: string): Promise<ActionResponse<Offer>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify permissions.
  2. Fetch parent offer. Verify status is `'sent'` or `'rejected'`.
* **Execution (Single Transaction)**:
  1. Insert a new `offers` row:
     - Copy `title`, `contact_id`, `discount_type`, `discount_value`, `tax_rate`, `notes` from parent.
     - Set `status = 'draft'`.
     - Set `parent_offer_id = parentOfferId`.
     - Set `root_offer_id = COALESCE(parent.root_offer_id, parent.id)`.
     - Set `version = parent.version + 1`.
  2. Copy all line items associated with `parentOfferId` to the new offer.
  3. Update parent offer set `is_superseded = true`.
  4. Log `offer_revised` event in `facility_activity` in Arabic.
  5. Return the new draft offer.

---

### 2.5 `recordOfferDecision`
Records the customer's decision to accept or reject the sent offer.

* **Signature**:
  ```typescript
  export async function recordOfferDecision(id: string, input: RecordDecisionInput): Promise<ActionResponse<Offer>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify permissions.
  2. Fetch offer and verify status is `'sent'` (or expired derived display state).
* **Execution (Single Transaction)**:
  1. Update offer set `status = input.decision`, `decision_at = NOW()`, `decision_note = input.decisionNote`.
  2. Log `offer_accepted` or `offer_rejected` in `facility_activity` with the value and notes.
  3. Return the updated offer.
  * *Note: The Next.js client-side router catches an `accepted` response and triggers the Feature 005 terminal-stage status prompt to advance the parent facility lifecycle stage.*

---

### 2.6 `archiveOffer`
Soft-archives an offer chain.

* **Signature**:
  ```typescript
  export async function archiveOffer(id: string): Promise<ActionResponse<void>>
  ```
* **Server-Side Validation**:
  1. Authenticate user and verify write permissions.
* **Execution**:
  1. Set `is_active = false`, `archived_at = NOW()`, `archived_by = auth.uid()` for all offers in the version chain (`id = id OR root_offer_id = [root_offer_id_of_target]`).
  2. Log `offer_archived` event in `facility_activity`.

---

### 2.7 `recoverOffer`
Restores a soft-archived offer chain.

* **Signature**:
  ```typescript
  export async function recoverOffer(id: string): Promise<ActionResponse<void>>
  ```
* **Server-Side Validation**:
  1. Authenticate user. Verify user has management role (`Supervisor`, `Company Admin`, `Super Admin`).
* **Execution**:
  1. Set `is_active = true`, `archived_at = null`, `archived_by = null` for all offers in the version chain.
  2. Log `offer_recovered` event in `facility_activity`.
