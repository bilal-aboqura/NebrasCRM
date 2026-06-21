"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, X } from "lucide-react";
import { createCallLog } from "@/lib/actions/call-logs";
import { COMMUNICATION_LABELS, type CommunicationChannel, type CommunicationOutcome } from "@/lib/types/call-logs";

export const QUICK_LOG_KEY = "nebras:pending-communication";
export const QUICK_LOG_EVENT = "nebras:pending-communication-changed";
export type PendingCommunication = { facilityId: string; contactId?: string; contactName?: string; channel: CommunicationChannel; clickedAt: number };

export function rememberPendingCommunication(context: Omit<PendingCommunication, "clickedAt">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUICK_LOG_KEY, JSON.stringify({ ...context, clickedAt: Date.now() }));
  window.dispatchEvent(new Event(QUICK_LOG_EVENT));
}

export function readPendingCommunication(now = Date.now()): PendingCommunication | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(QUICK_LOG_KEY) ?? "null") as PendingCommunication | null;
    if (!value || now - value.clickedAt > 300_000) { localStorage.removeItem(QUICK_LOG_KEY); return null; }
    return value;
  } catch { localStorage.removeItem(QUICK_LOG_KEY); return null; }
}

export function TrackedCommunicationLink({ href, facilityId, channel, children, className }: { href: string; facilityId: string; channel: CommunicationChannel; children: React.ReactNode; className: string }) {
  const Icon = channel === "call" ? Phone : MessageCircle;
  return <a href={href} target={channel === "whatsapp" ? "_blank" : undefined} rel={channel === "whatsapp" ? "noreferrer" : undefined} onClick={() => rememberPendingCommunication({ facilityId, channel })} className={className}><Icon size={18} />{children}</a>;
}

export function QuickLogBanner({ facilityId }: { facilityId: string }) {
  const router = useRouter();
  const [context, setContext] = useState<PendingCommunication | null>(null);
  const [outcome, setOutcome] = useState<CommunicationOutcome>("answered");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const reveal = useCallback(() => {
    if (document.visibilityState !== "hidden") {
      const next = readPendingCommunication();
      if (next?.facilityId === facilityId) setContext(next);
    }
  }, [facilityId]);

  useEffect(() => {
    window.addEventListener("focus", reveal);
    window.addEventListener(QUICK_LOG_EVENT, reveal);
    document.addEventListener("visibilitychange", reveal);
    return () => { window.removeEventListener("focus", reveal); window.removeEventListener(QUICK_LOG_EVENT, reveal); document.removeEventListener("visibilitychange", reveal); };
  }, [reveal]);

  function dismiss() { localStorage.removeItem(QUICK_LOG_KEY); setContext(null); setError(""); }
  function save() {
    if (!context) return;
    startTransition(async () => {
      const result = await createCallLog({ facilityId, contactId: context.contactId, channel: context.channel, direction: "outbound", outcome, notes });
      if (!result.success) return setError(result.error);
      dismiss(); router.refresh();
    });
  }

  if (!context) return null;
  return <aside className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-2xl" role="status" dir="rtl">
    <div className="flex flex-wrap items-center gap-3"><div className="min-w-48 flex-1"><p className="font-extrabold text-nebras-green">هل تم التواصل{context.contactName ? ` مع ${context.contactName}` : " مع المنشأة"}؟</p><p className="text-sm text-slate-600">سجّل النتيجة سريعاً قبل أن تضيع التفاصيل.</p></div>
      <select aria-label="نتيجة الاتصال" value={outcome} onChange={(event) => setOutcome(event.target.value as CommunicationOutcome)} className="rounded-xl border bg-white p-2.5">{Object.entries(COMMUNICATION_LABELS.outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <input aria-label="ملاحظات الاتصال" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="ملاحظة قصيرة" className="rounded-xl border bg-white p-2.5" />
      <button type="button" disabled={pending} onClick={save} className="rounded-xl bg-nebras-green px-4 py-2.5 font-bold text-white">{pending ? "جارٍ الحفظ..." : "حفظ"}</button>
      <button type="button" onClick={dismiss} className="rounded-xl border px-3 py-2.5" aria-label="تجاهل"><X size={18} /></button>
    </div>{error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
  </aside>;
}
