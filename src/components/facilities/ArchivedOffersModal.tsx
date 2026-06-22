"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, X } from "lucide-react";
import { recoverOffer, type Offer } from "@/lib/actions/offers";
import { OFFER_STATUS_LABELS } from "@/lib/utils/offers";

export function ArchivedOffersModal({ offers }: { offers: Offer[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  function recover(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await recoverOffer(id);
      setPendingId("");
      if (!result.success) return setError(result.error.message);
      setError("");
      router.refresh();
    });
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-slate-700">عرض المؤرشف ({offers.length})</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="العروض المؤرشفة">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-extrabold text-nebras-green">العروض المؤرشفة</h2><button type="button" onClick={() => setOpen(false)} aria-label="إغلاق"><X /></button></div>
        {!offers.length ? <p className="rounded-xl bg-slate-50 p-5 text-slate-500">لا توجد عروض مؤرشفة.</p> : <ul className="space-y-3">{offers.map((offer) => <li key={offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 p-4"><div><strong>{offer.title}</strong><p className="text-sm text-slate-600">نسخة {offer.version} · {OFFER_STATUS_LABELS[offer.displayStatus]} · {offer.grandTotal.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</p><span className="mt-1 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs">مؤرشف</span></div><button type="button" disabled={pendingId === offer.id} onClick={() => recover(offer.id)} className="inline-flex items-center gap-2 rounded-lg bg-nebras-green px-3 py-2 font-bold text-white disabled:opacity-60"><ArchiveRestore size={17} />{pendingId === offer.id ? "جارٍ الاستعادة..." : "استعادة"}</button></li>)}</ul>}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}
      </div>
    </div>}
  </>;
}
