/**
 * ImportModal.tsx - Bulk import modal for facilities (Feature 011)
 *
 * Provides a 3-step flow:
 * 1. Upload: select file + download template
 * 2. Preview: display validation results (valid/error/duplicate rows)
 * 3. Confirm: commit import and show success count
 */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ValidationRow {
  index: number;
  status: "valid" | "error" | "duplicate";
  data: {
    name: string;
    type: string;
    city: string;
    primary_phone: string;
  };
  errors: string[];
}

interface PreviewResponse {
  batchId: string;
  summary: {
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
  };
  rows: ValidationRow[];
}

type Step = "upload" | "preview" | "success";

interface ImportModalProps {
  onClose: () => void;
}

export default function ImportModal({ onClose }: ImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  // ── Template download ─────────────────────────────────────────────────────
  async function handleTemplateDownload() {
    const response = await fetch("/api/facilities/import/template");
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "template.xlsx";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  // ── File upload & preview ─────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/facilities/import/preview", {
        method: "POST",
        body: formData
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "فشل رفع الملف");
      }

      setPreview(json as PreviewResponse);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }

  // ── Confirm import ────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/facilities/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: preview.batchId })
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "فشل تأكيد الاستيراد");
      }

      setImportedCount(json.importedCount);
      setStep("success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }

  // ── Status badge helper ───────────────────────────────────────────────────
  function statusBadge(status: ValidationRow["status"]) {
    if (status === "valid") return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">صحيح</span>;
    if (status === "error") return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">خطأ</span>;
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">مكرر</span>;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-nebras-line p-5">
          <h2 id="import-modal-title" className="text-lg font-bold text-nebras-green">
            {step === "upload" && "استيراد من Excel"}
            {step === "preview" && "معاينة البيانات"}
            {step === "success" && "تم الاستيراد بنجاح"}
          </h2>
          <button
            id="import-modal-close"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-nebras-cream"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                قم بتحميل القالب أولاً ثم ارفع الملف المكتمل.
              </p>
              <button
                id="download-template-button"
                onClick={handleTemplateDownload}
                className="flex items-center gap-2 rounded-md border border-nebras-line bg-nebras-cream px-4 py-2 text-sm font-medium text-nebras-green hover:bg-nebras-line"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                تحميل القالب
              </button>

              <div
                className="cursor-pointer rounded-lg border-2 border-dashed border-nebras-line p-8 text-center hover:border-nebras-green"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-sm text-slate-500">
                  {selectedFile ? selectedFile.name : "انقر لاختيار ملف Excel أو CSV"}
                </p>
                <input
                  ref={fileInputRef}
                  id="import-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] ?? null);
                    setError(null);
                  }}
                />
              </div>

              {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-md border border-nebras-line px-4 py-2 text-sm text-slate-600 hover:bg-nebras-cream"
                >
                  إلغاء
                </button>
                <button
                  id="upload-preview-button"
                  onClick={handleUpload}
                  disabled={!selectedFile || loading}
                  className="rounded-md bg-nebras-green px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {loading ? "جارٍ المعالجة..." : "رفع ومعاينة"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && preview && (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "إجمالي", value: preview.summary.total, color: "text-slate-700" },
                  { label: "صحيح", value: preview.summary.valid, color: "text-green-700" },
                  { label: "أخطاء", value: preview.summary.errors, color: "text-red-700" },
                  { label: "مكرر", value: preview.summary.duplicates, color: "text-amber-700" }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-nebras-line bg-nebras-cream p-3 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Row table (max 10 rows preview) */}
              <div className="max-h-64 overflow-y-auto rounded-lg border border-nebras-line">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-nebras-cream text-right text-nebras-green">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">اسم المنشأة</th>
                      <th className="p-2">الهاتف</th>
                      <th className="p-2">الحالة</th>
                      <th className="p-2">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 50).map((row) => (
                      <tr key={row.index} className="border-t border-nebras-line">
                        <td className="p-2 text-slate-400">{row.index}</td>
                        <td className="p-2 font-medium">{row.data.name}</td>
                        <td className="p-2 ltr text-left">{row.data.primary_phone}</td>
                        <td className="p-2">{statusBadge(row.status)}</td>
                        <td className="p-2 text-slate-500">{row.errors[0] ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStep("upload")}
                  className="rounded-md border border-nebras-line px-4 py-2 text-sm text-slate-600 hover:bg-nebras-cream"
                >
                  رجوع
                </button>
                {preview.summary.valid > 0 && (
                  <button
                    id="confirm-import-button"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="rounded-md bg-nebras-green px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {loading ? "جارٍ الاستيراد..." : `تأكيد استيراد ${preview.summary.valid} منشأة`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-green-600">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg font-bold text-nebras-green">تم استيراد {importedCount} منشأة بنجاح</p>
              <p className="text-sm text-slate-500">
                تم إضافة المنشآت بحالة &quot;جديد&quot; وبدون مالك مُعيَّن.
              </p>
              <button
                id="import-done-button"
                onClick={onClose}
                className="rounded-md bg-nebras-green px-6 py-2 text-sm font-medium text-white"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
