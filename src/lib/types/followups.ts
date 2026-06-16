export type FollowupType = 'call' | 'visit' | 'send_offer' | 'other';
export type FollowupStatus = 'pending' | 'done' | 'cancelled';
export type FollowupOutcome =
  | 'answered' | 'no_answer' | 'callback_requested' | 'not_interested'
  | 'met_decision_maker' | 'no_show' | 'rescheduled' | 'followup_needed'
  | 'offer_sent' | 'feedback_received' | 'offer_rejected' | 'offer_accepted'
  | 'task_completed' | 'postponed';

export interface CreateFollowUpInput {
  facility_id: string;
  type: FollowupType;
  due_at: string;
  assigned_to?: string;
  contact_id?: string;
  notes?: string;
}

export interface CompleteFollowUpInput {
  outcome?: FollowupOutcome;
  outcome_note?: string;
}

export interface GetFollowUpsInput {
  status?: FollowupStatus;
  assigned_to?: string;
  limit?: number;
  page?: number;
}

export interface FollowUpRecord {
  id: string;
  company_id: string;
  facility_id: string;
  contact_id: string | null;
  assigned_to: string;
  type: FollowupType;
  due_at: string;
  status: FollowupStatus;
  notes: string | null;
  outcome: FollowupOutcome | null;
  outcome_note: string | null;
  cancel_reason: string | null;
  completed_by: string | null;
  completed_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  facility_name?: string;
  assigned_name?: string;
}

export function validateFutureDate(dateStr: string): string | null {
  if (!dateStr) return 'تاريخ الاستحقاق مطلوب';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'تاريخ غير صحيح';
  if (date <= new Date()) return 'تاريخ الاستحقاق يجب أن يكون في المستقبل';
  return null;
}
