"use client";

import { useState, useTransition } from "react";
import { recordOfferDecision } from "@/lib/actions/offers";

export function RecordDecisionModal({ offerId, decision, onAccepted }: { offerId: string; decision: "accepted" | "rejected"; onAccepted?: () => void }) {
  const [open, setOpen] = useState(false); const [note, setNote] = useState(""); const [error, setError] = useState(""); const [pending, startTransition] = useTransition();
  const accepted = decision === "accepted";
  return <><button type="button" onClick={() => setOpen(true)} className={`rounded-lg px-3 py-2 text-sm font-bold text-white ${accepted ? "bg-emerald-600" : "bg-red-600"}`}>{accepted ? "قبول العرض" : "رفض العرض"}</button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6" dir="rtl"><h2 className="text-xl font-extrabold text-nebras-green">{accepted ? "تسجيل قبول العرض" : "تسجيل رفض العرض"}</h2><label className="mt-5 block font-bold">ملاحظة القرار<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border px-3 py-2 font-normal" /></label>{error && <p className="mt-3 text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" disabled={pending} onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 font-bold">إلغاء</button><button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await recordOfferDecision(offerId, { decision, decisionNote: note }); if (!result.success) { setError(result.error.message); return; } setOpen(false); if (accepted) onAccepted?.(); })} className={`rounded-xl px-4 py-2 font-bold text-white ${accepted ? "bg-emerald-600" : "bg-red-600"}`}>{pending ? "جارٍ الحفظ…" : "تأكيد القرار"}</button></div></section></div>}</>;
}
