"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Archive, CopyPlus, Printer, Send } from "lucide-react";
import { ContractEditorModal } from "@/components/contracts/ContractEditorModal";
import { OfferEditorModal } from "@/components/offers/OfferEditorModal";
import { RecordDecisionModal } from "@/components/offers/RecordDecisionModal";
import { archiveOffer, createOfferRevision, sendOffer, type Offer } from "@/lib/actions/offers";
import type { FacilityStatus } from "@/lib/actions/facilities";
import { updateFacilityStatusAction } from "@/lib/actions/pipeline";
import { OFFER_STATUS_LABELS } from "@/lib/utils/offers";
import { ArchivedOffersModal } from "./ArchivedOffersModal";

const colors = { draft: "bg-slate-100 text-slate-700", sent: "bg-blue-100 text-blue-800", accepted: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", expired: "bg-amber-100 text-amber-800" } as const;
type ContactOption = { id: string; name_ar: string; job_title?: string };

export function OffersSection({ facilityId, facilityName, facilityStatus, offers, archivedOffers, contacts, canEdit, canManage }: { facilityId: string; facilityName: string; facilityStatus: FacilityStatus; offers: Offer[]; archivedOffers: Offer[]; contacts: ContactOption[]; canEdit: boolean; canManage: boolean }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [stagePrompt, setStagePrompt] = useState<"negotiation" | "contract" | null>(null);
  const chains = new Map<string, Offer[]>();
  offers.forEach((offer) => { const root = offer.rootOfferId ?? offer.id; chains.set(root, [...(chains.get(root) ?? []), offer]); });
  const run = (action: () => Promise<any>) => startTransition(async () => { setError(""); const result = await action(); if (!result.success) setError(result.error.message); });

  return <article className="rounded-2xl bg-white p-6 shadow-sm" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold">العروض</h2><p className="mt-1 text-sm text-slate-500">عروض الأسعار والإصدارات السابقة</p></div><div className="flex flex-wrap gap-2">{canManage && <ArchivedOffersModal offers={archivedOffers} />}{canEdit && <OfferEditorModal facilityId={facilityId} contacts={contacts} />}</div></div>
    {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    {!offers.length ? <p className="mt-6 rounded-xl border border-dashed p-6 text-center text-slate-500">لا توجد عروض لهذه المنشأة بعد.</p> : <div className="mt-6 space-y-5">{Array.from(chains.entries()).map(([root, versions]) => <section key={root} className="rounded-xl border p-4"><div className="space-y-3">{versions.sort((a,b) => b.version-a.version).map((offer,index) => <div key={offer.id} className={`rounded-xl p-4 ${index === 0 ? "bg-emerald-50/60" : "bg-slate-50"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-nebras-green">{offer.title}</h3><span className="rounded-full bg-white px-2 py-1 text-xs font-bold">نسخة {offer.version}</span><span className={`rounded-full px-2 py-1 text-xs font-bold ${colors[offer.displayStatus]}`}>{OFFER_STATUS_LABELS[offer.displayStatus]}</span></div><p className="mt-2 text-sm text-slate-500">صالح حتى {offer.validUntil} · {offer.contactName ?? "دون جهة اتصال"}</p></div><strong className="text-lg">{offer.grandTotal.toLocaleString("ar-SA",{minimumFractionDigits:2})} ر.س</strong></div>
      <div className="mt-4 flex flex-wrap gap-2">
        {offer.status === "draft" && canEdit && <><OfferEditorModal facilityId={facilityId} contacts={contacts} offer={offer} /><button type="button" disabled={pending} onClick={() => run(() => sendOffer(offer.id))} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"><Send size={16} />إرسال العرض</button></>}
        {offer.status !== "draft" && <Link href={`/dashboard/offers/${offer.id}/print`} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"><Printer size={16} />عرض الطباعة</Link>}
        {(offer.status === "sent" || offer.status === "rejected") && canEdit && <button type="button" disabled={pending} onClick={() => run(() => createOfferRevision(offer.id))} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"><CopyPlus size={16} />إنشاء مراجعة</button>}
        {offer.status === "sent" && canEdit && <><RecordDecisionModal offerId={offer.id} decision="accepted" onAccepted={() => setStagePrompt("negotiation")} /><RecordDecisionModal offerId={offer.id} decision="rejected" /></>}
        {offer.status === "accepted" && canEdit && <ContractEditorModal facilityId={facilityId} contacts={contacts} offers={[{ id: offer.id, title: offer.title, grand_total: offer.grandTotal, contact_id: offer.contactId }]} initialOffer={{ id: offer.id, title: offer.title, grand_total: offer.grandTotal, contact_id: offer.contactId }} onActivated={() => setStagePrompt("contract")} />}
        {canEdit && <button type="button" disabled={pending} onClick={() => { if(window.confirm("أرشفة سلسلة العرض وكل إصداراتها؟")) run(() => archiveOffer(offer.id)); }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700"><Archive size={16} />أرشفة</button>}
      </div>
    </div>)}</div></section>)}</div>}
    {stagePrompt && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6"><h2 className="text-xl font-extrabold text-nebras-green">تحديث مرحلة المنشأة</h2><p className="mt-3 text-slate-600">هل تريد نقل <strong>{facilityName}</strong> إلى مرحلة {stagePrompt === "contract" ? "العقد" : "التفاوض"} الآن؟</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setStagePrompt(null)} className="rounded-xl border px-4 py-2 font-bold">ليس الآن</button><button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await updateFacilityStatusAction({ facilityId, expectedStatus: facilityStatus, newStatus: stagePrompt }); if(!result.success) setError(result.error ?? "تعذر تحديث المرحلة"); setStagePrompt(null); })} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">تحديث المرحلة</button></div></section></div>}
  </article>;
}
