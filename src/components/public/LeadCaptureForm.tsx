"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, Sparkles } from "lucide-react";
import {
  submitLeadAction,
  type LeadSubmissionPayload,
  type LeadSubmissionResult,
} from "@/lib/actions/lead-capture";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const FACILITY_TYPES: Array<{ value: LeadSubmissionPayload["facilityType"]; label: string }> = [
  { value: "medical_complex", label: "مجمع طبي" },
  { value: "dental_complex", label: "مجمع لطب الأسنان" },
  { value: "lab", label: "مختبر" },
  { value: "radiology", label: "مركز أشعة" },
  { value: "hospital", label: "مستشفى" },
];

const EMPTY_FORM: LeadSubmissionPayload = {
  facilityName: "",
  city: "",
  phone: "",
  facilityType: "medical_complex",
};

type FieldErrors = Partial<Record<keyof LeadSubmissionPayload, string[]>>;

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-nebras-gold focus:ring-2 focus:ring-nebras-gold/20";

export function LeadCaptureForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<LeadSubmissionResult | null>(null);
  const [pending, setPending] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result?.success || result.duplicate || redirectUrl) return;
    const timeout = window.setTimeout(() => {
      setResult(null);
      setForm(EMPTY_FORM);
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [redirectUrl, result]);

  useEffect(() => {
    if (!redirectUrl) return;
    const timeout = window.setTimeout(() => {
      router.push(redirectUrl);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [redirectUrl, router]);

  function mapFacilityTypeToAssessmentType(facilityType: LeadSubmissionPayload["facilityType"]) {
    return facilityType === "dental_complex" ? "dental" : "general";
  }

  function update<K extends keyof LeadSubmissionPayload>(field: K, value: LeadSubmissionPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (form.facilityName.trim().length < 2) next.facilityName = ["يرجى إدخال اسم المنشأة"];
    if (!form.city.trim()) next.city = ["يرجى إدخال المدينة"];
    if (!/^(?:\+?966|0)?5\d{8}$/.test(form.phone.replace(/[\s()-]/g, ""))) {
      next.phone = ["يرجى إدخال رقم جوال سعودي صحيح"];
    }
    return next;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setPending(true);
    setRedirectUrl(null);
    setResult(null);
    try {
      const response = await submitLeadAction(form);
      setResult(response);
      if (!response.success && response.errors) setErrors(response.errors);
      if (response.success && !response.duplicate) {
        window.dataLayer = window.dataLayer ?? [];
        window.dataLayer.push({
          event: "lead_form_submitted",
          facilityType: form.facilityType,
          submissionTimestamp: new Date().toISOString(),
        });
        const params = new URLSearchParams({
          from: "lead",
          facility_id: response.facilityId,
          type: mapFacilityTypeToAssessmentType(form.facilityType),
          facility_name: form.facilityName,
          city: form.city,
          phone: form.phone,
        });
        setRedirectUrl(`/assessment?${params.toString()}`);
      }
    } finally {
      setPending(false);
    }
  }

  if (result?.success) {
    const duplicate = result.duplicate;

    if (!duplicate && redirectUrl) {
      return (
        <div
          role="status"
          dir="rtl"
          className="relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_32%),linear-gradient(135deg,#f4fbf6_0%,#ecf8ef_55%,#fdf7e8_100%)] p-6 text-right shadow-xl shadow-emerald-900/5 sm:p-8"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-nebras-gold via-emerald-500 to-nebras-green" />

          <div className="flex items-start justify-between gap-4">
            <div className="rounded-2xl bg-white/80 p-3 text-nebras-gold shadow-sm">
              <Sparkles aria-hidden size={26} />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
              <Loader2 aria-hidden className="animate-spin" size={14} />
              جاري التحويل
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold text-nebras-gold">الخطوة الأولى اكتملت</p>
            <h3 className="mt-2 text-2xl font-extrabold leading-tight text-nebras-green sm:text-3xl">
              تم استلام بيانات المنشأة
            </h3>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-700">
              ننتقل الآن إلى تقييم سباهي لإكمال تقييم الجاهزية وتحديد أولويات التحسين المناسبة لمنشأتك.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 aria-hidden size={20} />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-nebras-green">تم حفظ بيانات التواصل</p>
                  <p className="mt-1 text-sm text-slate-600">سيتابع معك فريقنا بعد إرسال التقييم.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-nebras-gold/20 text-nebras-gold">
                  <ClipboardCheck aria-hidden size={20} />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-nebras-green">الخطوة التالية: تقييم سباهي</p>
                  <p className="mt-1 text-sm text-slate-600">أجب عن الأسئلة لنبدأ بتقدير الجاهزية.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-emerald-200/80 bg-white/75 p-4">
            <div className="flex items-center justify-between gap-4 text-sm font-bold text-slate-700">
              <span>الانتقال إلى التقييم</span>
              <span className="text-emerald-700">بعد لحظات...</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-full origin-right animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-l from-nebras-gold via-emerald-500 to-nebras-green" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        role="status"
        dir="rtl"
        className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900"
      >
        <AlertTriangle aria-hidden className="mx-auto size-14 text-amber-500" />
        <h3 className="mt-4 text-xl font-extrabold">طلبك مسجل لدينا</h3>
        <p className="mt-2 leading-7">{result.message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      dir="rtl"
      className="rounded-[2rem] border border-nebras-green/10 bg-white p-6 shadow-xl shadow-nebras-green/5 sm:p-8"
    >
      <h3 className="text-xl font-extrabold text-nebras-green">بيانات المنشأة</h3>
      <p className="mt-2 text-sm text-slate-500">
        املأ البيانات وسيتواصل معك فريقنا لتحديد موعد التقييم المجاني.
      </p>

      {!result?.success && result?.rateLimited && (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900"
        >
          <AlertTriangle aria-hidden className="mt-0.5 shrink-0" size={19} />
          {result.message}
        </div>
      )}
      {!result?.success && result?.message && !result.rateLimited && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          {result.message}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">
          اسم المنشأة
          <input
            value={form.facilityName}
            onChange={(event) => update("facilityName", event.target.value)}
            maxLength={200}
            className={fieldClass}
            placeholder="مثال: مجمع الشفاء الطبي"
            aria-invalid={Boolean(errors.facilityName)}
          />
          {errors.facilityName && <span className="mt-1 block text-xs text-red-600">{errors.facilityName[0]}</span>}
        </label>
        <label className="text-sm font-bold text-slate-700">
          نوع المنشأة
          <select
            value={form.facilityType}
            onChange={(event) => update("facilityType", event.target.value as LeadSubmissionPayload["facilityType"])}
            className={fieldClass}
          >
            {FACILITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.facilityType && <span className="mt-1 block text-xs text-red-600">{errors.facilityType[0]}</span>}
        </label>
        <label className="text-sm font-bold text-slate-700">
          رقم الجوال
          <input
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            inputMode="tel"
            dir="ltr"
            className={`${fieldClass} text-left`}
            placeholder="0501234567"
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && <span className="mt-1 block text-right text-xs text-red-600">{errors.phone[0]}</span>}
        </label>
        <label className="text-sm font-bold text-slate-700">
          المدينة
          <input
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            maxLength={100}
            className={fieldClass}
            placeholder="مثال: الرياض"
            aria-invalid={Boolean(errors.city)}
          />
          {errors.city && <span className="mt-1 block text-xs text-red-600">{errors.city[0]}</span>}
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nebras-green px-6 py-3.5 font-extrabold text-white shadow-lg transition hover:bg-nebras-green/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Loader2 aria-hidden className="animate-spin" size={19} />}
        {pending ? "جارٍ إرسال الطلب..." : "احجز تقييمك المجاني"}
      </button>
    </form>
  );
}
