"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/context";
import type { AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSaudiPhone } from "@/lib/utils/phone";

export type Contact = {
  id: string;
  company_id: string;
  facility_id: string;
  name_ar: string;
  job_title: string;
  primary_phone: string;
  primary_phone_normalized: string;
  secondary_phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateContactInput = {
  name_ar: string;
  job_title: string;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  is_primary?: boolean;
  notes?: string;
};
export type UpdateContactInput = Partial<CreateContactInput>;
export type ContactActionResult<T> = { success: true; data: T } | { success: false; error: string };

const MANAGEMENT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DENIED = "غير مصرح لك بإدارة جهات الاتصال لهذه المنشأة.";
const ARCHIVED_FACILITY = "لا يمكن تعديل جهات الاتصال في منشأة مؤرشفة. استعد المنشأة أولاً.";
const RECOVERY_DENIED = "استعادة جهات الاتصال المؤرشفة متاحة للمشرفين والمدراء فقط.";

function activeCompany(context: AuthContext) {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

function fail(error: unknown): { success: false; error: string } {
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "42501" || candidate.message?.includes("access denied")) return { success: false, error: DENIED };
  if (candidate.code === "23505") return { success: false, error: "تعذر تعيين جهة الاتصال الرئيسية. يرجى المحاولة مرة أخرى." };
  return { success: false, error: candidate.message ?? "تعذر إتمام العملية." };
}

function validateInput(input: UpdateContactInput, creating = false) {
  if (creating || input.name_ar !== undefined) {
    if (!input.name_ar || input.name_ar.trim().length < 2 || input.name_ar.trim().length > 150) throw new Error("الاسم بالعربية مطلوب وبحد أقصى 150 حرفاً.");
  }
  if (creating || input.job_title !== undefined) {
    if (!input.job_title || input.job_title.trim().length < 2 || input.job_title.trim().length > 100) throw new Error("المسمى الوظيفي مطلوب وبحد أقصى 100 حرف.");
  }
  if (creating || input.primary_phone !== undefined) {
    if (!input.primary_phone || !isValidSaudiPhone(input.primary_phone)) throw new Error("رقم الهاتف غير صالح. أدخل رقماً سعودياً صحيحاً.");
  }
  if (input.secondary_phone?.trim() && !isValidSaudiPhone(input.secondary_phone)) throw new Error("رقم الهاتف الثانوي غير صالح.");
  if (input.email?.trim() && !EMAIL_PATTERN.test(input.email.trim())) throw new Error("البريد الإلكتروني غير صالح.");
}

function cleanInput(input: UpdateContactInput) {
  const clean: Record<string, string | boolean> = {};
  if (input.name_ar !== undefined) clean.name_ar = input.name_ar.trim();
  if (input.job_title !== undefined) clean.job_title = input.job_title.trim();
  if (input.primary_phone !== undefined) clean.primary_phone = input.primary_phone.trim();
  if (input.secondary_phone !== undefined) clean.secondary_phone = input.secondary_phone.trim();
  if (input.email !== undefined) clean.email = input.email.trim().toLowerCase();
  if (input.is_primary !== undefined) clean.is_primary = input.is_primary;
  if (input.notes !== undefined) clean.notes = input.notes.trim();
  return clean;
}

async function requireFacilityAccess(facilityId: string, context: AuthContext, requireActive = false) {
  const companyId = activeCompany(context);
  let query = createAdminClient().from("facilities").select("id,company_id,assigned_to,is_active").eq("id", facilityId).eq("company_id", companyId);
  if (context.role === "sales_user") query = query.eq("assigned_to", context.userId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(DENIED);
  if (requireActive && !data.is_active) throw new Error(ARCHIVED_FACILITY);
  return { facility: data, companyId };
}

async function requireContactAccess(contactId: string, context: AuthContext, requireActiveFacility = false) {
  const companyId = activeCompany(context);
  const { data, error } = await createAdminClient().from("contacts").select("id,facility_id,company_id,is_archived").eq("id", contactId).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(DENIED);
  await requireFacilityAccess(data.facility_id, context, requireActiveFacility);
  return { contact: data, companyId };
}

export async function getFacilityContacts(facilityId: string, showArchived = false): Promise<ContactActionResult<Contact[]>> {
  try {
    const context = await requireAuth();
    const { companyId, facility } = await requireFacilityAccess(facilityId, context);
    if (!facility.is_active) return { success: true, data: [] };
    if (showArchived && !MANAGEMENT_ROLES.has(context.role)) throw new Error(RECOVERY_DENIED);
    let query = createAdminClient().from("contacts").select("*").eq("facility_id", facilityId).eq("company_id", companyId);
    query = query.eq("is_archived", showArchived);
    const { data, error } = await query.order("is_primary", { ascending: false }).order("created_at", { ascending: true });
    if (error) throw error;
    return { success: true, data: (data ?? []) as Contact[] };
  } catch (error) {
    return fail(error);
  }
}

export async function createContact(facilityId: string, input: CreateContactInput): Promise<ContactActionResult<Contact>> {
  try {
    validateInput(input, true);
    const context = await requireAuth();
    const { companyId } = await requireFacilityAccess(facilityId, context, true);
    const { data, error } = await createAdminClient().rpc("create_contact_atomic", {
      p_company_id: companyId, p_facility_id: facilityId, p_actor_id: context.userId, p_input: cleanInput(input),
    });
    if (error) throw error;
    revalidatePath(`/dashboard/facilities/${facilityId}`);
    return { success: true, data: data as Contact };
  } catch (error) {
    return fail(error);
  }
}

export async function updateContact(contactId: string, input: UpdateContactInput): Promise<ContactActionResult<Contact>> {
  try {
    validateInput(input);
    if (!Object.keys(input).length) throw new Error("لا توجد تغييرات للحفظ.");
    const context = await requireAuth();
    const { contact, companyId } = await requireContactAccess(contactId, context, true);
    if (contact.is_archived) throw new Error("لا يمكن تعديل جهة اتصال مؤرشفة.");
    const { data, error } = await createAdminClient().rpc("update_contact_atomic", {
      p_company_id: companyId, p_contact_id: contactId, p_actor_id: context.userId, p_input: cleanInput(input),
    });
    if (error) throw error;
    revalidatePath(`/dashboard/facilities/${contact.facility_id}`);
    return { success: true, data: data as Contact };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveContact(contactId: string): Promise<ContactActionResult<Contact>> {
  try {
    const context = await requireAuth();
    const { contact, companyId } = await requireContactAccess(contactId, context, true);
    if (contact.is_archived) throw new Error("جهة الاتصال مؤرشفة بالفعل.");
    const { data, error } = await createAdminClient().rpc("archive_contact_atomic", {
      p_company_id: companyId, p_contact_id: contactId, p_actor_id: context.userId,
    });
    if (error) throw error;
    revalidatePath(`/dashboard/facilities/${contact.facility_id}`);
    return { success: true, data: data as Contact };
  } catch (error) {
    return fail(error);
  }
}

export async function recoverContact(contactId: string): Promise<ContactActionResult<Contact>> {
  try {
    const context = await requireAuth();
    if (!MANAGEMENT_ROLES.has(context.role)) throw new Error(RECOVERY_DENIED);
    const { contact, companyId } = await requireContactAccess(contactId, context, true);
    if (!contact.is_archived) throw new Error("جهة الاتصال نشطة بالفعل.");
    const { data, error } = await createAdminClient().rpc("recover_contact_atomic", {
      p_company_id: companyId, p_contact_id: contactId, p_actor_id: context.userId,
    });
    if (error) throw error;
    revalidatePath(`/dashboard/facilities/${contact.facility_id}`);
    return { success: true, data: data as Contact };
  } catch (error) {
    return fail(error);
  }
}
