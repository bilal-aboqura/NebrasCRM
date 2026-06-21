"use client";

import { useState, useTransition } from "react";
import { terminateContract } from "@/lib/actions/contracts";

export function TerminateContractModal({ contractId, startDate }: { contractId: string; startDate: string }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition(); const [error, setError] = useState("");
  return <><button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700">إنهاء مبكر</button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" dir="rtl"><form className="w-full max-w-md rounded-2xl bg-white p-6" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(async () => { const result = await terminateContract(contractId, { terminatedAt: String(data.get("terminatedAt")), terminatedReason: String(data.get("terminatedReason")) }); if (result.success) setOpen(false); else setError(result.error.message); }); }}><h2 className="text-xl font-extrabold text-nebras-green">إنهاء العقد مبكراً</h2>{error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}<label className="mt-5 block">تاريخ الإنهاء<input required min={startDate} type="date" name="terminatedAt" className="mt-1 w-full rounded-xl border p-3" /></label><label className="mt-4 block">سبب الإنهاء<textarea required minLength={3} name="terminatedReason" rows={4} className="mt-1 w-full rounded-xl border p-3" /></label><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 font-bold">إلغاء</button><button disabled={pending} className="rounded-xl bg-red-700 px-4 py-2 font-bold text-white">تأكيد الإنهاء</button></div></form></div>}</>;
}

