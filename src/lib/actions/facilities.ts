"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/context";
import type { AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/utils/phone";

export type FacilityType = "medical_complex" | "dental_complex" | "lab" | "radiology" | "hospital";
export type LeadSource = "manual" | "website_form" | "imported";
export type FacilityStatus = "new" | "contacted" | "interested" | "offer" | "negotiation" | "contract" | "lost";
export type CreateFacilityInput = {
  name_ar: string;
  type: FacilityType;
  region_id: string;
  city_id: string;
  city_custom?: string;
  primary_phone: string;
  secondary_phone?: string;
  lead_source: LeadSource;
  assigned_to?: string | null;
  notes?: string;
};
export type UpdateFacilityInput = Partial<CreateFacilityInput> & { status?: FacilityStatus };
export type GetFacilitiesInput = {
  page?: number;
  limit?: number;
  search?: string;
  status?: FacilityStatus | "";
  type?: FacilityType | "";
  region_id?: string;
  city_id?: string;
  assigned_to?: string;
  show_archived?: boolean;
};
export type FacilityActionResult<T> = { success: true; data: T } | { success: false; error: string };

const MANAGEMENT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);
const TYPES = new Set<FacilityType>(["medical_complex", "dental_complex", "lab", "radiology", "hospital"]);
const SOURCES = new Set<LeadSource>(["manual", "website_form", "imported"]);
const STATUSES = new Set<FacilityStatus>(["new", "contacted", "interested", "offer", "negotiation", "contract", "lost"]);
const DUPLICATE_PHONE = "رقم الهاتف الرئيسي مسجل بالفعل لمنشأة أخرى في الشركة. يرجى التواصل مع المشرف الخاص بك للمساعدة.";
const UNAUTHORIZED = "غير مصرح لك بإجراء هذا التعديل.";
const ARCHIVE_UNAUTHORIZED = "صلاحية الأرشفة والاستعادة مخصصة للمشرفين والمدراء فقط.";

function fail(error: unknown): { success: false; error: string } {
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "23505" || candidate.message?.includes("idx_facilities_phone_unique_per_company")) {
    return { success: false, error: DUPLICATE_PHONE };
  }
  return { success: false, error: error instanceof Error ? error.message : "تعذر إتمام العملية." };
}

function activeCompany(context: AuthContext): string {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

function isManagement(context: AuthContext) {
  return MANAGEMENT_ROLES.has(context.role);
}

function validateCreate(input: CreateFacilityInput) {
  if (input.name_ar.trim().length < 2) throw new Error("اسم المنشأة مطلوب.");
  if (!TYPES.has(input.type)) throw new Error("نوع المنشأة غير صالح.");
  if (!SOURCES.has(input.lead_source)) throw new Error("مصدر العميل غير صالح.");
  if (!input.region_id || !input.city_id) throw new Error("المنطقة والمدينة مطلوبتان.");
  if (!normalizePhone(input.primary_phone)) throw new Error("رقم الهاتف الرئيسي غير صالح.");
}

async function validateOwner(companyId: string, ownerId: string | null | undefined) {
  if (!ownerId) return null;
  const { data } = await createAdminClient().from("profiles").select("id").eq("id", ownerId)
    .eq("company_id", companyId).eq("role", "sales_user").eq("status", "active").maybeSingle();
  if (!data) throw new Error("مسؤول المنشأة يجب أن يكون مستخدم مبيعات نشطاً من الشركة نفسها.");
  return data.id as string;
}

async function validateGeography(regionId: string, cityId: string, customCity?: string) {
  const { data } = await createAdminClient().from("cities").select("id,region_id,name_en").eq("id", cityId).eq("region_id", regionId).maybeSingle();
  if (!data) throw new Error("المدينة المحددة لا تتبع المنطقة المختارة.");
  if (data.name_en === "Other" && !customCity?.trim()) throw new Error("يرجى كتابة اسم المدينة الأخرى.");
}

export async function getFacilityOptions() {
  const context = await requireAuth();
  const companyId = activeCompany(context);
  const admin = createAdminClient();
  const [{ data: regions }, { data: cities }, { data: owners }] = await Promise.all([
    admin.from("regions").select("id,name_ar").order("name_ar"),
    admin.from("cities").select("id,region_id,name_ar,name_en").order("name_ar"),
    admin.from("profiles").select("id,display_name,status").eq("company_id", companyId).eq("role", "sales_user").order("display_name"),
  ]);
  return { regions: regions ?? [], cities: cities ?? [], owners: owners ?? [], canAssign: isManagement(context), currentUserId: context.userId };
}

export async function createFacility(input: CreateFacilityInput): Promise<FacilityActionResult<Record<string, unknown>>> {
  try {
    validateCreate(input);
    const context = await requireAuth();
    const companyId = activeCompany(context);
    await validateGeography(input.region_id, input.city_id, input.city_custom);
    const assignedTo = context.role === "sales_user" ? context.userId : await validateOwner(companyId, input.assigned_to);
    const admin = createAdminClient();
    const { data, error } = await admin.from("facilities").insert({
      company_id: companyId,
      name_ar: input.name_ar.trim(),
      type: input.type,
      region_id: input.region_id,
      city_id: input.city_id,
      city_custom: input.city_custom?.trim() || null,
      primary_phone: input.primary_phone.trim(),
      primary_phone_normalized: normalizePhone(input.primary_phone),
      secondary_phone: input.secondary_phone?.trim() || null,
      lead_source: input.lead_source,
      assigned_to: assignedTo,
      notes: input.notes?.trim() || null,
      created_by: context.userId,
    }).select("*").single();
    if (error) throw error;
    const { error: activityError } = await admin.from("facility_activity").insert({ company_id: companyId, facility_id: data.id, actor_id: context.userId, event_type: "created", new_value: data.name_ar });
    if (activityError) throw activityError;
    revalidatePath("/dashboard/facilities");
    return { success: true, data };
  } catch (error) {
    return fail(error);
  }
}

export async function getFacilitiesList(params: GetFacilitiesInput = {}) {
  try {
    const context = await requireAuth();
    const companyId = activeCompany(context);
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const limit = Math.min(15, Math.max(1, Math.floor(params.limit ?? 15)));
    let query = createAdminClient().from("facilities")
      .select("id,name_ar,type,primary_phone,secondary_phone,status,is_active,created_at,city_custom,assigned_to,regions(name_ar),cities(name_ar),owner:profiles!facilities_assigned_to_fkey(display_name,status)", { count: "exact" })
      .eq("company_id", companyId);
    if (context.role === "sales_user") query = query.eq("assigned_to", context.userId).eq("is_active", true);
    else query = query.eq("is_active", params.show_archived ? false : true);
    const search = params.search?.trim();
    if (search) query = query.or(`name_ar.ilike.%${search.replace(/[,%]/g, "") }%,primary_phone.ilike.%${search.replace(/[,%]/g, "")}%,secondary_phone.ilike.%${search.replace(/[,%]/g, "")}%`);
    if (params.status && STATUSES.has(params.status)) query = query.eq("status", params.status);
    if (params.type && TYPES.has(params.type)) query = query.eq("type", params.type);
    if (params.region_id) query = query.eq("region_id", params.region_id);
    if (params.city_id) query = query.eq("city_id", params.city_id);
    if (params.assigned_to && isManagement(context)) query = query.eq("assigned_to", params.assigned_to);
    const from = (page - 1) * limit;
    const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + limit - 1);
    if (error) throw error;
    const total = count ?? 0;
    return { success: true as const, data: { records: data ?? [], meta: { total, page, pages: Math.max(1, Math.ceil(total / limit)) } } };
  } catch (error) {
    return fail(error);
  }
}

export async function getFacilityDetail(id: string) {
  try {
    const context = await requireAuth();
    const companyId = activeCompany(context);
    let query = createAdminClient().from("facilities")
      .select("*,regions(name_ar),cities(name_ar,name_en),owner:profiles!facilities_assigned_to_fkey(id,display_name,status),companies(name_ar,whatsapp_template)")
      .eq("id", id).eq("company_id", companyId);
    if (context.role === "sales_user") query = query.eq("assigned_to", context.userId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("المنشأة غير موجودة أو لا تملك صلاحية عرضها.");
    return { success: true as const, data, canManage: isManagement(context), canEdit: data.is_active || isManagement(context) };
  } catch (error) {
    return fail(error);
  }
}

export async function getFacilityActivity(id: string) {
  const detail = await getFacilityDetail(id);
  if (!detail.success) return detail;
  const { data, error } = await createAdminClient().from("facility_activity")
    .select("id,event_type,old_value,new_value,created_at,actor:profiles!facility_activity_actor_id_fkey(display_name)")
    .eq("facility_id", id).eq("company_id", detail.data.company_id).order("created_at", { ascending: false });
  if (error) return fail(error);
  return { success: true as const, data: data ?? [] };
}

export async function updateFacility(id: string, input: UpdateFacilityInput): Promise<FacilityActionResult<Record<string, unknown>>> {
  try {
    const context = await requireAuth();
    const companyId = activeCompany(context);
    const admin = createAdminClient();
    let currentQuery = admin.from("facilities").select("*").eq("id", id).eq("company_id", companyId);
    if (context.role === "sales_user") currentQuery = currentQuery.eq("assigned_to", context.userId).eq("is_active", true);
    const { data: current } = await currentQuery.maybeSingle();
    if (!current) throw new Error(UNAUTHORIZED);
    if (context.role === "sales_user" && Object.prototype.hasOwnProperty.call(input, "assigned_to") && input.assigned_to !== current.assigned_to) throw new Error(UNAUTHORIZED);

    const changes: Record<string, unknown> = {};
    if (input.name_ar !== undefined) {
      if (input.name_ar.trim().length < 2) throw new Error("اسم المنشأة مطلوب.");
      changes.name_ar = input.name_ar.trim();
    }
    if (input.type !== undefined) {
      if (!TYPES.has(input.type)) throw new Error("نوع المنشأة غير صالح.");
      changes.type = input.type;
    }
    if (input.lead_source !== undefined) {
      if (!SOURCES.has(input.lead_source)) throw new Error("مصدر العميل غير صالح.");
      changes.lead_source = input.lead_source;
    }
    if (input.status !== undefined) {
      if (!STATUSES.has(input.status)) throw new Error("حالة المنشأة غير صالحة.");
      changes.status = input.status;
    }
    if (input.primary_phone !== undefined) {
      if (!normalizePhone(input.primary_phone)) throw new Error("رقم الهاتف الرئيسي غير صالح.");
      changes.primary_phone = input.primary_phone.trim();
      changes.primary_phone_normalized = normalizePhone(input.primary_phone);
    }
    if (input.secondary_phone !== undefined) changes.secondary_phone = input.secondary_phone.trim() || null;
    if (input.notes !== undefined) changes.notes = input.notes.trim() || null;
    if (input.city_custom !== undefined) changes.city_custom = input.city_custom.trim() || null;
    const regionId = input.region_id ?? current.region_id;
    const cityId = input.city_id ?? current.city_id;
    if (input.region_id !== undefined || input.city_id !== undefined || input.city_custom !== undefined) {
      await validateGeography(regionId, cityId, input.city_custom ?? current.city_custom);
      changes.region_id = regionId;
      changes.city_id = cityId;
    }
    if (Object.prototype.hasOwnProperty.call(input, "assigned_to") && isManagement(context)) {
      changes.assigned_to = await validateOwner(companyId, input.assigned_to);
    }

    const { data, error } = await admin.from("facilities").update(changes).eq("id", id).eq("company_id", companyId).select("*").single();
    if (error) throw error;
    const activity = [];
    if (data.status !== current.status) activity.push({ company_id: companyId, facility_id: id, actor_id: context.userId, event_type: "status_change", old_value: current.status, new_value: data.status });
    if (data.assigned_to !== current.assigned_to) activity.push({ company_id: companyId, facility_id: id, actor_id: context.userId, event_type: "owner_change", old_value: current.assigned_to, new_value: data.assigned_to });
    if (!activity.length) activity.push({ company_id: companyId, facility_id: id, actor_id: context.userId, event_type: "edited", old_value: null, new_value: data.name_ar });
    const { error: activityError } = await admin.from("facility_activity").insert(activity);
    if (activityError) throw activityError;
    revalidatePath("/dashboard/facilities");
    revalidatePath(`/dashboard/facilities/${id}`);
    return { success: true, data };
  } catch (error) {
    return fail(error);
  }
}

async function setFacilityActive(id: string, active: boolean): Promise<FacilityActionResult<{ is_active: boolean }>> {
  try {
    const context = await requireAuth();
    if (!isManagement(context)) throw new Error(ARCHIVE_UNAUTHORIZED);
    const companyId = activeCompany(context);
    const admin = createAdminClient();
    const { data, error } = await admin.from("facilities").update({
      is_active: active,
      archived_at: active ? null : new Date().toISOString(),
      archived_by: active ? null : context.userId,
    }).eq("id", id).eq("company_id", companyId).eq("is_active", !active).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("المنشأة غير موجودة أو حالتها لم تتغير.");
    const { error: activityError } = await admin.from("facility_activity").insert({
      company_id: companyId, facility_id: id, actor_id: context.userId,
      event_type: active ? "recovered" : "archived", old_value: String(!active), new_value: String(active),
    });
    if (activityError) throw activityError;
    revalidatePath("/dashboard/facilities");
    revalidatePath(`/dashboard/facilities/${id}`);
    return { success: true, data: { is_active: active } };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveFacility(id: string) {
  return setFacilityActive(id, false);
}

export async function recoverFacility(id: string) {
  return setFacilityActive(id, true);
}

export async function reassignFacility(id: string, assignedTo: string | null): Promise<FacilityActionResult<Record<string, unknown>>> {
  try {
    const context = await requireAuth();
    if (!isManagement(context)) throw new Error(UNAUTHORIZED);
    const companyId = activeCompany(context);
    const ownerId = await validateOwner(companyId, assignedTo);
    const { data, error } = await createAdminClient().rpc("reassign_facility_atomic", {
      p_company_id: companyId,
      p_facility_id: id,
      p_actor_id: context.userId,
      p_assigned_to: ownerId,
    });
    if (error) throw error;
    revalidatePath("/dashboard/facilities");
    revalidatePath(`/dashboard/facilities/${id}`);
    revalidatePath("/dashboard/followups");
    return { success: true, data: data as Record<string, unknown> };
  } catch (error) {
    return fail(error);
  }
}
