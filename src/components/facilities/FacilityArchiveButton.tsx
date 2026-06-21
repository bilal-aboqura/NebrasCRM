"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveFacility, recoverFacility } from "@/lib/actions/facilities";

export function FacilityArchiveButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function run() {
    if (active && !window.confirm("هل تريد أرشفة هذه المنشأة؟")) return;
    startTransition(async () => {
      const result = active ? await archiveFacility(id) : await recoverFacility(id);
      if (!result.success) return setError(result.error);
      setError("");
      router.refresh();
    });
  }
  return <div><button type="button" disabled={pending} onClick={run} className={`rounded-xl border px-5 py-3 font-bold ${active ? "border-red-300 text-red-700" : "border-emerald-500 text-emerald-700"}`}>{pending ? "جارٍ التنفيذ..." : active ? "أرشفة" : "استعادة"}</button>{error && <p className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
