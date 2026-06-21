"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { createContact, updateContact, type Contact, type CreateContactInput } from "@/lib/actions/contacts";

const fieldClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-nebras-gold";

export function ContactForm({ facilityId, contact }: { facilityId: string; contact?: Contact }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit(formData: FormData) {
    const input: CreateContactInput = {
      name_ar: String(formData.get("name_ar") ?? ""),
      job_title: String(formData.get("job_title") ?? ""),
      primary_phone: String(formData.get("primary_phone") ?? ""),
      secondary_phone: String(formData.get("secondary_phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      is_primary: formData.get("is_primary") === "on",
      notes: String(formData.get("notes") ?? ""),
    };
    startTransition(async () => {
      const result = contact ? await updateContact(contact.id, input) : await createContact(facilityId, input);
      if (!result.success) return setError(result.error);
      setError("");
      setOpen(false);
      router.refresh();
    });
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className={contact
      ? "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-nebras-green hover:border-nebras-gold"
      : "inline-flex items-center gap-2 rounded-xl bg-nebras-green px-4 py-2.5 font-bold text-white"}>
      {contact ? <><Pencil size={15} />تعديل</> : <><Plus size={18} />إضافة جهة اتصال</>}
    </button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label={contact ? "تعديل جهة اتصال" : "إضافة جهة اتصال"}>
      <form action={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-slate-50 p-6 shadow-2xl" dir="rtl">
        <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-extrabold text-nebras-green">{contact ? "تعديل جهة الاتصال" : "إضافة جهة اتصال جديدة"}</h2><button type="button" onClick={() => setOpen(false)} aria-label="إغلاق"><X /></button></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label>الاسم بالعربية<input name="name_ar" required minLength={2} maxLength={150} defaultValue={contact?.name_ar ?? ""} className={fieldClass} /></label>
          <label>المسمى الوظيفي<input name="job_title" required minLength={2} maxLength={100} defaultValue={contact?.job_title ?? ""} className={fieldClass} /></label>
          <label>الهاتف الرئيسي<input name="primary_phone" required dir="ltr" inputMode="tel" defaultValue={contact?.primary_phone ?? ""} className={`${fieldClass} text-left`} placeholder="0501234567" /></label>
          <label>الهاتف الثانوي<input name="secondary_phone" dir="ltr" inputMode="tel" defaultValue={contact?.secondary_phone ?? ""} className={`${fieldClass} text-left`} /></label>
          <label className="md:col-span-2">البريد الإلكتروني<input name="email" type="email" dir="ltr" defaultValue={contact?.email ?? ""} className={`${fieldClass} text-left`} /></label>
          <label className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 md:col-span-2"><input name="is_primary" type="checkbox" defaultChecked={contact?.is_primary ?? false} className="h-5 w-5 accent-amber-600" /><span><strong className="block">جهة الاتصال الرئيسية</strong><small className="text-slate-600">سيتم إلغاء تحديد جهة الاتصال الرئيسية السابقة تلقائياً.</small></span></label>
          <label className="md:col-span-2">ملاحظات<textarea name="notes" rows={4} maxLength={2000} defaultValue={contact?.notes ?? ""} className={fieldClass} /></label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}
        <div className="mt-6 flex gap-3"><button disabled={pending} className="rounded-xl bg-nebras-green px-6 py-3 font-bold text-white disabled:opacity-60">{pending ? "جارٍ الحفظ..." : "حفظ"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-6 py-3">إلغاء</button></div>
      </form>
    </div>}
  </>;
}
