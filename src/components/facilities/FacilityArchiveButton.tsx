"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { archiveFacility, recoverFacility } from "@/lib/actions/facilities";

export function FacilityArchiveButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    if (pending) return;
    if (active && !window.confirm("هل تريد أرشفة هذه المنشأة؟")) return;
    setError("");
    setPending(true);
    try {
      const result = active ? await archiveFacility(id) : await recoverFacility(id);
      if (!result.success) return setError(result.error);
      setError("");
      if (active) router.push("/dashboard/facilities?archived=1");
      router.refresh();
    } catch { setError("تعذر الاتصال بالخادم. حاول مرة أخرى."); }
    finally { setPending(false); }
  }
  return <div><button type="button" disabled={pending} onClick={run} className={`rounded-xl border px-5 py-3 font-bold disabled:opacity-50 ${active ? "border-red-300 text-red-700" : "border-emerald-500 text-emerald-700"}`}>{pending ? "جارٍ التنفيذ..." : active ? "أرشفة" : "استعادة"}</button>{error && <p role="alert" className="mt-2 max-w-sm text-sm text-red-700">{error}</p>}</div>;
}
