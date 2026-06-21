export type CommunicationChannel = "call" | "whatsapp";
export type CommunicationDirection = "inbound" | "outbound";
export type CommunicationOutcome =
  | "answered"
  | "no_answer"
  | "busy"
  | "wrong_number"
  | "callback_requested"
  | "not_reachable";

export interface CallLogRow {
  id: string;
  company_id: string;
  facility_id: string;
  contact_id: string | null;
  followup_id: string | null;
  created_by_id: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  occurred_at: string;
  outcome: CommunicationOutcome;
  duration_seconds: number | null;
  notes: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by_id: string | null;
  created_at: string;
  updated_at: string;
  last_edited_by_id: string | null;
  last_edited_at: string | null;
  version: number;
}

export interface CallLogRecord extends CallLogRow {
  creator?: { id: string; display_name: string } | null;
  contact?: { id: string; name_ar: string } | null;
}

export interface CreateCallLogInput {
  facilityId: string;
  contactId?: string;
  followupId?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  occurredAt?: string | Date;
  outcome: CommunicationOutcome;
  durationSeconds?: number;
  notes?: string;
  completeFollowUp?: boolean;
}

export interface UpdateCallLogInput {
  outcome: CommunicationOutcome;
  durationSeconds?: number;
  notes?: string;
  version: number;
}

export interface CallLogPage {
  records: CallLogRecord[];
  meta: { total: number; page: number; pages: number; limit: number };
}

export const COMMUNICATION_LABELS = {
  channels: { call: "مكالمة هاتفية", whatsapp: "واتساب" },
  directions: { inbound: "وارد", outbound: "صادر" },
  outcomes: {
    answered: "تم الرد",
    no_answer: "لم يرد",
    busy: "مشغول",
    wrong_number: "رقم خاطئ",
    callback_requested: "طلب إعادة اتصال",
    not_reachable: "غير متاح",
  },
} as const;

export const SUCCESSFUL_OUTCOMES = new Set<CommunicationOutcome>(["answered", "callback_requested"]);

export function defaultCompleteFollowUp(outcome: CommunicationOutcome) {
  return SUCCESSFUL_OUTCOMES.has(outcome);
}

export function canEditCallLog(createdAt: string, creatorId: string, userId: string, canManage: boolean, now = Date.now()) {
  return canManage || (creatorId === userId && now - new Date(createdAt).getTime() <= 24 * 60 * 60 * 1000);
}

export function validateCreateCallLog(input: CreateCallLogInput): CreateCallLogInput & { occurredAt: string } {
  const channels = new Set<CommunicationChannel>(["call", "whatsapp"]);
  const directions = new Set<CommunicationDirection>(["inbound", "outbound"]);
  const outcomes = new Set<CommunicationOutcome>(Object.keys(COMMUNICATION_LABELS.outcomes) as CommunicationOutcome[]);
  if (!input.facilityId) throw new Error("المنشأة مطلوبة.");
  if (!channels.has(input.channel) || !directions.has(input.direction) || !outcomes.has(input.outcome)) throw new Error("بيانات الاتصال غير صالحة.");
  const occurredAt = new Date(input.occurredAt ?? Date.now());
  if (Number.isNaN(occurredAt.getTime()) || occurredAt.getTime() > Date.now() + 60_000) throw new Error("لا يمكن أن يكون وقت الاتصال في المستقبل.");
  if (input.durationSeconds !== undefined && (!Number.isInteger(input.durationSeconds) || input.durationSeconds < 0 || input.durationSeconds > 86_400)) throw new Error("مدة الاتصال غير صالحة.");
  if ((input.notes?.length ?? 0) > 5000) throw new Error("الملاحظات طويلة جداً.");
  return {
    ...input,
    occurredAt: occurredAt.toISOString(),
    contactId: input.contactId?.trim() || undefined,
    followupId: input.followupId?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };
}
