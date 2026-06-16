# Research: Follow-up Management

This document summarizes the technical choices, decisions, and patterns selected for implementing Follow-up Management.

---

## 1. Timezone-Consistent Overdue Logic

### Decision
Calculate all overdue and due-date boundaries server-side using PostgreSQL timezone conversion targeting `Asia/Riyadh` (Saudi Arabian Standard Time, UTC+3).

* **Database Comparison**:
  * Since PostgreSQL stores `timestamptz` in UTC internally, direct timestamp comparisons (`due_at < NOW()`) are timezone-independent and work correctly regardless of client locale.
  * To determine if a follow-up is "Due Today" in Saudi Arabia:
    ```sql
    (due_at AT TIME ZONE 'Asia/Riyadh')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Riyadh')::date
    ```
  * To determine if a follow-up is "Upcoming" (after today in Riyadh):
    ```sql
    (due_at AT TIME ZONE 'Asia/Riyadh')::date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Riyadh')::date
    ```
* **TypeScript Helper**:
  In Next.js Server Actions, dates are normalized to UTC but parsed and formatted using `Intl.DateTimeFormat` with `timeZone: 'Asia/Riyadh'` to display consistent date/time strings to users.

### Rationale
Ensures that all users see the exact same overdue status for any given item, eliminating client-side device timezone drift.

---

## 2. Facility Owner Reassignment Cascade

### Decision
Implement the automatic reassignment of pending follow-ups when a facility owner changes using a combined approach of PostgreSQL triggers (for simple reassignment) and transaction logic in the Next.js Server Action (to handle the "unassigned" manager fallback).

* **Trigger for Sales-to-Sales Transition**:
  An `AFTER UPDATE ON public.facilities` trigger executes:
  ```sql
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    -- Update pending followups assigned to the old facility owner
    UPDATE public.followups
    SET assigned_to = NEW.assigned_to
    WHERE facility_id = NEW.id
      AND status = 'pending'
      AND assigned_to = OLD.assigned_to;
  END IF;
  ```
* **Server Action for Unassigned Transition (Manager Fallback)**:
  When a manager changes a facility's owner to `NULL` (unassigned), the Next.js Server Action `reassignFacility` performs the update inside a single database transaction:
  1. Set `facilities.assigned_to = NULL`.
  2. Update pending follow-ups originally owned by the departed sales user to the logged-in manager's ID (`auth.uid()`).
  3. Write activity entries (`followup_reassigned`) to the `facility_activity` timeline detailing the transfer.

### Rationale
Guarantees database-level atomic integrity during ownership handovers. Reassigning tasks to the acting manager when a facility becomes unassigned avoids leaving orphaned pending tasks in the workload of a deactivated or reassigned rep.

---

## 3. Type-Aware Outcome Selection

### Decision
Define a structured outcome enum schema mapping to each follow-up type, allowing quick-select tags in the UI while keeping the outcome notes optional.

* **Call Outcomes**:
  * `answered` (تم الرد)
  * `no_answer` (لم يتم الرد)
  * `callback_requested` (طلب إعادة اتصال)
  * `not_interested` (غير مهتم)
* **Visit Outcomes**:
  * `met_decision_maker` (تمت مقابلة صاحب القرار)
  * `no_show` (لم يحضر الطرف الآخر)
  * `rescheduled` (تم التأجيل/إعادة الجدولة)
  * `followup_needed` (بحاجة لمتابعة إضافية)
* **Offer Outcomes**:
  * `offer_sent` (تم إرسال العرض)
  * `feedback_received` (تم تلقي ملاحظات)
  * `offer_rejected` (تم رفض العرض)
  * `offer_accepted` (تم قبول العرض)
* **Other Outcomes**:
  * `task_completed` (تم إنجاز المهمة)
  * `postponed` (تم التأجيل)

### Rationale
Simplifies data entry on mobile/tablet screens for sales reps on the field. They can tap the outcome in 1 second, with the option to type detailed notes only when necessary.
