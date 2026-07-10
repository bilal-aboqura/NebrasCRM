"use client";

import { useState } from "react";
import { Archive, CheckCircle, Download, Info, Loader2, MinusCircle, X, XCircle } from "lucide-react";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";
import type { Assessment } from "@/lib/types/assessment";
import { archiveAssessment } from "@/lib/actions/assessment-actions";
// jspdf-autotable is imported dynamically inside handleDownloadPDF

interface SavedAssessmentModalProps {
  assessment: Assessment | null;
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  onRefresh: () => void;
}

export default function SavedAssessmentModal({
  assessment,
  isOpen,
  onClose,
  canManage,
  onRefresh,
}: SavedAssessmentModalProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  if (!isOpen || !assessment) return null;

  const data = CBAHI_DATA[assessment.facilityTypeAssessed];
  const answersMap = new Map(assessment.answers.map((answer) => [answer.item_code, answer]));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Met":
        return <CheckCircle className="text-green-600" size={20} />;
      case "Partially Met":
        return <MinusCircle className="text-amber-500" size={20} />;
      case "Not Met":
        return <XCircle className="text-red-500" size={20} />;
      case "Not Applicable":
        return <MinusCircle className="text-gray-400" size={20} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Met":
        return "مطبق بالكامل";
      case "Partially Met":
        return "مطبق جزئيًا";
      case "Not Met":
        return "غير مطبق";
      case "Not Applicable":
        return "غير منطبق";
      default:
        return "غير محدد";
    }
  };

  const handleArchive = async () => {
    if (!confirm("هل أنت متأكد من أرشفة هذا التقييم؟")) return;

    setIsArchiving(true);
    try {
      const result = await archiveAssessment(assessment.id);
      if (result.success) {
        onRefresh();
        onClose();
        return;
      }
      alert(result.error || "حدث خطأ أثناء الأرشفة");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDownloadPDF = async () => {
    // Dynamically import both — must use the named export for reliable bundling
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const dateStr = new Date(assessment.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 52, 96);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Assessment Details - ${data.title}`, pageW / 2, 11, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${dateStr}   |   Overall Score: ${assessment.overallScore}%`, pageW / 2, 20, { align: "center" });

    // ── Summary stats ────────────────────────────────────────────────────────
    const allAnswers = assessment.answers;
    const counts = {
      total: allAnswers.length,
      met: allAnswers.filter((a) => a.status === "Met").length,
      partial: allAnswers.filter((a) => a.status === "Partially Met").length,
      notMet: allAnswers.filter((a) => a.status === "Not Met").length,
      na: allAnswers.filter((a) => a.status === "Not Applicable").length,
    };

    // Use standalone autoTable(doc, options) — avoids prototype-patch issues in Next.js
    autoTable(doc, {
      startY: 33,
      head: [["Total Items", "Met (Compliant)", "Partially Met", "Not Met", "Not Applicable"]],
      body: [[counts.total, counts.met, counts.partial, counts.notMet, counts.na]],
      theme: "grid",
      headStyles: { fillColor: [200, 162, 50], textColor: 255, fontStyle: "bold", halign: "center" },
      bodyStyles: { halign: "center", fontSize: 11 },
      margin: { left: 10, right: 10 },
    });

    // ── Detailed items ───────────────────────────────────────────────────────
    // jsPDF's built-in Helvetica font has NO Arabic glyph support.
    // Use English-only labels here; colour-code cells to preserve visual meaning.
    const pdfStatusLabel = (s: string) => {
      if (s === "Met") return "Met";
      if (s === "Partially Met") return "Partially Met";
      if (s === "Not Met") return "Not Met";
      if (s === "Not Applicable") return "N/A";
      return "Unknown";
    };
    const statusFill = (s: string): [number, number, number] => {
      if (s === "Met") return [220, 252, 231];      // green-100
      if (s === "Partially Met") return [254, 243, 199]; // amber-100
      if (s === "Not Met") return [254, 226, 226];  // red-100
      return [241, 245, 249];                        // slate-100 (N/A / unknown)
    };
    const statusInk = (s: string): [number, number, number] => {
      if (s === "Met") return [22, 101, 52];         // green-800
      if (s === "Partially Met") return [120, 53, 15]; // amber-900
      if (s === "Not Met") return [153, 27, 27];    // red-800
      return [100, 116, 139];                        // slate-500 (N/A / unknown)
    };

    const rowStatuses: string[] = [];
    const rows: string[][] = [];
    data.chapters.forEach((chapter) => {
      chapter.standards.forEach((standard) => {
        standard.items.forEach((item) => {
          const answer = answersMap.get(item.code);
          if (!answer) return;
          rowStatuses.push(answer.status);
          rows.push([
            item.code,
            item.question,
            item.suggestedEvidence ?? "",
            pdfStatusLabel(answer.status),
            answer.notes ?? "",
            chapter.title,
            standard.code,
          ]);
        });
      });
    });

    // Capture the finalY after the summary table
    const summaryFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 55;

    autoTable(doc, {
      startY: summaryFinalY + 6,
      head: [["Code", "Question", "Suggested Evidence", "Status", "Notes", "Chapter", "Standard"]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [15, 52, 96], textColor: 255, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 7, valign: "top", overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 70 },
        2: { cellWidth: 55 },
        3: { cellWidth: 28, halign: "center", fontStyle: "bold" },
        4: { cellWidth: 38 },
        5: { cellWidth: 42 },
        6: { cellWidth: 18 },
      },
      margin: { left: 10, right: 10 },
      willDrawCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 3) {
          const s = rowStatuses[hookData.row.index] ?? "";
          hookData.cell.styles.fillColor = statusFill(s);
          hookData.cell.styles.textColor = statusInk(s);
        }
      },
      didDrawPage: (hookData) => {
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `Page ${hookData.pageNumber} | NebrasCRM - CBAHI Assessment Report`,
          pageW / 2,
          pageH - 4,
          { align: "center" },
        );
      },
    });

    const safeDate = new Date(assessment.createdAt).toISOString().slice(0, 10);
    const fileName = `CBAHI_Assessment_${data.title.replace(/\s+/g, "_")}_${safeDate}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50 p-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">تفاصيل التقييم - {data.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              تاريخ: {new Date(assessment.createdAt).toLocaleDateString("ar-SA")} | النتيجة: {assessment.overallScore}%
              {!assessment.isActive && (
                <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">مؤرشف</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 rounded-lg bg-nebras-green/10 px-3 py-1.5 text-sm font-bold text-nebras-green transition-colors hover:bg-nebras-green/20"
            >
              <Download size={16} />
              تحميل PDF
            </button>
            {canManage && assessment.isActive && (
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {isArchiving ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
                أرشفة التقييم
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
          {data.chapters.map((chapter) => (
            <div key={chapter.code} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-slate-50 p-4">
                <h3 className="text-lg font-bold text-nebras-ink">{chapter.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {chapter.standards.length} معايير - {chapter.items.length} عناصر تقييم
                </p>
              </div>

              <div className="space-y-5 p-4 sm:p-5">
                {chapter.standards.map((standard) => {
                  const answeredItems = standard.items.filter((item) => answersMap.has(item.code));
                  if (answeredItems.length === 0) return null;

                  return (
                    <section key={standard.code} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                      <div className="border-b border-slate-200 bg-white/80 px-4 py-4 sm:px-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-nebras-gold/15 px-2.5 py-1 text-xs font-bold text-nebras-gold">
                            {standard.code}
                          </span>
                          <p className="text-sm font-bold leading-7 text-slate-900 sm:text-base">{standard.title}</p>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-200">
                        {answeredItems.map((item) => {
                          const answer = answersMap.get(item.code);
                          if (!answer) return null;

                          return (
                            <div key={item.code} className="p-4 transition-colors hover:bg-white/70 sm:p-5">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded bg-nebras-green/10 px-2 py-1 text-xs font-bold text-nebras-green">
                                      {item.code}
                                    </span>
                                    <p className="font-bold leading-snug text-gray-900">{item.question}</p>
                                  </div>

                                  {item.suggestedEvidence && (
                                    <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                                      <Info size={16} className="mt-0.5 shrink-0 text-nebras-gold" />
                                      <p>دليل الإثبات: {item.suggestedEvidence}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex w-full shrink-0 items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 lg:w-auto">
                                  {getStatusIcon(answer.status)}
                                  <span className="text-sm font-bold text-gray-700">{getStatusText(answer.status)}</span>
                                </div>
                              </div>

                              {answer.notes && (
                                <div className="mt-4 rounded-lg border border-yellow-100 bg-yellow-50/50 p-3 text-sm text-gray-700">
                                  <strong>ملاحظات:</strong> {answer.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
