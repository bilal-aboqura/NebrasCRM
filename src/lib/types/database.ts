export type FollowUpType = "call" | "visit" | "send_offer" | "other";
export type FollowUpStatus = "pending" | "done" | "cancelled";
export type FollowUpOutcome =
  | "answered" | "no_answer" | "callback_requested" | "not_interested"
  | "met_decision_maker" | "no_show" | "rescheduled" | "followup_needed"
  | "offer_sent" | "feedback_received" | "offer_rejected" | "offer_accepted"
  | "task_completed" | "postponed";

export interface FollowUpRow {
  id: string;
  company_id: string;
  facility_id: string;
  contact_id: string | null;
  assigned_to: string;
  type: FollowUpType;
  due_at: string;
  status: FollowUpStatus;
  notes: string | null;
  outcome: FollowUpOutcome | null;
  outcome_note: string | null;
  cancel_reason: string | null;
  completed_by: string | null;
  completed_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

