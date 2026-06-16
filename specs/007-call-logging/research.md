# Research: Call and Communication Logging

This document summarizes the technical choices, decisions, and patterns selected for implementing Call and Communication Logging.

---

## 1. Focus-Triggered Quick-Log Banner

### Decision
Implement the quick-log prompt as a client-side React component (`QuickLogBanner`) that detects when the CRM tab/window regains focus or visibility after a user triggers a click-to-call (`tel:`) or WhatsApp (`wa.me`) link.

* **Tracking Interaction Context**:
  When a user clicks a `tel:` or `wa.me` link, the component stores the interaction metadata in local state (or a React context/session state):
  ```typescript
  {
    facilityId: string;
    contactId?: string;
    channel: 'call' | 'whatsapp';
    clickedAt: number;
  }
  ```
* **Event Listeners**:
  Listen to the browser's `visibilitychange` and `focus` events:
  ```typescript
  useEffect(() => {
    const handleFocus = () => {
      // If we have stored interaction context, and it was clicked recently (e.g. within 5 minutes),
      // and the banner is not already active, show the quick-log banner.
      if (pendingContext && Date.now() - pendingContext.clickedAt < 300000) {
        setShowBanner(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [pendingContext]);
  ```
* **UI Design**:
  A floating banner positioned at the bottom of the viewport with a warm cream background, gold highlights, and deep green buttons (adhering to the platform design system). The banner shows:
  - "هل تم الاتصال بـ [اسم جهة الاتصال]؟" (Was the contact with [Contact Name] completed?)
  - An outcome dropdown (Answered, No Answer, Busy, etc.).
  - A text input for short notes.
  - Buttons: "حفظ" (Save) and "تجاهل" (Dismiss).
  - It is completely non-blocking: the user can ignore it and click anywhere else on the CRM, or explicitly close it.

### Rationale
Because the browser cannot detect the actual outcome or duration of native phone dialer calls or WhatsApp messages directly, we rely on the user to self-report. Triggering on focus/visibility regain captures the user's attention right when they return to the CRM application after making the call, maximizing completion rates.

---

## 2. Server-Enforced 24-Hour Edit Window

### Decision
Enforce the 24-hour edit lock window strictly at the database/API level via a PostgreSQL trigger or RLS check, as client-side locks can be bypassed.

* **Database Constraint Trigger**:
  An `BEFORE UPDATE ON public.call_logs` trigger enforces the edit window restriction:
  ```sql
  CREATE OR REPLACE FUNCTION check_call_log_edit_window()
  RETURNS TRIGGER AS $$
  DECLARE
    user_role text;
  BEGIN
    -- Get active user role from JWT claims
    user_role := auth.jwt() ->> 'role';

    -- Managers (supervisor, company_admin, super_admin) can edit anytime
    IF user_role IN ('supervisor', 'company_admin', 'super_admin') THEN
      RETURN NEW;
    END IF;

    -- Creators (sales_users) are locked out after 24 hours from creation
    IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
      RAISE EXCEPTION 'Editing this call log is locked after 24 hours. Only managers can edit past this window.'
        USING ERRCODE = 'check_violation';
    END IF;

    -- Ensure occurred_at and immutable fields are not modified
    IF OLD.occurred_at IS DISTINCT FROM NEW.occurred_at OR OLD.channel IS DISTINCT FROM NEW.channel OR OLD.direction IS DISTINCT FROM NEW.direction THEN
      RAISE EXCEPTION 'Immutable communication details (occurred_at, channel, direction) cannot be edited.'
        USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
* **Client UI Integration**:
  The Next.js client component computes the elapsed time. If the elapsed time is > 24 hours and the current user is not a manager, the "Edit" button is hidden/disabled, and a lock icon is displayed.

### Rationale
Guarantees the historical audit trail's integrity. Sales reps can quickly correct spelling errors or outcomes on the same day, but cannot alter the logs weeks later to artificially inflate call metrics. Managers can always correct records for accuracy.

---

## 3. Outcome-Aware Atomic Follow-up Completion

### Decision
When linking a call log to a pending follow-up, the completion check toggle's default value will automatically adjust based on the selected outcome.

* **Outcome Mapping Table**:
  - `answered` (تم الرد) -> **Checked** by default.
  - `callback_requested` (طلب إعادة اتصال) -> **Checked** by default.
  - `no_answer` (لم يرد) -> **Unchecked** by default.
  - `busy` (مشغول) -> **Unchecked** by default.
  - `wrong_number` (رقم خاطئ) -> **Unchecked** by default.
  - `not_reachable` (غير متاح) -> **Unchecked** by default.
* **Rescheduling Offer for Unsuccessful Outcomes**:
  If the outcome is marked unsuccessful (e.g. `busy`, `no_answer`), and the toggle is unchecked, the UI displays a link/button: "إعادة جدولة المتابعة" (Reschedule follow-up), allowing the user to select a new date/time.
* **Atomic PostgreSQL Transaction**:
  The Next.js Server Action `createCallLog` performs the operations in a single database transaction:
  1. Insert `call_logs` record.
  2. If the completion toggle is checked and a `followup_id` is linked:
     - Execute the follow-up completion logic: Update `followups` set status to `done`, save completion details.
     - Insert `followup_complete` event into `facility_activity`.
  3. Insert `call_logged` event into `facility_activity`.

### Rationale
Minimizes administrative friction for representatives. For successful calls, they log the call and mark the task completed in a single step. For unsuccessful attempts, they leave the task open and are prompted to reschedule it immediately.
