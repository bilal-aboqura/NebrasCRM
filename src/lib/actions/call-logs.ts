"use server";

import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { assertCanManageFacility } from "@/lib/auth/rbac-guards";
import { completeFollowUp } from "@/lib/actions/followups";
import { addActivity, db, nextId, nowIso } from "@/lib/data/store";
import type { CallLog } from "@/lib/types/domain";

export interface CallLogInput {
  facilityId: string;
  contactId?: string;
  followUpId?: string;
  channel: CallLog["channel"];
  direction: CallLog["direction"];
  outcome: CallLog["outcome"];
  occurredAt?: string;
  notes?: string;
  completeLinkedFollowUp?: boolean;
}

export async function createCallLog(input: CallLogInput) {
  const context = await getAuthContext();
  const facility = db.facilities.find((item) => item.id === input.facilityId);
  if (!facility) throw new Error("Facility not found");
  assertCanManageFacility(context.role, context.user.id, facility);
  if (input.contactId && !db.contacts.some((contact) => contact.id === input.contactId && contact.facilityId === input.facilityId)) {
    throw new Error("Contact does not belong to facility");
  }
  if (input.followUpId && !db.followUps.some((followUp) => followUp.id === input.followUpId && followUp.facilityId === input.facilityId)) {
    throw new Error("Follow-up does not belong to facility");
  }
  const occurredAt = input.occurredAt ?? nowIso();
  if (new Date(occurredAt).getTime() > Date.now()) throw new Error("Cannot log future communication");
  const callLog: CallLog = {
    id: nextId("call", db.callLogs),
    companyId: facility.companyId,
    facilityId: input.facilityId,
    contactId: input.contactId,
    followUpId: input.followUpId,
    channel: input.channel,
    direction: input.direction,
    outcome: input.outcome,
    occurredAt,
    notes: input.notes,
    isArchived: false
  };
  db.callLogs.push(callLog);
  addActivity({ companyId: callLog.companyId, facilityId: callLog.facilityId, kind: "call_logged", message: "تم تسجيل تواصل جديد" });
  if (input.completeLinkedFollowUp && input.followUpId) await completeFollowUp(input.followUpId, input.outcome, callLog.id);
  return callLog;
}

export async function getCallLogs(facilityId: string) {
  const context = await getAuthContext();
  const facility = db.facilities.find((item) => item.id === facilityId);
  if (!facility || facility.isArchived) return [];
  assertCanManageFacility(context.role, context.user.id, facility);
  return db.callLogs.filter((log) => log.facilityId === facilityId && !log.isArchived).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export async function updateCallLog(id: string, input: Partial<Pick<CallLog, "outcome" | "notes">>) {
  const context = await getAuthContext();
  const callLog = db.callLogs.find((item) => item.id === id);
  if (!callLog) throw new Error("Call log not found");
  const ageMs = Date.now() - new Date(callLog.occurredAt).getTime();
  if (!canManageCompanyWide(context.role) && ageMs > 24 * 60 * 60 * 1000) throw new Error("Edit window expired");
  Object.assign(callLog, input);
  addActivity({ companyId: callLog.companyId, facilityId: callLog.facilityId, kind: "call_log_edited", message: "تم تعديل سجل التواصل" });
  return callLog;
}

export async function archiveCallLog(id: string) {
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  const callLog = db.callLogs.find((item) => item.id === id);
  if (!callLog) throw new Error("Call log not found");
  callLog.isArchived = true;
  addActivity({ companyId: callLog.companyId, facilityId: callLog.facilityId, kind: "call_log_archived", message: "تمت أرشفة سجل تواصل" });
  return callLog;
}

export async function recoverCallLog(id: string) {
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  const callLog = db.callLogs.find((item) => item.id === id);
  if (!callLog) throw new Error("Call log not found");
  callLog.isArchived = false;
  addActivity({ companyId: callLog.companyId, facilityId: callLog.facilityId, kind: "call_log_recovered", message: "تمت استعادة سجل تواصل" });
  return callLog;
}
