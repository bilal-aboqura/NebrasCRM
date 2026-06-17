"use client";

import type { Offer } from "@/lib/types/domain";

export default function OfferEditorModal({ offer }: { offer?: Offer }) {
  const readOnly = offer?.status && offer.status !== "draft";
  return (
    <details className="rounded-lg border border-nebras-line bg-white p-4">
      <summary className="cursor-pointer font-semibold text-nebras-green">{offer ? "عرض السعر" : "إنشاء عرض جديد"}</summary>
      <form className="mt-4 grid gap-3 md:grid-cols-2">
        <input readOnly={readOnly} defaultValue={offer?.title} placeholder="العنوان" className="rounded-md border border-nebras-line px-3 py-2" />
        <input readOnly={readOnly} defaultValue={offer?.validUntil} type="date" className="rounded-md border border-nebras-line px-3 py-2" />
        <select disabled={readOnly} defaultValue={offer?.discountType ?? "fixed"} className="rounded-md border border-nebras-line px-3 py-2"><option value="fixed">خصم مبلغ</option><option value="percentage">خصم نسبة</option></select>
        <input readOnly={readOnly} defaultValue={offer?.discountValue ?? 0} type="number" placeholder="الخصم" className="rounded-md border border-nebras-line px-3 py-2" />
        <select disabled={readOnly} defaultValue={offer?.taxRate ?? 15} className="rounded-md border border-nebras-line px-3 py-2"><option value={15}>ضريبة 15%</option><option value={0}>معفى</option></select>
        <textarea readOnly={readOnly} defaultValue={offer?.notes} placeholder="ملاحظات" className="md:col-span-2 rounded-md border border-nebras-line px-3 py-2" />
        <button type="button" className="rounded-md bg-nebras-green px-4 py-2 font-semibold text-white" disabled={readOnly}>حفظ المسودة</button>
        {offer?.status === "draft" ? <button type="button" className="rounded-md border border-nebras-line px-4 py-2 font-semibold">إرسال العرض</button> : null}
      </form>
    </details>
  );
}
