"use server";

import { headers } from "next/headers";
import { isRateLimited } from "@/lib/rate-limit/memory";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSaudiPhone, normalizePhone } from "@/lib/utils/phone";
import type { FacilityType } from "@/lib/actions/facilities";

const FACILITY_TYPES = new Set<FacilityType>([
  "medical_complex",
  "dental_complex",
  "lab",
  "radiology",
  "hospital",
]);

const SUCCESS_MESSAGE = "تم استلام طلبك بنجاح، سيتواصل معك فريق نبراس الجودة قريباً";
const DUPLICATE_MESSAGE = "تم تسجيل طلبك مسبقاً، سيتواصل معك فريقنا قريباً";
const RATE_LIMIT_MESSAGE = "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً";
const SERVER_ERROR_MESSAGE = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.";

export interface LeadSubmissionPayload {
  facilityName: string;
  city: string;
  phone: string;
  facilityType: FacilityType;
}

type FieldErrors = Partial<Record<keyof LeadSubmissionPayload, string[]>>;

export type LeadSubmissionResult =
  | { success: true; duplicate: false; facilityId: string; recovered?: boolean; message: string }
  | { success: true; duplicate: true; message: string }
  | { success: false; rateLimited?: boolean; errors?: FieldErrors; message?: string };

type CompanyRow = { id: string };
type ExistingFacility = { id: string; is_active: boolean; notes: string | null };

function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

function validatePayload(payload: unknown) {
  const input = payload && typeof payload === "object"
    ? payload as Partial<Record<keyof LeadSubmissionPayload, unknown>>
    : {};
  const facilityName = sanitizeString(input.facilityName, 200);
  const city = sanitizeString(input.city, 100);
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const facilityType = typeof input.facilityType === "string" ? input.facilityType : "";
  const errors: FieldErrors = {};

  if (facilityName.length < 2) errors.facilityName = ["اسم المنشأة مطلوب ويجب ألا يقل عن حرفين"];
  if (!city) errors.city = ["المدينة مطلوبة"];
  if (!isValidSaudiPhone(phone)) errors.phone = ["رقم الجوال المدخل غير صحيح"];
  if (!FACILITY_TYPES.has(facilityType as FacilityType)) errors.facilityType = ["نوع المنشأة غير صالح"];

  return {
    errors,
    value: { facilityName, city, phone, facilityType: facilityType as FacilityType },
  };
}

function clientIp(): string {
  const requestHeaders = headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")?.trim()
    || "unknown";
}

export async function resolvePublicLeadCompanyId(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const configuredId = process.env.DEFAULT_LEAD_COMPANY_ID?.trim();
  if (configuredId) {
    const { data, error } = await admin.from("companies")
      .select("id")
      .eq("id", configuredId)
      .eq("active", true)
      .maybeSingle();
    if (!error && data) return (data as CompanyRow).id;
    console.warn("DEFAULT_LEAD_COMPANY_ID is unavailable; using the primary active company.");
  } else {
    console.warn("DEFAULT_LEAD_COMPANY_ID is not configured; using the primary active company.");
  }

  const { data, error } = await admin.from("companies")
    .select("id")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) throw error ?? new Error("No active company is available for public leads.");
  return (data as CompanyRow).id;
}

export async function submitLeadAction(payload: LeadSubmissionPayload): Promise<LeadSubmissionResult> {
  const { errors, value } = validatePayload(payload);
  if (Object.keys(errors).length > 0) return { success: false, errors };

  if (isRateLimited(clientIp())) {
    return { success: false, rateLimited: true, message: RATE_LIMIT_MESSAGE };
  }

  try {
    const admin = createAdminClient();
    const companyId = await resolvePublicLeadCompanyId(admin);
    const normalizedPhone = normalizePhone(value.phone);
    const { data: existingData, error: duplicateError } = await admin.from("facilities")
      .select("id,is_active,notes")
      .eq("primary_phone_normalized", normalizedPhone)
      .order("is_active", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (duplicateError) throw duplicateError;

    const existing = existingData as ExistingFacility | null;
    if (existing?.is_active) {
      return { success: true, duplicate: true, message: DUPLICATE_MESSAGE };
    }

    const cityNote = `المدينة المدخلة: ${value.city}`;
    if (existing) {
      const notes = existing.notes?.trim() ? `${existing.notes.trim()}\n${cityNote}` : cityNote;
      const { data, error } = await admin.from("facilities").update({
        company_id: companyId,
        name_ar: value.facilityName,
        type: value.facilityType,
        city_custom: value.city,
        primary_phone: value.phone,
        primary_phone_normalized: normalizedPhone,
        status: "new",
        lead_source: "website_form",
        assigned_to: null,
        is_active: true,
        archived_at: null,
        archived_by: null,
        notes,
      }).eq("id", existing.id).select("id").single();
      if (error || !data) throw error ?? new Error("Unable to reactivate lead.");

      const { error: activityError } = await admin.from("facility_activity").insert({
        company_id: companyId,
        facility_id: existing.id,
        actor_id: null,
        event_type: "recovered",
        new_value: "إعادة تفعيل المنشأة عبر نموذج الموقع",
      });
      if (activityError) throw activityError;
      return { success: true, duplicate: false, facilityId: existing.id, recovered: true, message: SUCCESS_MESSAGE };
    }

    const { data, error } = await admin.from("facilities").insert({
      company_id: companyId,
      name_ar: value.facilityName,
      type: value.facilityType,
      region_id: null,
      city_id: null,
      city_custom: value.city,
      primary_phone: value.phone,
      primary_phone_normalized: normalizedPhone,
      secondary_phone: null,
      status: "new",
      lead_source: "website_form",
      assigned_to: null,
      is_active: true,
      notes: cityNote,
      created_by: null,
    }).select("id,name_ar").single();
    if (error || !data) throw error ?? new Error("Unable to create lead.");

    const facility = data as { id: string };
    const { error: activityError } = await admin.from("facility_activity").insert({
      company_id: companyId,
      facility_id: facility.id,
      actor_id: null,
      event_type: "created",
      new_value: "إنشاء المنشأة عبر نموذج الموقع",
    });
    if (activityError) throw activityError;
    return { success: true, duplicate: false, facilityId: facility.id, message: SUCCESS_MESSAGE };
  } catch (error) {
    console.error("Public lead submission failed", error);
    return { success: false, message: SERVER_ERROR_MESSAGE };
  }
}
