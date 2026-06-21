"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/context";
import type { AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateCreateFollowUp,
  validateFutureDueAt,
  type CompleteFollowUpInput,
  type CreateFollowUpInput,
  type FollowUpRecord,
  type FollowUpRow,
  type GetFollowUpsInput,
} from "@/lib/types/followups";

export type FollowUpActionResult<T> = { success: true; data: T } | { success: false; error: string };

const MANAGEMENT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);
const ACCESS_DENIED = "غير مصرح لك بإدارة هذه المتابعة.";

function activeCompany(context: AuthContext) {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

function isManagement(context: AuthContext) {
  return MANAGEMENT_ROLES.has(context.role);
}

function fail(error: unknown): { success: false; error: string } {
  const candidate = error as { code?: string; message?: string };
  const message = candidate.message ?? "";
  if (candidate.code === "42501" || message.includes("access denied")) return { success: false, error: ACCESS_DENIED };
  if (candidate.code === "22007" || message.includes("due date")) return { success: false, error: "تاريخ الاستحقاق يجب أن يكون في المستقبل بدقيقة واحدة على الأقل." };
  if (candidate.code === "23503" || message.includes("contact does not belong")) return { success: false, error: "جهة الاتصال المحددة لا تنتمي إلى هذه المنشأة." };
  if (message.includes("not pending")) return { success: false, error: "لا يمكن تعديل متابعة مكتملة أو ملغاة." };
  if (message.includes("invalid followup owner")) return { success: false, error: "المسؤول المحدد غير نشط أو لا ينتمي إلى الشركة." };
  if (message.includes("outcome does not match")) return { success: false, error: "نتيجة المتابعة لا تتوافق مع نوعها." };
  return { success: false, error: error instanceof Error ? error.message : "تعذر إتمام العملية." };
}

async function requireFacilityAccess(facilityId: string, context: AuthContext, requireActive = true) {
  const companyId = activeCompany(context);
  let query = createAdminClient().from("facilities")
    .select("id,company_id,assigned_to,is_active")
    .eq("id", facilityId).eq("company_id", companyId);
  if (context.role === "sales_user") query = query.eq("assigned_to", context.userId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data || (requireActive && !data.is_active)) throw new Error(ACCESS_DENIED);
  return { companyId, facility: data };
}

function refreshFollowUps(facilityId?: string) {
  revalidatePath("/dashboard/followups");
  if (facilityId) revalidatePath(`/dashboard/facilities/${facilityId}`);
}

export async function createFollowUp(input: CreateFollowUpInput): Promise<FollowUpActionResult<FollowUpRow>> {
  try {
    const clean = validateCreateFollowUp(input);
    const context = await requireAuth();
    const { companyId } = await requireFacilityAccess(clean.facility_id, context);
    const { data, error } = await createAdminClient().rpc("create_followup_atomic", {
      p_company_id: companyId,
      p_facility_id: clean.facility_id,
      p_actor_id: context.userId,
      p_input: {
        type: clean.type, due_at: clean.due_at, assigned_to: clean.assigned_to,
        contact_id: clean.contact_id, notes: clean.notes,
      },
    });
    if (error) throw error;
    refreshFollowUps(clean.facility_id);
    return { success: true, data: data as FollowUpRow };
  } catch (error) {
    return fail(error);
  }
}

export async function completeFollowUp(id: string, input: CompleteFollowUpInput = {}): Promise<FollowUpActionResult<FollowUpRow>> {
  try {
    if (!id) throw new Error("معرف المتابعة مطلوب.");
    const context = await requireAuth();
    const companyId = activeCompany(context);
    const { data, error } = input.callLog
      ? await createAdminClient().rpc("complete_followup_with_call_log_atomic", {
        p_company_id: companyId, p_followup_id: id, p_actor_id: context.userId,
        p_followup_outcome: input.outcome ?? null, p_outcome_note: input.outcome_note?.trim() || null,
        p_call_input: {
          channel: input.callLog.channel, direction: "outbound", outcome: input.callLog.outcome,
          duration_seconds: input.callLog.durationSeconds ?? null,
          notes: input.callLog.notes?.trim() || input.outcome_note?.trim() || null,
        },
      })
      : await createAdminClient().rpc("complete_followup_atomic", {
        p_company_id: companyId, p_followup_id: id, p_actor_id: context.userId,
        p_outcome: input.outcome ?? null, p_outcome_note: input.outcome_note?.trim() || null,
      });
    if (error) throw error;
    refreshFollowUps((data as FollowUpRow).facility_id);
    return { success: true, data: data as FollowUpRow };
  } catch (error) {
    return fail(error);
  }
}

export async function rescheduleFollowUp(id: string, dueAt: string): Promise<FollowUpActionResult<FollowUpRow>> {
  try {
    const due_at = validateFutureDueAt(dueAt);
    const context = await requireAuth();
    const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc("reschedule_followup_atomic", {
      p_company_id: companyId, p_followup_id: id, p_actor_id: context.userId, p_due_at: due_at,
    });
    if (error) throw error;
    refreshFollowUps((data as FollowUpRow).facility_id);
    return { success: true, data: data as FollowUpRow };
  } catch (error) {
    return fail(error);
  }
}

export async function cancelFollowUp(id: string, cancelReason?: string): Promise<FollowUpActionResult<FollowUpRow>> {
  try {
    const context = await requireAuth();
    const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc("cancel_followup_atomic", {
      p_company_id: companyId, p_followup_id: id, p_actor_id: context.userId,
      p_cancel_reason: cancelReason?.trim() || null,
    });
    if (error) throw error;
    refreshFollowUps((data as FollowUpRow).facility_id);
    return { success: true, data: data as FollowUpRow };
  } catch (error) {
    return fail(error);
  }
}

export async function reassignFollowUp(id: string, assignedTo: string): Promise<FollowUpActionResult<FollowUpRow>> {
  try {
    const context = await requireAuth();
    if (!isManagement(context)) throw new Error(ACCESS_DENIED);
    if (!assignedTo) throw new Error("يرجى اختيار المسؤول الجديد.");
    const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc("reassign_followup_atomic", {
      p_company_id: companyId, p_followup_id: id, p_actor_id: context.userId, p_assigned_to: assignedTo,
    });
    if (error) throw error;
    refreshFollowUps((data as FollowUpRow).facility_id);
    return { success: true, data: data as FollowUpRow };
  } catch (error) {
    return fail(error);
  }
}

export async function getFollowUpOptions(facilityId?: string) {
  try {
    const context = await requireAuth();
    const companyId = activeCompany(context);
    let facility: { id: string; assigned_to: string | null; is_active: boolean } | null = null;
    if (facilityId) facility = (await requireFacilityAccess(facilityId, context, false)).facility;
    const admin = createAdminClient();
    const ownersPromise = admin.from("profiles").select("id,display_name,role,status")
      .eq("company_id", companyId).eq("status", "active").order("display_name");
    const contactsPromise = facilityId
      ? admin.from("contacts").select("id,name_ar").eq("company_id", companyId)
        .eq("facility_id", facilityId).eq("is_archived", false).order("name_ar")
      : Promise.resolve({ data: [], error: null });
    const [{ data: owners, error: ownersError }, { data: contacts, error: contactsError }] = await Promise.all([ownersPromise, contactsPromise]);
    if (ownersError) throw ownersError;
    if (contactsError) throw contactsError;
    return {
      success: true as const,
      data: {
        owners: owners ?? [], contacts: contacts ?? [], canManage: isManagement(context),
        currentUserId: context.userId, defaultOwnerId: facility?.assigned_to ?? context.userId,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function getFacilityFollowUps(facilityId: string): Promise<FollowUpActionResult<FollowUpRecord[]>> {
  try {
    const context = await requireAuth();
    const { companyId, facility } = await requireFacilityAccess(facilityId, context, false);
    if (!facility.is_active) return { success: true, data: [] };
    const { data, error } = await createAdminClient().from("followups")
      .select("*,owner:profiles!followups_assigned_to_fkey(id,display_name),contact:contacts(id,name_ar)")
      .eq("company_id", companyId).eq("facility_id", facilityId)
      .order("status", { ascending: false }).order("due_at", { ascending: true });
    if (error) throw error;
    return { success: true, data: decorateFollowUps((data ?? []) as unknown as FollowUpRecord[]) };
  } catch (error) {
    return fail(error);
  }
}

function riyadhDayBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const start = new Date(Date.UTC(value("year"), value("month") - 1, value("day"), -3));
  return { start: start.toISOString(), end: new Date(start.getTime() + 86_400_000).toISOString(), now: now.toISOString() };
}

function decorateFollowUps(records: FollowUpRecord[], now = new Date()): FollowUpRecord[] {
  const bounds = riyadhDayBounds(now);
  const nowMs = now.getTime();
  const endMs = new Date(bounds.end).getTime();
  return records.map((record) => {
    if (record.status !== "pending") return { ...record, is_overdue: false, due_state: null };
    const dueMs = new Date(record.due_at).getTime();
    const due_state = dueMs < nowMs ? "overdue" : dueMs < endMs ? "today" : "upcoming";
    return { ...record, is_overdue: due_state === "overdue", due_state };
  });
}

export async function getFollowUpsList(params: GetFollowUpsInput = {}) {
  try {
    const context = await requireAuth();
    const companyId = activeCompany(context);
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 50)));
    const view = params.view ?? (params.status === "done" ? "done" : params.status === "cancelled" ? "cancelled" : "all_pending");
    const bounds = riyadhDayBounds();
    let query = createAdminClient().from("followups").select(
      "*,facility:facilities!inner(id,name_ar,is_active),owner:profiles!followups_assigned_to_fkey(id,display_name),contact:contacts(id,name_ar)",
      { count: "exact" },
    ).eq("company_id", companyId).eq("facilities.is_active", true);
    query = query.eq("status", view === "done" ? "done" : view === "cancelled" ? "cancelled" : "pending");
    if (context.role === "sales_user") query = query.eq("assigned_to", context.userId);
    else if (params.assigned_to) query = query.eq("assigned_to", params.assigned_to);
    if (view === "overdue") query = query.lt("due_at", bounds.now);
    if (view === "today") query = query.gte("due_at", bounds.now).lt("due_at", bounds.end);
    if (view === "upcoming") query = query.gte("due_at", bounds.end);
    const from = (page - 1) * limit;
    const { data, count, error } = await query.order("due_at", { ascending: true }).range(from, from + limit - 1);
    if (error) throw error;
    const total = count ?? 0;
    return {
      success: true as const,
      data: { records: decorateFollowUps((data ?? []) as unknown as FollowUpRecord[]), meta: { total, page, pages: Math.max(1, Math.ceil(total / limit)) } },
      canManage: isManagement(context),
    };
  } catch (error) {
    return fail(error);
  }
}
