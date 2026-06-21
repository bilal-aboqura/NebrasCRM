"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { createOffer, updateDraftOffer, type Offer, type OfferLineItemInput } from "@/lib/actions/offers";

type ContactOption = { id: string; name_ar: string; job_title?: string };
type Props = { facilityId: string; contacts: ContactOption[]; offer?: Offer; triggerLabel?: string };

const tomorrow = () => {
  const date = new Date(); date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
};

export function OfferEditorModal({ facilityId, contacts, offer, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [title, setTitle] = useState(offer?.title ?? "");
  const [contactId, setContactId] = useState(offer?.contactId ?? "");
  const [validUntil, setValidUntil] = useState(offer?.validUntil ?? tomorrow());
  const [notes, setNotes] = useState(offer?.notes ?? "");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(offer?.discountType ?? "fixed");
  const [discountValue, setDiscountValue] = useState(offer?.discountValue ?? 0);
  const [taxRate, setTaxRate] = useState(offer?.taxRate ?? 15);
  const [items, setItems] = useState<OfferLineItemInput[]>(offer?.lineItems?.map((item) => ({ description: item.description, amount: item.amount, ordering: item.ordering })) ?? [{ description: "", amount: 0, ordering: 0 }]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [items]);
  const discount = discountType === "percentage" ? subtotal * discountValue / 100 : discountValue;
  const tax = Math.max(0, subtotal - discount) * taxRate / 100;

  function updateItem(index: number, patch: Partial<OfferLineItemInput>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }
  function submit() {
    setError("");
    startTransition(async () => {
      const input = { contactId: contactId || undefined, title, validUntil, notes, discountType, discountValue, taxRate, lineItems: items.map((item, index) => ({ ...item, ordering: index })) };
      const result = offer ? await updateDraftOffer(offer.id, input) : await createOffer({ ...input, facilityId });
      if (!result.success) { setError(result.error.message); return; }
      setOpen(false);
    });
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-nebras-green px-4 py-2 font-bold text-white">{triggerLabel ?? (offer ? "تعديل المسودة" : "إنشاء عرض جديد")}</button>
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="offer-editor-title" className="mx-auto my-6 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between"><h2 id="offer-editor-title" className="text-2xl font-extrabold text-nebras-green">{offer ? `تعديل ${offer.title}` : "عرض سعر جديد"}</h2><button type="button" onClick={() => setOpen(false)} aria-label="إغلاق"><X /></button></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="font-bold">العنوان<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2 font-normal" /></label>
          <label className="font-bold">تاريخ انتهاء الصلاحية<input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2 font-normal" /></label>
          <label className="font-bold">جهة الاتصال<select value={contactId} onChange={(event) => setContactId(event.target.value)} className="mt-2 w-full rounded-xl border bg-white px-3 py-2 font-normal"><option value="">بدون جهة اتصال</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name_ar}{contact.job_title ? ` — ${contact.job_title}` : ""}</option>)}</select></label>
          <label className="font-bold">الضريبة<select value={taxRate} onChange={(event) => setTaxRate(Number(event.target.value))} className="mt-2 w-full rounded-xl border bg-white px-3 py-2 font-normal"><option value={15}>15٪</option><option value={0}>معفى — 0٪</option></select></label>
        </div>
        <div className="mt-6"><div className="flex items-center justify-between"><h3 className="text-lg font-extrabold">البنود</h3><button type="button" onClick={() => setItems((current) => [...current, { description: "", amount: 0, ordering: current.length }])} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-bold"><Plus size={17} />إضافة بند</button></div>
          <div className="mt-3 space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_11rem_auto]"><input aria-label={`وصف البند ${index + 1}`} placeholder="وصف الخدمة" value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} className="rounded-xl border px-3 py-2" /><input aria-label={`مبلغ البند ${index + 1}`} type="number" min="0.01" step="0.01" value={item.amount || ""} onChange={(event) => updateItem(index, { amount: Number(event.target.value) })} className="rounded-xl border px-3 py-2" /><button type="button" aria-label="حذف البند" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl p-2 text-red-700 disabled:opacity-30"><Trash2 /></button></div>)}</div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="grid grid-cols-2 gap-3"><label className="font-bold">نوع الخصم<select value={discountType} onChange={(event) => setDiscountType(event.target.value as "fixed" | "percentage")} className="mt-2 w-full rounded-xl border bg-white px-3 py-2 font-normal"><option value="fixed">مبلغ ثابت</option><option value="percentage">نسبة مئوية</option></select></label><label className="font-bold">قيمة الخصم<input type="number" min="0" step="0.01" value={discountValue} onChange={(event) => setDiscountValue(Number(event.target.value))} className="mt-2 w-full rounded-xl border px-3 py-2 font-normal" /></label></div><label className="font-bold">ملاحظات<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border px-3 py-2 font-normal" /></label></div>
        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-4 text-sm sm:grid-cols-4"><div><dt>الإجمالي الفرعي</dt><dd className="font-extrabold">{subtotal.toLocaleString("ar-SA")} ر.س</dd></div><div><dt>الخصم</dt><dd className="font-extrabold">{discount.toLocaleString("ar-SA")} ر.س</dd></div><div><dt>الضريبة</dt><dd className="font-extrabold">{tax.toLocaleString("ar-SA")} ر.س</dd></div><div><dt>الإجمالي</dt><dd className="font-extrabold text-nebras-green">{Math.max(0, subtotal - discount + tax).toLocaleString("ar-SA")} ر.س</dd></div></dl>
        <p className="mt-2 text-xs text-slate-500">القيم المعروضة تقديرية؛ يعيد الخادم وقاعدة البيانات حسابها عند الحفظ.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={pending} onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 font-bold">إلغاء</button><button type="button" disabled={pending} onClick={submit} className="rounded-xl bg-nebras-green px-5 py-2 font-bold text-white disabled:opacity-50">{pending ? "جارٍ الحفظ…" : "حفظ المسودة"}</button></div>
      </section>
    </div>}
  </>;
}
