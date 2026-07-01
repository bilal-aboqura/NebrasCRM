"use server";

import { headers } from "next/headers";
import { resolvePublicLeadCompanyId } from "@/lib/actions/lead-capture";
import { loadPublishedAssessmentData } from "@/lib/assessment/visibility";
import { isRateLimited } from "@/lib/rate-limit/memory";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSaudiPhone, normalizePhone } from "@/lib/utils/phone";
import type { FacilityType } from "@/hooks/use-cbahi-session";

export type SharedAssessmentAnswer = {
  itemCode: string;
  value: "1" | "0.5" | "0" | "na";
  notes?: string;
};

export type SharedAssessmentLeadInput = {
  facilityName: string;
  contactName: string;
  city: string;
  phone: string;
  email?: string;
  facilityType: FacilityType;
  answers: SharedAssessmentAnswer[];
};

export type SharedAssessmentLeadResult =
  | { success: true; leadId: string; score: number }
  | { success: false; message: string };

const VALUES = new Set(["1", "0.5", "0", "na"]);

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/<[^>]*>/g, "").trim().slice(0, max)
    : "";
}

function requestIp() {
  const requestHeaders = headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")?.trim()
    || "unknown";
}

async function validate(input: SharedAssessmentLeadInput) {
  const facilityName = clean(input.facilityName, 200);
  const contactName = clean(input.contactName, 120);
  const city = clean(input.city, 100);
  const phone = clean(input.phone, 30);
  const email = clean(input.email, 160).toLowerCase();

  if (facilityName.length < 2 || contactName.length < 2 || city.length < 2) {
    throw new Error("يرجى استكمال اسم المنشأة واسم مسؤول التواصل والمدينة.");
  }
  if (!isValidSaudiPhone(phone)) throw new Error("رقم الجوال المدخل غير صحيح.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("البريد الإلكتروني غير صحيح.");
  if (input.facilityType !== "general" && input.facilityType !== "dental") throw new Error("نوع المنشأة غير صالح.");

  const assessmentData = await loadPublishedAssessmentData();
  const standards = new Map(
    assessmentData[input.facilityType].chapters.flatMap((chapter) =>
      chapter.items.map((item) => [item.code, { ...item, chapter: chapter.title }] as const),
    ),
  );

  const seen = new Set<string>();
  const answers = input.answers.map((answer) => {
    const itemCode = clean(answer.itemCode, 30);
    if (!standards.has(itemCode) || seen.has(itemCode) || !VALUES.has(answer.value)) {
      throw new Error("تتضمن نتيجة التقييم بيانات غير صالحة.");
    }
    seen.add(itemCode);
    return { item_code: itemCode, status: answer.value, notes: clean(answer.notes, 1000) || null };
  });

  return { facilityName, contactName, city, phone, email: email || null, answers, standards };
}

function readinessTierLabel(tier: "high" | "medium" | "low") {
  return tier === "high" ? "عالية" : tier === "medium" ? "متوسطة" : "منخفضة";
}

function assessmentFacilityType(facilityType: FacilityType) {
  return facilityType === "dental" ? "dental_complex" : "medical_complex";
}

function assessmentNoteBlock(input: {
  contactName: string;
  city: string;
  email: string | null;
  facilityType: FacilityType;
  score: number;
  tier: "high" | "medium" | "low";
}) {
  return [
    "طلب تقييم جاهزية عبر صفحة قيّم منشأتك",
    `اسم مسؤول التواصل: ${input.contactName}`,
    `المدينة المدخلة: ${input.city}`,
    `نوع التقييم: ${input.facilityType === "dental" ? "مراكز / مجمعات الأسنان" : "المجمعات الطبية العامة"}`,
    `درجة الجاهزية: ${input.score}% (${readinessTierLabel(input.tier)})`,
    input.email ? `البريد الإلكتروني: ${input.email}` : null,
  ].filter(Boolean).join("\n");
}

async function upsertFacilityFromAssessment(input: {
  facilityName: string;
  contactName: string;
  city: string;
  phone: string;
  email: string | null;
  facilityType: FacilityType;
  score: number;
  tier: "high" | "medium" | "low";
}) {
  const admin = createAdminClient();
  const companyId = await resolvePublicLeadCompanyId(admin);
  const normalizedPhone = normalizePhone(input.phone);
  const noteBlock = assessmentNoteBlock(input);
  const { data: existingData, error: existingError } = await admin.from("facilities")
    .select("id,company_id,is_active,notes,name_ar,city_custom")
    .eq("primary_phone_normalized", normalizedPhone)
    .order("is_active", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  const existing = existingData as {
    id: string;
    company_id: string;
    is_active: boolean;
    notes: string | null;
    name_ar: string;
    city_custom: string | null;
  } | null;

  const nextNotes = existing?.notes?.trim() ? `${existing.notes.trim()}\n\n${noteBlock}` : noteBlock;

  if (existing?.is_active) {
    const { error } = await admin.from("facilities").update({
      city_custom: existing.city_custom || input.city,
      notes: nextNotes,
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
    if (error) throw error;

    const { error: activityError } = await admin.from("facility_activity").insert({
      company_id: existing.company_id,
      facility_id: existing.id,
      actor_id: null,
      event_type: "edited",
      new_value: `تحديث بيانات الجاهزية (${input.score}%)`,
    });
    if (activityError) throw activityError;
    return existing.id;
  }

  if (existing) {
    const { error } = await admin.from("facilities").update({
      company_id: companyId,
      name_ar: input.facilityName,
      type: assessmentFacilityType(input.facilityType),
      city_custom: input.city,
      primary_phone: input.phone,
      primary_phone_normalized: normalizedPhone,
      lead_source: "website_form",
      status: "new",
      is_active: true,
      archived_at: null,
      archived_by: null,
      notes: nextNotes,
    }).eq("id", existing.id);
    if (error) throw error;

    const { error: activityError } = await admin.from("facility_activity").insert({
      company_id: companyId,
      facility_id: existing.id,
      actor_id: null,
      event_type: "recovered",
      new_value: `استعادة منشأة عبر تقييم الجاهزية (${input.score}%)`,
    });
    if (activityError) throw activityError;
    return existing.id;
  }

  const { data, error } = await admin.from("facilities").insert({
    company_id: companyId,
    name_ar: input.facilityName,
    type: assessmentFacilityType(input.facilityType),
    region_id: null,
    city_id: null,
    city_custom: input.city,
    primary_phone: input.phone,
    primary_phone_normalized: normalizedPhone,
    secondary_phone: null,
    status: "new",
    lead_source: "website_form",
    assigned_to: null,
    is_active: true,
    notes: nextNotes,
    created_by: null,
  }).select("id").single();
  if (error || !data) throw error ?? new Error("Unable to create facility from assessment lead.");

  const { error: activityError } = await admin.from("facility_activity").insert({
    company_id: companyId,
    facility_id: data.id,
    actor_id: null,
    event_type: "created",
    new_value: `إنشاء منشأة عبر تقييم الجاهزية (${input.score}%)`,
  });
  if (activityError) throw activityError;

  return data.id as string;
}

export async function submitSharedAssessmentLead(
  input: SharedAssessmentLeadInput,
): Promise<SharedAssessmentLeadResult> {
  try {
    if (isRateLimited(`assessment:${requestIp()}`)) {
      return { success: false, message: "تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقًا." };
    }

    const value = await validate(input);
    const answerMap = new Map(value.answers.map((answer) => [answer.item_code, answer]));
    let points = 0;
    let applicable = 0;
    const counts = { available: 0, partial: 0, unavailable: 0, not_applicable: 0, unanswered: 0 };
    const gaps: Array<{ code: string; question: string; chapter: string; status: string }> = [];

    for (const [code, standard] of value.standards) {
      const answer = answerMap.get(code);
      if (answer?.status === "na") {
        counts.not_applicable++;
        continue;
      }
      applicable++;
      if (answer?.status === "1") {
        points++;
        counts.available++;
      } else if (answer?.status === "0.5") {
        points += 0.5;
        counts.partial++;
        gaps.push({ code, question: standard.question, chapter: standard.chapter, status: "partial" });
      } else if (answer?.status === "0") {
        counts.unavailable++;
        gaps.push({ code, question: standard.question, chapter: standard.chapter, status: "unavailable" });
      } else {
        counts.unanswered++;
        gaps.push({ code, question: standard.question, chapter: standard.chapter, status: "unanswered" });
      }
    }

    const score = applicable ? Math.round((points / applicable) * 100) : 0;
    const tier = score >= 85 ? "high" : score >= 65 ? "medium" : "low";

    const admin = createAdminClient();
    const { data, error } = await admin.from("shared_assessment_leads").insert({
      facility_name: value.facilityName,
      contact_name: value.contactName,
      city: value.city,
      phone: value.phone,
      phone_normalized: normalizePhone(value.phone),
      email: value.email,
      facility_type_assessed: input.facilityType,
      overall_score: score,
      readiness_tier: tier,
      answered_count: value.answers.length,
      counts,
      answers: value.answers,
      top_gaps: gaps.slice(0, 25),
    }).select("id").single();
    if (error || !data) throw error ?? new Error("Unable to save assessment lead.");

    await upsertFacilityFromAssessment({
      facilityName: value.facilityName,
      contactName: value.contactName,
      city: value.city,
      phone: value.phone,
      email: value.email,
      facilityType: input.facilityType,
      score,
      tier,
    });

    return { success: true, leadId: data.id as string, score };
  } catch (error) {
    console.error("Shared assessment lead submission failed", error);
    return { success: false, message: error instanceof Error ? error.message : "تعذر إرسال النتيجة حاليًا." };
  }
}
