"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/context";
import type { AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateCreateCallLog,
  type CallLogPage,
  type CallLogRow,
  type CreateCallLogInput,
  type UpdateCallLogInput,
} from "@/lib/types/call-logs";

export type CallLogActionResult<T> = { success: true; data: T } | { success: false; error: string };

const MANAGEMENT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);
const DENIED = "غير مصرح لك بإدارة سجل الاتصالات لهذه المنشأة.";

function activeCompany(context: AuthContext) {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

function isManagement(context: AuthContext) { return MANAGEMENT_ROLES.has(context.role); }

function fail(error: unknown): { success: false; error: string } {
  const candidate = error as { code?: string; message?: string };
  const message = candidate.message ?? "";
  if (candidate.code === "42501" || message.includes("access denied")) return { success: false, error: DENIED };
  if (candidate.code === "40001" || message.includes("concurrent update")) return { success: false, error: "تم تعديل السجل من مستخدم آخر. حدّث الصفحة وحاول مجدداً." };
  if (message.includes("24 hours")) return { success: false, error: "لا يمكن تعديل السجل بعد مرور 24 ساعة من إنشائه." };
  if (candidate.code === "23503" || message.includes("does not belong")) return { success: false, error: "جهة الاتصال أو المتابعة لا تنتمي إلى هذه المنشأة." };
  if (candidate.code === "23514" || message.includes("future")) return { success: false, error: "لا يمكن أن يكون وقت الاتصال في المستقبل." };
  return { success: false, error: candidate.message ?? "تعذر إتمام العملية." };
}

async function requireFacilityAccess(facilityId: string, context: AuthContext, requireActive = true) {
  const companyId = activeCompany(context);
  let query = createAdminClient().from("facilities").select("id,company_id,assigned_to,is_active")
    .eq("id", facilityId).eq("company_id", companyId);
  if (context.role === "sales_user") query = query.eq("assigned_to", context.userId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data || (requireActive && !data.is_active)) throw new Error(DENIED);
  return { companyId, facility: data };
}

async function requireLogAccess(id: string, context: AuthContext, requireActive = true) {
  const companyId = activeCompany(context);
  const { data, error } = await createAdminClient().from("call_logs")
    .select("id,facility_id,company_id,created_by_id,created_at,is_archived,version")
    .eq("id", id).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(DENIED);
  await requireFacilityAccess(data.facility_id, context, requireActive);
  return { companyId, log: data };
}

function refresh(facilityId: string) {
  revalidatePath(`/dashboard/facilities/${facilityId}`);
}

export async function createCallLog(input: CreateCallLogInput): Promise<CallLogActionResult<CallLogRow>> {
  try {
    const clean = validateCreateCallLog(input);
    const context = await requireAuth();
    const { companyId } = await requireFacilityAccess(clean.facilityId, context);
    const { data, error } = await createAdminClient().rpc("create_call_log_atomic", {
      p_company_id: companyId,
      p_facility_id: clean.facilityId,
      p_actor_id: context.userId,
      p_input: {
        contact_id: clean.contactId ?? null,
        followup_id: clean.followupId ?? null,
        channel: clean.channel,
        direction: clean.direction,
        occurred_at: clean.occurredAt,
        outcome: clean.outcome,
        duration_seconds: clean.durationSeconds ?? null,
        notes: clean.notes ?? null,
        complete_followup: Boolean(clean.completeFollowUp),
      },
    });
    if (error) throw error;
    refresh(clean.facilityId);
    return { success: true, data: data as CallLogRow };
  } catch (error) { return fail(error); }
}

export async function updateCallLog(id: string, input: UpdateCallLogInput): Promise<CallLogActionResult<CallLogRow>> {
  try {
    if (!id || !Number.isInteger(input.version)) throw new Error("بيانات السجل غير صالحة.");
    if (input.durationSeconds !== undefined && (!Number.isInteger(input.durationSeconds) || input.durationSeconds < 0 || input.durationSeconds > 86_400)) throw new Error("مدة الاتصال غير صالحة.");
    const context = await requireAuth();
    const { companyId, log } = await requireLogAccess(id, context);
    if (!isManagement(context) && (log.created_by_id !== context.userId || Date.now() - new Date(log.created_at).getTime() > 86_400_000)) throw new Error("24 hours edit lock");
    const { data, error } = await createAdminClient().rpc("update_call_log_atomic", {
      p_company_id: companyId, p_call_log_id: id, p_actor_id: context.userId, p_expected_version: input.version,
      p_input: { outcome: input.outcome, duration_seconds: input.durationSeconds ?? null, notes: input.notes?.trim() || null },
    });
    if (error) throw error;
    refresh(log.facility_id);
    return { success: true, data: data as CallLogRow };
  } catch (error) { return fail(error); }
}

export async function archiveCallLog(id: string): Promise<CallLogActionResult<void>> {
  try {
    const context = await requireAuth();
    if (!isManagement(context)) throw new Error(DENIED);
    const { companyId, log } = await requireLogAccess(id, context);
    const { error } = await createAdminClient().rpc("archive_call_log_atomic", { p_company_id: companyId, p_call_log_id: id, p_actor_id: context.userId });
    if (error) throw error;
    refresh(log.facility_id);
    return { success: true, data: undefined };
  } catch (error) { return fail(error); }
}

export async function recoverCallLog(id: string): Promise<CallLogActionResult<void>> {
  try {
    const context = await requireAuth();
    if (!isManagement(context)) throw new Error(DENIED);
    const { companyId, log } = await requireLogAccess(id, context);
    const { error } = await createAdminClient().rpc("recover_call_log_atomic", { p_company_id: companyId, p_call_log_id: id, p_actor_id: context.userId });
    if (error) throw error;
    refresh(log.facility_id);
    return { success: true, data: undefined };
  } catch (error) { return fail(error); }
}

export async function getFacilityCallLogs(facilityId: string, page = 1, includeArchived = false): Promise<CallLogActionResult<CallLogPage> & { canManage?: boolean; currentUserId?: string }> {
  try {
    const context = await requireAuth();
    const { companyId, facility } = await requireFacilityAccess(facilityId, context, false);
    if (!facility.is_active) return { success: true, data: { records: [], meta: { total: 0, page: 1, pages: 1, limit: 10 } }, canManage: isManagement(context), currentUserId: context.userId };
    if (includeArchived && !isManagement(context)) throw new Error(DENIED);
    const safePage = Math.max(1, Math.floor(page));
    const limit = 10;
    const from = (safePage - 1) * limit;
    let query = createAdminClient().from("call_logs").select(
      "*,creator:profiles!call_logs_created_by_id_fkey(id,display_name),contact:contacts(id,name_ar)", { count: "exact" },
    ).eq("company_id", companyId).eq("facility_id", facilityId).eq("is_archived", includeArchived);
    const { data, count, error } = await query.order("occurred_at", { ascending: false }).range(from, from + limit - 1);
    if (error) throw error;
    const total = count ?? 0;
    return {
      success: true,
      data: { records: (data ?? []) as unknown as CallLogPage["records"], meta: { total, page: safePage, pages: Math.max(1, Math.ceil(total / limit)), limit } },
      canManage: isManagement(context), currentUserId: context.userId,
    };
  } catch (error) { return fail(error); }
}
