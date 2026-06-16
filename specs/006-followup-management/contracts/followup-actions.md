# Server Actions Contract: Follow-up Management

This document defines the TypeScript interface contracts for Next.js Server Actions used in Follow-up Management. All actions enforce tenant isolation, role-based permissions, and data constraints server-side.

---

## 1. Create Follow-up

Schedules a new follow-up task on a facility.

- **Action Name**: `createFollowUp`
- **File Location**: `@/lib/actions/followups.ts`
- **Parameters**: `data: CreateFollowUpInput`
  ```typescript
  interface CreateFollowUpInput {
    facility_id: string;
    type: 'call' | 'visit' | 'send_offer' | 'other';
    due_at: string; // ISO-8601 string, must be in the future
    assigned_to?: string; // Optional, defaults to facility owner or creator
    contact_id?: string; // Optional, must belong to same facility
    notes?: string;
  }
  ```

### 1.1 Response (Success)
```typescript
{
  success: true,
  data: {
    id: "e5a8f23c-1234-4bc4-9d8e-4a6f23bcf856",
    facility_id: "...",
    type: "call",
    due_at: "2026-06-17T10:00:00Z",
    status: "pending",
    assigned_to: "...",
    ...
  }
}
```

### 1.2 Response (Validation Error - Past Date or Invalid Contact)
```typescript
{
  success: false,
  error: "تاريخ الاستحقاق يجب أن يكون في المستقبل." // or "جهة الاتصال المحددة لا تنتمي إلى هذه المنشأة."
}
```

---

## 2. Complete Follow-up

Marks a pending follow-up as completed and records outcome tags/notes.

- **Action Name**: `completeFollowUp`
- **File Location**: `@/lib/actions/followups.ts`
- **Parameters**: `id: string, data: CompleteFollowUpInput`
  ```typescript
  interface CompleteFollowUpInput {
    outcome?: 'answered' | 'no_answer' | 'callback_requested' | 'not_interested' | 
              'met_decision_maker' | 'no_show' | 'rescheduled' | 'followup_needed' | 
              'offer_sent' | 'feedback_received' | 'offer_rejected' | 'offer_accepted' | 
              'task_completed' | 'postponed';
    outcome_note?: string; // Optional free-text outcome details
  }
  ```

### 2.1 Response (Success)
```typescript
{
  success: true,
  data: {
    id: "...",
    status: "done",
    completed_by: "...",
    completed_at: "2026-06-16T19:40:00Z",
    outcome: "answered",
    outcome_note: "..."
  }
}
```

---

## 3. Reschedule Follow-up

Updates the due date and time of a pending follow-up.

- **Action Name**: `rescheduleFollowUp`
- **File Location**: `@/lib/actions/followups.ts`
- **Parameters**: `id: string, due_at: string`

### 3.1 Response (Success)
```typescript
{
  success: true,
  data: {
    id: "...",
    due_at: "2026-06-20T11:00:00Z"
  }
}
```

---

## 4. Cancel Follow-up

Soft-cancels a pending follow-up with a reason, keeping it in history.

- **Action Name**: `cancelFollowUp`
- **File Location**: `@/lib/actions/followups.ts`
- **Parameters**: `id: string, cancel_reason?: string`

### 4.1 Response (Success)
```typescript
{
  success: true,
  data: {
    id: "...",
    status: "cancelled",
    cancel_reason: "..."
  }
}
```

---

## 5. Reassign Follow-up (Management Only)

Reassigns the owner of a follow-up to another sales rep within the company.

- **Action Name**: `reassignFollowUp`
- **File Location**: `@/lib/actions/followups.ts`
- **Parameters**: `id: string, assigned_to: string`

### 5.1 Response (Success)
```typescript
{
  success: true,
  data: {
    id: "...",
    assigned_to: "..."
  }
}
```

### 5.2 Response (Unauthorized)
Returned if a Sales User attempts to call this action:
```typescript
{
  success: false,
  error: "تعديل المسؤول المعين متاح فقط للمشرفين والمدراء."
}
```

---

## 6. Get Follow-ups List

Fetches a list of follow-ups for the workboard, filtered by tenant isolation and owner constraints.

- **Action Name**: `getFollowUpsList`
- **File Location**: `@/lib/actions/followups.ts`
- **Parameters**: `params: GetFollowUpsInput`
  ```typescript
  interface GetFollowUpsInput {
    status?: 'pending' | 'done' | 'cancelled';
    assigned_to?: string; // Optional, filter by rep (Management only)
    limit?: number;       // Default: 50
    page?: number;        // Default: 1
  }
  ```

### 6.1 Response (Success)
```typescript
{
  success: true,
  data: {
    records: FollowUpRecord[],
    meta: {
      total: number,
      page: number,
      pages: number
    }
  }
}
```
