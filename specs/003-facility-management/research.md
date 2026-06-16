# Research: Facility Management

This document summarizes the technical research, technological choices, and rationale for the implementation of the Facility Management system.

---

## 1. Phone Normalization Logic

### Decision
Implement phone normalization both in the application layer (TypeScript utility) and as a database trigger/validation helper in PostgreSQL.

* **Format**: Standard Saudi mobile/landline format without leading `0` or symbols, prefixed with `966`. For example:
  * `0501234567` → `966501234567`
  * `+966 50 123 4567` → `966501234567`
  * `0114567890` → `966114567890`
* **Implementation**:
  * **TypeScript**: `normalizePhone(phone: string): string` strips all non-digits, strips leading `00` or `+`, and strips a single leading `0` before appending `966` if not already present.
  * **PostgreSQL**: Trigger on insert/update of `facilities` table that computes `primary_phone_normalized` automatically.

### Rationale
Ensures consistent uniqueness checking. If users enter phone numbers in different formats (e.g. spaces, hyphens, country codes), the database `UNIQUE` constraint on `(company_id, primary_phone_normalized)` would fail to detect duplicates without normalization. By performing database-level trigger normalization, we guarantee integrity regardless of the API payload.

---

## 2. Saudi Geography Reference Data

### Decision
Create normalized database tables for `public.regions` (Saudi administrative regions) and `public.cities` (referenced to regions).

* **Schema**:
  * `regions`: `id` (int/uuid), `name_ar` (text), `name_en` (text).
  * `cities`: `id` (int/uuid), `region_id` (uuid references regions), `name_ar` (text), `name_en` (text).
* **"Other" City Path**:
  * The `cities` table contains a special seed record: `name_ar = 'أخرى'`, `name_en = 'Other'`.
  * The `facilities` table contains a nullable `city_custom` text field. When a user selects "Other", they specify the city in a text box, which is saved to `city_custom` for future administrative review and normalization.

### Rationale
Enforcing structured geography dropdowns maintains clean datasets for sales reporting and pipeline routing. However, Saudi Arabia has many small municipalities; providing a free-text "Other" fallback prevents blocking Sales Users from entering valid leads while maintaining structured inputs.

---

## 3. Duplicate Collision Handling (Invisible Records)

### Decision
Catch DB unique constraint violation errors server-side and return a localized, helpful error message in Arabic:
`"رقم الهاتف مسجل بالفعل لمنشأة أخرى. يرجى التواصل مع المشرف الخاص بك للمساعدة."`
(Phone number is already registered for another facility. Please contact your supervisor for assistance.)

### Rationale
Due to role-based visibility, a Sales User might attempt to create a facility with a phone number that is owned by another Sales User (meaning it is invisible to them). Revealing the name of the existing facility or the other sales representative's name would leak tenant-scoped or rep-scoped data. The routed message prevents duplicate lead entry without violating data privacy.

---

## 4. Database-Level RLS & Authorization

### Decision
Utilize Row Level Security (RLS) policies on `public.facilities` and `public.facility_activity` tables.

* **Helpers**: Reuse the `get_active_company_id()` helper from Feature 001.
* **RLS Policies**:
  * **Sales User**: Can SELECT and UPDATE only if `company_id = get_active_company_id() AND assigned_to = auth.uid() AND is_archived = false`. Can INSERT within their own company.
  * **Supervisor / Company Admin**: Can SELECT, INSERT, and UPDATE if `company_id = get_active_company_id()`.
  * **Super Admin**: Can perform all actions scoped by cookie/session company switcher override.

### Rationale
Maintains the Core Principle I (Isolation) and II (RBAC, Deny by Default) of the NEBRASGOO Constitution.
