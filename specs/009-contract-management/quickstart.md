# Quickstart: Contract Management

This guide describes how to run, test, and verify the Contract Management features in your local development environment.

---

## 1. Local Supabase Migrations & Seeds

The Contract Management feature introduces schema modifications, validation triggers, a private storage bucket (`contracts`), and security RLS/storage policies.

1. Ensure Docker Desktop is running.
2. Apply migrations locally:
   ```bash
   supabase db reset
   ```
   *Note: This resets the local database, applies `20260617000009_contract_management.sql`, creates the private storage bucket, and populates mock contracts.*

---

## 2. Seed Data Validation

The database seed populates the following mock contract records:
* **Contract A** (Company A, Facility A): Draft state, v1. Created from Accepted Offer B (pre-filling value and linked contact). Created by `sales_a@nebrasgoo.com`. Editable.
* **Contract B** (Company A, Facility A): Active state, v1, created manually. Has end date set to 45 days in the future. Status displays as **Expiring Soon** (ينتهي قريباً) under the default 60-day warning threshold. Document path is populated in secure storage. Core pricing fields are locked (immutable).
* **Contract C** (Company A, Facility A): Active state, v1, whose end date is past. Status displays as **Expired** (منتهي).
* **Contract D** (Company B, Facility B): Draft state. Isolated from Company A users.

---

## 3. Running Verification Tests

### 3.1 Database RLS & Storage Policies Testing (pgTAP)
To verify database RLS isolation, atomic sequence counters, unique version constraints, and private storage file policies:

```bash
supabase db test
```
All pgTAP tests under `supabase/tests/` (including `009-contract-management.test.sql`) will execute and report pass/fail status.

### 3.2 Integration & Server Action Tests
To verify Server Actions, document uploads, URL signature expirations, and facility timeline logging:

```bash
npm run test:integration
```
Runs Vitest integration tests to verify server-side validation rules, correct signed URL generation, and facility activity logging.

---

## 4. Local App Testing & UI Validation

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) and log in.

### 4.1 Create Contract from Accepted Offer
* Log in as `sales_a@nebrasgoo.com`.
* Open Facility A's detail page.
* Under the **Offers** (العروض) tab, find the accepted offer and click **إنشاء عقد** (Create Contract).
* Verify that the contract editor opens with the facility, contact, and contract value pre-filled from the offer, and that saving creates a draft with an auto-generated reference (e.g. `CON-2026-0001`).

### 4.2 Contract Activation and Stage Sync
* On the draft contract view, fill in the start and end dates.
* Upload a PDF or image file (under 10MB) in the **وثيقة العقد** (Contract Document) field.
* Click **تفعيل العقد** (Activate Contract).
* Verify that the app displays a confirmation dialog asking to advance the facility's lifecycle stage to **Contract** (عقد). Confirm the transition.
* Check the facility timeline and verify that both the activation and the document upload were logged.

### 4.3 Immutability and Secure Document View
* Open the activated contract.
* Verify that all input fields (value, dates, contact, offer) are now locked and read-only.
* Click **تحميل وثيقة العقد** (Download Contract Document).
* Verify that it invokes the server action `getSignedDocumentUrl` to fetch a fresh signed URL (valid for 15 minutes), opening the document cleanly.
* Copy the link, wait 15 minutes, and verify that accessing the URL directly afterwards returns a `403 Access Denied` from Supabase Storage.

### 4.4 Management-Only Actions
* Verify that the buttons for **إكمال العقد** (Complete Contract) and **إنهاء مبكر** (Early Termination) are hidden or disabled when logged in as `sales_a@nebrasgoo.com`.
* Log out and log back in as `supervisor_a@nebrasgoo.com`.
* Navigate to the contract and verify that these buttons are active. Click **إنهاء مبكر**, enter a reason and date, and verify that the contract updates to **Terminated** (ملغى).
