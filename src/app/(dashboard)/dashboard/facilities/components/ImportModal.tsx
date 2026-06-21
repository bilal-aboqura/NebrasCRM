"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

type PreviewRow = {
  index: number;
  status: "valid" | "error" | "duplicate";
  data: { name_ar: string; type: string; primary_phone: string };
  errors: string[];
};

type Preview = {
  batchId: string;
  summary: { total: number; valid: number; errors: number; duplicates: number };
  rows: PreviewRow[];
};

const statusLabel = { valid: "صالح", error: "خطأ", duplicate: "مكرر" };
const statusClass = { valid: "bg-emerald-50 text-emerald-700", error: "bg-red-50 text-red-700", duplicate: "bg-amber-50 text-amber-800" };

export function ImportModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<number | null>(null);

  async function upload() {
    if (!file) return setError("اختر ملفاً أولاً.");
    setLoading(true); setError(""); setPreview(null);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/facilities/import/preview", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "تعذر تحليل الملف.");
      setPreview(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحليل الملف.");
    } finally { setLoading(false); }
  }

  async function confirmImport() {
    if (!preview?.summary.valid) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/facilities/import/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: preview.batchId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "تعذر تأكيد الاستيراد.");
      setConfirmed(body.importedCount); setPreview(null); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تأكيد الاستيراد.");
    } finally { setLoading(false); }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-nebras-gold px-4 py-2 font-bold text-nebras-green"><Upload size={18} />استيراد Excel</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
        <header className="flex items-start justify-between gap-4"><div><h2 id="import-title" className="text-2xl font-extrabold text-nebras-green">استيراد المنشآت</h2><p className="mt-1 text-sm text-slate-600">ارفع ملف Excel أو CSV، راجع النتائج، ثم أكّد السجلات الصالحة فقط.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="rounded-lg p-2 hover:bg-slate-100"><X /></button></header>
        <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <label className="min-w-72 flex-1 text-sm font-bold">ملف البيانات<input type="file" accept=".xlsx,.csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setConfirmed(null); setError(""); }} className="mt-2 block w-full rounded-xl border bg-white p-2 font-normal" /></label>
          <button type="button" onClick={upload} disabled={loading || !file} className="inline-flex items-center gap-2 rounded-xl bg-nebras-green px-5 py-2.5 font-bold text-white disabled:opacity-50"><FileSpreadsheet size={18} />{loading ? "جارٍ التحليل..." : "معاينة الملف"}</button>
          <a href="/api/facilities/import/template" className="inline-flex items-center gap-2 rounded-xl border border-nebras-green px-5 py-2.5 font-bold text-nebras-green"><Download size={18} />تحميل القالب</a>
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {confirmed !== null && <p className="mt-4 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم استيراد {confirmed} منشأة بنجاح.</p>}
        {preview && <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[
            ["إجمالي الصفوف", preview.summary.total], ["صالحة", preview.summary.valid], ["أخطاء", preview.summary.errors], ["مكررة", preview.summary.duplicates],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><span className="block text-sm text-slate-600">{label}</span><strong className="text-2xl text-nebras-green">{value}</strong></div>)}</div>
          <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[700px] text-right text-sm"><thead className="bg-slate-100"><tr><th className="p-3">الصف</th><th className="p-3">المنشأة</th><th className="p-3">الهاتف</th><th className="p-3">الحالة</th><th className="p-3">التفاصيل</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.index} className="border-t"><td className="p-3">{row.index}</td><td className="p-3 font-bold">{row.data.name_ar || "—"}</td><td className="p-3" dir="ltr">{row.data.primary_phone}</td><td className="p-3"><span className={`rounded-full px-3 py-1 ${statusClass[row.status]}`}>{statusLabel[row.status]}</span></td><td className="p-3 text-slate-600">{row.errors.join("، ") || "جاهز للاستيراد"}</td></tr>)}</tbody></table></div>
          <button type="button" onClick={confirmImport} disabled={loading || preview.summary.valid === 0} className="rounded-xl bg-nebras-green px-6 py-3 font-bold text-white disabled:opacity-50">{loading ? "جارٍ الاستيراد..." : `تأكيد استيراد ${preview.summary.valid} منشأة`}</button>
        </div>}
      </div>
    </div>}
  </>;
}
