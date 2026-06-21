"use server";

import { headers } from "next/headers";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";
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

function validate(input: SharedAssessmentLeadInput) {
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

  const standards = new Map(
    CBAHI_DATA[input.facilityType].chapters.flatMap((chapter) =>
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

export async function submitSharedAssessmentLead(
  input: SharedAssessmentLeadInput,
): Promise<SharedAssessmentLeadResult> {
  try {
    if (isRateLimited(`assessment:${requestIp()}`)) {
      return { success: false, message: "تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً." };
    }
    const value = validate(input);
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
    const { data, error } = await createAdminClient().from("shared_assessment_leads").insert({
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
    return { success: true, leadId: data.id as string, score };
  } catch (error) {
    console.error("Shared assessment lead submission failed", error);
    return { success: false, message: error instanceof Error ? error.message : "تعذر إرسال النتيجة حالياً." };
  }
}
