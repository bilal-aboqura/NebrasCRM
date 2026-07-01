"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitSharedAssessmentLead } from "@/lib/actions/shared-assessment-leads";
import type { AnswerValue, FacilityType } from "@/hooks/use-cbahi-session";

export function SharedLeadForm({
  facilityType,
  answers,
  notes,
}: {
  facilityType: FacilityType;
  answers: Record<string, AnswerValue>;
  notes: Record<string, string>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError("");

    const result = await submitSharedAssessmentLead({
      facilityName: String(formData.get("facility_name") ?? ""),
      contactName: String(formData.get("contact_name") ?? ""),
      city: String(formData.get("city") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      facilityType,
      answers: Object.entries(answers)
        .filter((entry): entry is [string, Exclude<AnswerValue, "">] => entry[1] !== "")
        .map(([itemCode, value]) => ({ itemCode, value, notes: notes[itemCode] })),
    });

    setPending(false);
    if (result.success) setSubmitted(true);
    else setError(result.message);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center text-emerald-800">
        <CheckCircle2 className="mx-auto mb-3" size={42} />
        <h3 className="text-xl font-extrabold">تم إرسال نتيجة التقييم بنجاح</h3>
        <p className="mt-2">تم إضافة بيانات منشأتك للمتابعة داخل نظام CRM ليتمكن الفريق من التواصل معك بسهولة.</p>
      </div>
    );
  }

  const field = "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 outline-none transition focus:border-nebras-gold focus:bg-white/15";

  return (
    <form action={submit} className="rounded-3xl bg-[#002b22] p-6 text-right text-white sm:p-8">
      <p className="font-bold text-nebras-gold">أرسل النتيجة إلى مستشاري نبراس</p>
      <h3 className="mt-2 text-2xl font-extrabold">احصل على مراجعة مجانية للفجوات</h3>
      <p className="mt-3 text-sm leading-7 text-white/65">
        سنحفظ بيانات منشأتك ونتيجة الجاهزية داخل CRM لتظهر مباشرة ضمن قائمة المنشآت ويسهل التواصل معك.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <input name="facility_name" required minLength={2} placeholder="اسم المنشأة" className={field} />
        <input name="contact_name" required minLength={2} placeholder="اسم مسؤول التواصل" className={field} />
        <input name="city" required minLength={2} placeholder="المدينة" className={field} />
        <input name="phone" required inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" className={field} />
        <input name="email" type="email" dir="ltr" placeholder="البريد الإلكتروني (اختياري)" className={`${field} sm:col-span-2`} />
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-100">{error}</p>}

      <button disabled={pending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nebras-gold px-5 py-3.5 font-extrabold text-nebras-green transition hover:bg-[#d6b96f] disabled:opacity-60">
        {pending ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} />}
        {pending ? "جارٍ إرسال النتيجة..." : "إرسال النتيجة وطلب التواصل"}
      </button>
    </form>
  );
}
