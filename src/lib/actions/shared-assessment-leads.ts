"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { resolvePublicLeadCompanyId } from "@/lib/actions/lead-capture";
import { loadPublishedAssessmentData } from "@/lib/assessment/visibility";
import { isRateLimited } from "@/lib/rate-limit/memory";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSaudiPhone, normalizePhone } from "@/lib/utils/phone";
import type { FacilityType } from "@/hooks/use-cbahi-session";
import type { AssessmentAnswer, ReadinessTier } from "@/lib/types/assessment";

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

export type PublicAssessmentSaveResult =
  | { success: true; score: number }
  | { success: false; message: string };

type NormalizedSharedAnswer = {
  item_code: string;
  status: SharedAssessmentAnswer["value"];
  notes: string | null;
};

type SharedAssessmentSummary = {
  answeredCount: number;
  counts: {
    available: number;
    partial: number;
    unavailable: number;
    not_applicable: number;
    unanswered: number;
  };
  topGaps: Array<{ code: string; question: string; chapter: string; status: string }>;
  score: number;
  tier: ReadinessTier;
};

type SharedAssessmentRecordMatch = {
  id: string;
  answers: unknown;
};

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

function summarizeSharedAssessment(
  standards: Map<string, { question: string; chapter: string }>,
  answers: NormalizedSharedAnswer[],
): SharedAssessmentSummary {
  let points = 0;
  let applicable = 0;
  const counts = { available: 0, partial: 0, unavailable: 0, not_applicable: 0, unanswered: 0 };
  const gaps: Array<{ code: string; question: string; chapter: string; status: string }> = [];

  for (const answer of answers) {
    const standard = standards.get(answer.item_code);
    if (!standard) continue;
    if (answer.status === "na") {
      counts.not_applicable++;
      continue;
    }
    applicable++;
    if (answer.status === "1") {
      points++;
      counts.available++;
    } else if (answer.status === "0.5") {
      points += 0.5;
      counts.partial++;
      gaps.push({ code: answer.item_code, question: standard.question, chapter: standard.chapter, status: "partial" });
    } else if (answer.status === "0") {
      counts.unavailable++;
      gaps.push({ code: answer.item_code, question: standard.question, chapter: standard.chapter, status: "unavailable" });
    }
  }

  const score = applicable ? Math.round((points / applicable) * 100) : 0;
  const tier: ReadinessTier = score >= 85 ? "high" : score >= 65 ? "medium" : "low";

  return {
    answeredCount: answers.length,
    counts,
    topGaps: gaps.slice(0, 25),
    score,
    tier,
  };
}

function normalizeAnswersForComparison(answers: NormalizedSharedAnswer[]) {
  return answers
    .map((answer) => ({
      item_code: answer.item_code,
      status: answer.status,
      notes: answer.notes ?? null,
    }))
    .sort((left, right) => left.item_code.localeCompare(right.item_code));
}

function answersMatch(left: NormalizedSharedAnswer[], right: unknown) {
  if (!Array.isArray(right)) return false;

  const normalizedRight = right
    .map((answer) => {
      if (!answer || typeof answer !== "object") return null;
      const candidate = answer as Record<string, unknown>;
      const itemCode = typeof candidate.item_code === "string" ? candidate.item_code : null;
      const status = typeof candidate.status === "string" ? candidate.status : null;
      const notes = typeof candidate.notes === "string" ? candidate.notes : candidate.notes == null ? null : null;
      if (!itemCode || !status) return null;
      return { item_code: itemCode, status, notes };
    })
    .filter((answer): answer is NormalizedSharedAnswer => answer !== null)
    .sort((left, rightAnswer) => left.item_code.localeCompare(rightAnswer.item_code));

  return JSON.stringify(normalizeAnswersForComparison(left)) === JSON.stringify(normalizedRight);
}

async function findDuplicateSharedAssessment(input: {
  facilityName: string;
  phoneNormalized: string;
  facilityType: FacilityType;
  score: number;
  answeredCount: number;
  answers: NormalizedSharedAnswer[];
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("shared_assessment_leads")
    .select("id,answers")
    .eq("phone_normalized", input.phoneNormalized)
    .eq("facility_type_assessed", input.facilityType)
    .eq("overall_score", input.score)
    .eq("answered_count", input.answeredCount)
    .eq("facility_name", input.facilityName)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;

  return ((data ?? []) as SharedAssessmentRecordMatch[]).find((record) => answersMatch(input.answers, record.answers)) ?? null;
}

function readinessTierLabel(tier: "high" | "medium" | "low") {
  return tier === "high" ? "عالية" : tier === "medium" ? "متوسطة" : "منخفضة";
}

function assessmentFacilityType(facilityType: FacilityType) {
  return facilityType === "dental" ? "dental_complex" : "medical_complex";
}

function mapSharedAnswerStatus(value: SharedAssessmentAnswer["value"]): AssessmentAnswer["status"] {
  switch (value) {
    case "1":
      return "Met";
    case "0.5":
      return "Partially Met";
    case "0":
      return "Not Met";
    default:
      return "Not Applicable";
  }
}

function mapAssessmentAnswerToSharedValue(value: AssessmentAnswer["status"]): SharedAssessmentAnswer["value"] {
  switch (value) {
    case "Met":
      return "1";
    case "Partially Met":
      return "0.5";
    case "Not Met":
      return "0";
    default:
      return "na";
  }
}

async function insertSharedAssessmentRecord(input: SharedAssessmentLeadInput) {
  const value = await validate(input);
  const summary = summarizeSharedAssessment(value.standards, value.answers);
  const phoneNormalized = normalizePhone(value.phone);
  const duplicate = await findDuplicateSharedAssessment({
    facilityName: value.facilityName,
    phoneNormalized,
    facilityType: input.facilityType,
    score: summary.score,
    answeredCount: summary.answeredCount,
    answers: value.answers,
  });
  if (duplicate) {
    revalidatePath("/dashboard/assessment-leads");
    return { leadId: duplicate.id, summary, normalized: value };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("shared_assessment_leads").insert({
    facility_name: value.facilityName,
    contact_name: value.contactName,
    city: value.city,
    phone: value.phone,
    phone_normalized: phoneNormalized,
    email: value.email,
    facility_type_assessed: input.facilityType,
    overall_score: summary.score,
    readiness_tier: summary.tier,
    answered_count: summary.answeredCount,
    counts: summary.counts,
    answers: value.answers,
    top_gaps: summary.topGaps,
  }).select("id").single();
  if (error || !data) throw error ?? new Error("Unable to save assessment lead.");

  revalidatePath("/dashboard/assessment-leads");
  return { leadId: data.id as string, summary, normalized: value };
}

export async function saveFacilityAssessmentToSharedRegistry(input: {
  facilityId: string;
  facilityType: FacilityType;
  answers: AssessmentAnswer[];
}) {
  const admin = createAdminClient();
  const { data: facility, error: facilityError } = await admin
    .from("facilities")
    .select("id,name_ar,city_custom,primary_phone,cities(name_ar)")
    .eq("id", input.facilityId)
    .maybeSingle();
  if (facilityError) throw facilityError;
  if (!facility) throw new Error("المنشأة غير موجودة.");

  const { data: primaryContact, error: primaryContactError } = await admin
    .from("contacts")
    .select("name_ar,email")
    .eq("facility_id", input.facilityId)
    .eq("is_archived", false)
    .eq("is_primary", true)
    .maybeSingle();
  if (primaryContactError) throw primaryContactError;

  let contactName = (primaryContact as { name_ar?: string } | null)?.name_ar?.trim() ?? "";
  let email = (primaryContact as { email?: string | null } | null)?.email ?? null;

  if (!contactName) {
    const { data: firstContact, error: firstContactError } = await admin
      .from("contacts")
      .select("name_ar,email")
      .eq("facility_id", input.facilityId)
      .eq("is_archived", false)
      .maybeSingle();
    if (firstContactError) throw firstContactError;
    contactName = (firstContact as { name_ar?: string } | null)?.name_ar?.trim() ?? "";
    email = email ?? ((firstContact as { email?: string | null } | null)?.email ?? null);
  }

  await insertSharedAssessmentRecord({
    facilityName: ((facility as { name_ar?: string }).name_ar ?? "منشأة") as string,
    contactName: contactName || ((facility as { name_ar?: string }).name_ar ?? "المنشأة") as string,
    city: ((facility as { city_custom?: string | null; cities?: { name_ar?: string } | null }).city_custom
      || (facility as { city_custom?: string | null; cities?: { name_ar?: string } | null }).cities?.name_ar
      || "غير محددة") as string,
    phone: ((facility as { primary_phone?: string }).primary_phone ?? "") as string,
    email: email ?? undefined,
    facilityType: input.facilityType,
    answers: input.answers.map((answer) => ({
      itemCode: answer.item_code,
      value: mapAssessmentAnswerToSharedValue(answer.status),
      notes: answer.notes,
    })),
  });
}

async function resolveAssessmentActorId(companyId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,role,status")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const profiles = (data ?? []) as Array<{ id: string; role: string; status: string }>;
  const preferredRoles = ["company_admin", "supervisor", "sales_user", "super_admin"];
  for (const role of preferredRoles) {
    const match = profiles.find((profile) => profile.role === role);
    if (match) return match.id;
  }

  if (profiles[0]) return profiles[0].id;
  throw new Error("Unable to find an active user to attach the external assessment.");
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

async function saveFacilityAssessmentFromPublicLead(input: {
  companyId: string;
  facilityId: string;
  facilityType: FacilityType;
  score: number;
  tier: ReadinessTier;
  answers: Array<{ item_code: string; status: SharedAssessmentAnswer["value"]; notes: string | null }>;
}) {
  const admin = createAdminClient();
  const actorId = await resolveAssessmentActorId(input.companyId);
  const normalizedAnswers: AssessmentAnswer[] = input.answers.map((answer) => ({
    item_code: answer.item_code,
    status: mapSharedAnswerStatus(answer.status),
    notes: answer.notes ?? undefined,
  }));

  const { error } = await admin.from("assessments").insert({
    company_id: input.companyId,
    facility_id: input.facilityId,
    assessed_by: actorId,
    facility_type_assessed: input.facilityType,
    overall_score: input.score,
    readiness_tier: input.tier,
    answers: normalizedAnswers,
  });
  if (error) throw error;

  const { error: activityError } = await admin.from("facility_activity").insert({
    company_id: input.companyId,
    facility_id: input.facilityId,
    actor_id: actorId,
    event_type: "assessment_saved",
    new_value: `${input.score}% | ${input.tier} | تقييم ذاتي خارجي`,
  });
  if (activityError) throw activityError;

  revalidatePath(`/dashboard/facilities/${input.facilityId}`);
}

export async function savePublicFacilityAssessment(input: {
  facilityId: string;
  facilityType: FacilityType;
  answers: SharedAssessmentAnswer[];
}): Promise<PublicAssessmentSaveResult> {
  try {
    const facilityId = clean(input.facilityId, 80);
    if (!facilityId) throw new Error("معرف المنشأة غير صالح.");
    if (input.facilityType !== "general" && input.facilityType !== "dental") {
      throw new Error("نوع التقييم غير صالح.");
    }

    const value = await validate({
      facilityName: "placeholder",
      contactName: "placeholder",
      city: "placeholder",
      phone: "0500000000",
      email: "",
      facilityType: input.facilityType,
      answers: input.answers,
    });

    let points = 0;
    let applicable = 0;
    for (const answer of value.answers) {
      if (answer.status === "na") continue;
      applicable++;
      if (answer.status === "1") points++;
      else if (answer.status === "0.5") points += 0.5;
    }

    const score = applicable ? Math.round((points / applicable) * 100) : 0;
    const tier: ReadinessTier = score >= 85 ? "high" : score >= 65 ? "medium" : "low";
    const admin = createAdminClient();
    const { data: facility, error: facilityError } = await admin
      .from("facilities")
      .select("id,company_id,is_active")
      .eq("id", facilityId)
      .maybeSingle();
    if (facilityError) throw facilityError;
    if (!facility || !facility.is_active) throw new Error("المنشأة غير موجودة أو غير نشطة.");

    await saveFacilityAssessmentFromPublicLead({
      companyId: facility.company_id as string,
      facilityId,
      facilityType: input.facilityType,
      score,
      tier,
      answers: value.answers,
    });
    await saveFacilityAssessmentToSharedRegistry({
      facilityId,
      facilityType: input.facilityType,
      answers: value.answers.map((answer) => ({
        item_code: answer.item_code,
        status: mapSharedAnswerStatus(answer.status),
        notes: answer.notes ?? undefined,
      })),
    });

    return { success: true, score };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر حفظ التقييم." };
  }
}

export async function submitSharedAssessmentLead(
  input: SharedAssessmentLeadInput,
): Promise<SharedAssessmentLeadResult> {
  try {
    if (isRateLimited(`assessment:${requestIp()}`)) {
      return { success: false, message: "تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقًا." };
    }

    const { leadId, summary, normalized } = await insertSharedAssessmentRecord(input);
    const admin = createAdminClient();
    const companyId = await resolvePublicLeadCompanyId(admin);

    const facilityId = await upsertFacilityFromAssessment({
      facilityName: normalized.facilityName,
      contactName: normalized.contactName,
      city: normalized.city,
      phone: normalized.phone,
      email: normalized.email,
      facilityType: input.facilityType,
      score: summary.score,
      tier: summary.tier,
    });
    await saveFacilityAssessmentFromPublicLead({
      companyId,
      facilityId,
      facilityType: input.facilityType,
      score: summary.score,
      tier: summary.tier,
      answers: normalized.answers,
    });

    return { success: true, leadId, score: summary.score };
  } catch (error) {
    console.error("Shared assessment lead submission failed", error);
    return { success: false, message: error instanceof Error ? error.message : "تعذر إرسال النتيجة حاليًا." };
  }
}
