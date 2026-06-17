"use server";

import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { assertCanManageFacility } from "@/lib/auth/rbac-guards";
import { addActivity, db, nextId } from "@/lib/data/store";
import type { FollowUp } from "@/lib/types/domain";
import { createFollowUpSchema, type CreateFollowUpInput } from "@/lib/types/followups";

export async function createFollowUp(input: CreateFollowUpInput) {
  const parsed = createFollowUpSchema.parse(input);
  const context = await getAuthContext();
  const facility = db.facilities.find((item) => item.id === parsed.facilityId);
  if (!facility) throw new Error("Facility not found");
  assertCanManageFacility(context.role, context.user.id, facility);
  if (parsed.contactId && !db.contacts.some((contact) => contact.id === parsed.contactId && contact.facilityId === parsed.facilityId)) {
    throw new Error("Contact does not belong to facility");
  }
  const followUp: FollowUp = {
    id: nextId("fu", db.followUps),
    companyId: facility.companyId,
    facilityId: parsed.facilityId,
    contactId: parsed.contactId,
    ownerId: facility.ownerId ?? context.user.id,
    type: parsed.type,
    status: "pending",
    dueAt: parsed.dueAt,
    notes: parsed.notes
  };
  db.followUps.push(followUp);
  addActivity({ companyId: followUp.companyId, facilityId: followUp.facilityId, kind: "followup_created", message: "تمت جدولة متابعة" });
  return followUp;
}

export async function completeFollowUp(id: string, outcome: string, callLogId?: string) {
  const followUp = db.followUps.find((item) => item.id === id);
  if (!followUp) throw new Error("Follow-up not found");
  followUp.status = "done";
  followUp.outcome = outcome;
  addActivity({ companyId: followUp.companyId, facilityId: followUp.facilityId, kind: "followup_complete", message: callLogId ? "تم إتمام المتابعة وتسجيل التواصل" : "تم إتمام المتابعة" });
  return followUp;
}

export async function cancelFollowUp(id: string, notes?: string) {
  const followUp = db.followUps.find((item) => item.id === id);
  if (!followUp) throw new Error("Follow-up not found");
  followUp.status = "cancelled";
  followUp.notes = notes ?? followUp.notes;
  addActivity({ companyId: followUp.companyId, facilityId: followUp.facilityId, kind: "followup_cancelled", message: "تم إلغاء المتابعة" });
  return followUp;
}

export async function reassignFollowUp(id: string, ownerId: string) {
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  const followUp = db.followUps.find((item) => item.id === id);
  if (!followUp) throw new Error("Follow-up not found");
  followUp.ownerId = ownerId;
  addActivity({ companyId: followUp.companyId, facilityId: followUp.facilityId, kind: "followup_reassigned", message: "تمت إعادة إسناد المتابعة" });
  return followUp;
}

export async function getFollowUps(options: { status?: FollowUp["status"]; ownerId?: string } = {}) {
  const context = await getAuthContext();
  return db.followUps.filter((followUp) => {
    const facility = db.facilities.find((item) => item.id === followUp.facilityId);
    if (!facility || facility.isArchived) return false;
    if (context.role !== "super_admin" && followUp.companyId !== context.activeCompany.id) return false;
    if (!canManageCompanyWide(context.role) && followUp.ownerId !== context.user.id) return false;
    if (options.status && followUp.status !== options.status) return false;
    if (options.ownerId && followUp.ownerId !== options.ownerId) return false;
    return true;
  });
}
