"use client";

import type { Contract } from "@/lib/types/domain";

export default function ContractEditorModal({ contract }: { contract?: Contract }) {
  const readOnly = contract?.status === "active";
  return (
    <details className="rounded-lg border border-nebras-line bg-white p-4">
      <summary className="cursor-pointer font-semibold text-nebras-green">{contract ? "العقد" : "إنشاء عقد"}</summary>
      <form className="mt-4 grid gap-3 md:grid-cols-2">
        <input readOnly={readOnly} defaultValue={contract?.title} placeholder="العنوان" className="rounded-md border border-nebras-line px-3 py-2" />
        <input readOnly={readOnly} defaultValue={contract?.value} type="number" placeholder="القيمة" className="rounded-md border border-nebras-line px-3 py-2" />
        <input readOnly={readOnly} defaultValue={contract?.startDate} type="date" className="rounded-md border border-nebras-line px-3 py-2" />
        <input readOnly={readOnly} defaultValue={contract?.endDate} type="date" className="rounded-md border border-nebras-line px-3 py-2" />
        <input disabled={readOnly} type="file" accept="application/pdf" className="md:col-span-2 rounded-md border border-dashed border-nebras-line px-3 py-4" />
        <button type="button" disabled={readOnly} className="rounded-md bg-nebras-green px-4 py-2 font-semibold text-white">حفظ</button>
        {contract?.status === "draft" ? <button type="button" className="rounded-md border border-nebras-line px-4 py-2 font-semibold">تفعيل العقد</button> : null}
      </form>
    </details>
  );
}
