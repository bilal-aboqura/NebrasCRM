import type { FollowUpOutcome, FollowUpRow, FollowUpStatus, FollowUpType } from "./database";

export type { FollowUpOutcome, FollowUpRow, FollowUpStatus, FollowUpType };

export interface CreateFollowUpInput {
  facility_id: string;
  type: FollowUpType;
  due_at: string;
  assigned_to?: string;
  contact_id?: string;
  notes?: string;
}

export interface CompleteFollowUpInput {
  outcome?: FollowUpOutcome;
  outcome_note?: string;
  callLog?: {
    channel: "call" | "whatsapp";
    outcome: "answered" | "no_answer" | "busy" | "wrong_number" | "callback_requested" | "not_reachable";
    durationSeconds?: number;
    notes?: string;
  };
}

export type FollowUpView = "all_pending" | "done" | "cancelled" | "overdue" | "today" | "upcoming";

export interface GetFollowUpsInput {
  status?: FollowUpStatus;
  view?: FollowUpView;
  assigned_to?: string;
  limit?: number;
  page?: number;
}

export interface FollowUpRecord extends FollowUpRow {
  facility?: { id: string; name_ar: string; is_active: boolean } | null;
  owner?: { id: string; display_name: string } | null;
  contact?: { id: string; name_ar: string } | null;
  is_overdue?: boolean;
  due_state?: "overdue" | "today" | "upcoming" | null;
}

const TYPES = new Set<FollowUpType>(["call", "visit", "send_offer", "other"]);
const OUTCOMES: Record<FollowUpType, readonly FollowUpOutcome[]> = {
  call: ["answered", "no_answer", "callback_requested", "not_interested"],
  visit: ["met_decision_maker", "no_show", "rescheduled", "followup_needed"],
  send_offer: ["offer_sent", "feedback_received", "offer_rejected", "offer_accepted"],
  other: ["task_completed", "postponed"],
};

export function validateFutureDueAt(value: string): string {
  const dueAt = new Date(value);
  if (!value || Number.isNaN(dueAt.getTime()) || dueAt.getTime() < Date.now() + 60_000) {
    throw new Error("تاريخ الاستحقاق يجب أن يكون في المستقبل بدقيقة واحدة على الأقل.");
  }
  return dueAt.toISOString();
}

export function validateCreateFollowUp(input: CreateFollowUpInput): CreateFollowUpInput {
  if (!input.facility_id) throw new Error("المنشأة مطلوبة.");
  if (!TYPES.has(input.type)) throw new Error("نوع المتابعة غير صالح.");
  return {
    ...input,
    due_at: validateFutureDueAt(input.due_at),
    assigned_to: input.assigned_to?.trim() || undefined,
    contact_id: input.contact_id?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };
}

export function validateOutcome(type: FollowUpType, outcome?: FollowUpOutcome) {
  if (outcome && !OUTCOMES[type].includes(outcome)) throw new Error("نتيجة المتابعة لا تتوافق مع نوعها.");
}

export const OUTCOMES_BY_TYPE = OUTCOMES;
