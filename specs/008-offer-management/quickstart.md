# Quickstart: Offer (Quote) Management

This guide describes how to run, test, and verify the Offer (Quote) Management features in your local development environment.

---

## 1. Local Supabase Migrations & Seeds

The Offer Management feature introduces database tables (`offers`, `offer_line_items`), RLS policies, validation and math triggers, and seed data.

1. Ensure Docker Desktop is running.
2. Apply migrations locally:
   ```bash
   supabase db reset
   ```
   *Note: This resets the database, applies `20260617000008_offer_management.sql`, and populates seed records.*

---

## 2. Seed Data Validation

The database seed populates the following mock offer records:
* **Offer A** (Company A, Facility A): Draft state, v1. Title: "خطة اعتماد سباهي - أولية". Created by `sales_a@nebrasgoo.com`. Editable.
* **Offer B** (Company A, Facility A): Sent state, v1 (marked `is_superseded = true`), parent of Offer B v2. Immutable.
* **Offer B v2** (Company A, Facility A): Draft state, v2. Created via revision of Offer B. Links to `root_offer_id = Offer B` and `parent_offer_id = Offer B`.
* **Offer C** (Company A, Facility A): Sent state, v1, with a past `valid_until` date. Status displays as **Expired** (منتهي الصلاحية).
* **Offer D** (Company B, Facility B): Draft state. Completely isolated from Company A users.

---

## 3. Running Verification Tests

### 3.1 Database RLS & Math Testing (pgTAP)
To verify database RLS isolation, server-side monetary math triggers, unique version constraints, and cascading archival behavior:

```bash
supabase db test
```
All pgTAP tests under `supabase/tests/` (including `008-offer-management.test.sql`) will execute and report pass/fail status.

### 3.2 Integration & Server Action Tests
To verify Next.js Server Actions, version chain creation, and timeline event logging:

```bash
npm run test:integration
```
Runs Vitest integration tests to verify server-side validation rules, correct tax/discount math operations, and activity timeline writes.

---

## 4. Local App Testing & UI Validation

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) and log in.

### 4.1 Create & Edit Draft Offer
* Log in as `sales_a@nebrasgoo.com`.
* Open Facility A's detail page.
* Under the **Offers** (العروض) section, click **إنشاء عرض جديد** (Create New Offer).
* Add multiple line items with descriptions and amounts.
* Toggle the discount between **Percentage (%)** and **Fixed SAR** and input a discount value.
* Toggle tax-exemption to see the tax rate update from 15% to 0%.
* Save the draft and verify that the Subtotal, Discount, Tax (VAT), and Grand Total are computed server-side and render correctly.

### 4.2 Immutability, Revisions, and Printing
* View a draft offer and click **إرسال العرض** (Send Offer). Confirm the action.
* Verify that the offer's inputs and pricing fields are now locked (read-only).
* Click **مراجعة وتعديل** (Revise/Edit). Verify a new draft (v2) is created, and the original sent offer is marked as superseded.
* Click **عرض الطباعة** (Print View). Verify it opens a clean layout without headers/navigation, and pressing `Ctrl+P` opens the browser's PDF print layout correctly.

### 4.3 Advance Stage on Acceptance
* Open a sent offer and click **قبول العرض** (Accept Offer).
* Confirm the decision and verify that the app prompts you to transition the facility's lifecycle stage (e.g. to "Negotiation" or "Contract").
* Verify that the parent facility's activity timeline logs the acceptance with the offer's monetary value.
