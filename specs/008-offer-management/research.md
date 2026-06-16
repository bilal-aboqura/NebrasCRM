# Research: Offer (Quote) Management

This document outlines the technical design decisions, rationales, and alternatives considered for implementing Offer (Quote) Management in the NEBRASGOO CRM.

---

## 1. Immutable Sent Offers and Sequential Version Collisions

### Decision
Implement strict immutability for sent offers, requiring all pricing modifications to generate a new version. To prevent concurrent version collisions, enforce a unique key constraint on the combination of `(company_id, root_offer_id, version)`.

* **Immutability Enforcement**:
  A PostgreSQL `BEFORE UPDATE ON public.offers` trigger blocks any modification to the pricing-related fields once the status is updated to `sent`, `accepted`, or `rejected`:
  ```sql
  CREATE OR REPLACE FUNCTION check_offer_immutability()
  RETURNS TRIGGER AS $$
  BEGIN
    IF OLD.status IN ('sent', 'accepted', 'rejected') THEN
      -- Allow status changes (e.g. sent -> accepted) and soft-archival (is_active)
      -- but block changes to line items, prices, discounts, and parent links.
      IF OLD.subtotal IS DISTINCT FROM NEW.subtotal OR
         OLD.discount_type IS DISTINCT FROM NEW.discount_type OR
         OLD.discount_value IS DISTINCT FROM NEW.discount_value OR
         OLD.tax_rate IS DISTINCT FROM NEW.tax_rate OR
         OLD.parent_offer_id IS DISTINCT FROM NEW.parent_offer_id OR
         OLD.root_offer_id IS DISTINCT FROM NEW.root_offer_id OR
         OLD.version IS DISTINCT FROM NEW.version THEN
        RAISE EXCEPTION 'Cannot modify priced content of an offer that has already been sent.'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

* **Version Integrity and Collision Guard**:
  When a revision is requested, a transaction runs:
  1. Retrieve the latest version for the given `root_offer_id`.
  2. Insert a new offer with `parent_offer_id = [current_offer_id]`, `root_offer_id = [root_offer_id]`, `status = 'draft'`, `version = latest_version + 1`.
  3. Mark the predecessor offer as `is_superseded = true`.
  
  The database schema defines:
  ```sql
  ALTER TABLE public.offers ADD CONSTRAINT offers_root_version_idx UNIQUE (company_id, root_offer_id, version);
  ```
  If two representatives attempt to revise the same sent offer concurrently, PostgreSQL's strict transactional isolation and the unique constraint will force one of the operations to fail and roll back, guaranteeing version chain integrity.

### Rationale
Protects audit trail authenticity. Sent offers represent actual proposals in the client's hands, and they must remain immutable to prevent internal fraud or confusion. The database-level constraint prevents racing requests from creating diverging version branches.

---

## 2. Server-Side Monetary Math and Input Sanitization

### Decision
All financial math (subtotals, discounts, taxes, and grand totals) must be computed server-side via a database trigger and verified before saving. Client-supplied totals are completely ignored to prevent price-manipulation payloads.

* **Order of Operations**:
  1. Calculate `subtotal` = SUM of line item amounts.
  2. Compute `discount_amount`:
     - If `discount_type` is `'percentage'`: `subtotal * (discount_value / 100)`.
     - If `discount_type` is `'fixed'`: `discount_value`.
  3. If `discount_amount > subtotal`, throw a check constraint exception (prevent negative prices).
  4. Compute `taxable_base` = `subtotal - discount_amount`.
  5. Compute `tax_amount` = `taxable_base * (tax_rate / 100)`.
  6. Compute `grand_total` = `taxable_base + tax_amount`.

* **Triggers vs Server Actions**:
  Perform the final calculation and write in a `BEFORE INSERT OR UPDATE ON public.offers` trigger. If an offer is updated, or line items are added/removed (which triggers an update to the parent offer's subtotal), the trigger automatically runs the math and stores the verified totals.

### Rationale
Security best practice. Any totals sent from the browser can be modified by malicious payloads. Calculating totals server-side (and binding them to line items) guarantees that the database values are mathematically consistent and tamper-proof.

---

## 3. Facility Archival Cascade Exemption (Derived Visibilty)

### Decision
Do not cascade soft-archival flags (`is_active = false`) from facilities to offers. Instead, filter offers by checking the parent facility's active flag dynamically via database joins.

* **Derived Visibility Query**:
  ```sql
  CREATE OR REPLACE VIEW active_offers AS
  SELECT o.*
  FROM public.offers o
  JOIN public.facilities f ON o.facility_id = f.id
  WHERE o.is_active = true AND f.is_active = true;
  ```

### Rationale
Avoids the "cascade-restore hazard". If a manager soft-archives a facility, all its offers are hidden. If the facility is later restored, the offers are visible again automatically. If we had mutated each offer's `is_active` flag, we wouldn't know which offers were already archived *before* the facility was archived, leading to data state corruption.

---

## 4. Browser-Native Print Styling vs Client-Side Libraries

### Decision
Provide a dedicated print route `/dashboard/facilities/[id]/offers/[offerId]/print` that uses standard HTML styled with CSS print media queries (`@media print`) and native browser fonts. Do not use client-side JS PDF libraries.

* **Browser-Native PDF Export**:
  The route hides standard dashboard navigation, overlays, and sidebars:
  ```css
  @media print {
    .no-print {
      display: none !important;
    }
    body {
      background: #ffffff;
      color: #000000;
      font-size: 12pt;
    }
    @page {
      size: A4;
      margin: 20mm;
    }
  }
  ```
  The representative presses `Ctrl+P` (or clicks an Arabic button labeled "طباعة أو حفظ كـ PDF" which triggers `window.print()`) to open the native print dialog, allowing them to print to a physical device or save directly as a clean PDF.

### Rationale
Common JavaScript PDF libraries (like `jsPDF` or `html2canvas`) suffer from poor support for RTL layouts and Arabic script shaping. They render Arabic letters disconnected and in the wrong order (LTR), causing corrupted exports. Native browser print engines correctly layout RTL, resolve Arabic ligatures, and utilize system/web typefaces (such as Tajawal) perfectly.
