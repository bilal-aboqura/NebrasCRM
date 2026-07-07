"use client";

import { ArrowRight, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import type { AnswerValue, ScoreBreakdown, FacilityType } from "@/hooks/use-cbahi-session";

interface GapReportSectionProps {
  scoreBreakdown: ScoreBreakdown;
  facilityType: FacilityType;
  answers: Record<string, AnswerValue>;
  notes: Record<string, string>;
  onBack: () => void;
  isSavingAssessment?: boolean;
  saveError?: string | null;
  saveMessage?: string | null;
  linkedFacilityName?: string | null;
}

export default function GapReportSection({
  scoreBreakdown,
  facilityType,
  answers: _answers,
  notes: _notes,
  onBack,
  isSavingAssessment = false,
  saveError,
  saveMessage,
  linkedFacilityName,
}: GapReportSectionProps) {
  const { score, gaps, tier, tierLabel, tierDescription } = scoreBreakdown;
  const scorePercent = Math.round(score);

  const tierColors = {
    high: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-red-50 text-red-700 border-red-200",
  };

  const TierIcon = tier === "high" ? CheckCircle : tier === "medium" ? AlertTriangle : AlertCircle;

  return (
    <div className="mx-auto max-w-4xl space-y-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between border-b border-gray-100 pb-6 print:border-black sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-nebras-ink">تقرير الجاهزية المبدئي</h2>
          <p className="mt-1 text-sm text-gray-500">
            لـ {facilityType === "general" ? "المجمعات الطبية العامة" : "مجمعات وعيادات الأسنان"}
          </p>
        </div>

        <div className="mt-4 flex gap-4 print:hidden sm:mt-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg border border-nebras-green bg-white px-4 py-2 font-bold text-nebras-green transition-colors hover:bg-green-50"
          >
            <ArrowRight size={18} />
            تعديل التقييم
          </button>
        </div>
      </div>

      {(isSavingAssessment || saveMessage || saveError || linkedFacilityName) && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            saveError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {saveError
            ? saveError
            : isSavingAssessment
              ? `جارٍ حفظ هذا التقييم داخل ملف المنشأة: ${linkedFacilityName ?? "المنشأة"}`
              : saveMessage ?? (linkedFacilityName ? `سيتم حفظ هذا التقييم داخل ملف المنشأة: ${linkedFacilityName}` : "")}
        </div>
      )}

      <div className={`flex flex-col items-center gap-6 rounded-xl border p-6 md:flex-row ${tierColors[tier]}`}>
        <div className="shrink-0">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="text-3xl font-black">{scorePercent}%</span>
          </div>
        </div>
        <div className="flex-1 text-center md:text-right">
          <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
            <TierIcon size={24} />
            <h3 className="text-xl font-bold">{tierLabel}</h3>
          </div>
          <p className="text-lg opacity-90">{tierDescription}</p>
        </div>
      </div>

      {gaps.length > 0 ? (
        <div>
          <h3 className="mb-4 text-xl font-bold text-nebras-ink">أبرز الفجوات التي تحتاج تحسين ({gaps.length})</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-gray-600">
                <tr>
                  <th className="w-24 p-4 font-bold">الرمز</th>
                  <th className="w-32 p-4 font-bold">الفصل</th>
                  <th className="p-4 font-bold">وصف المعيار</th>
                  <th className="w-32 p-4 font-bold">التقييم الحالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gaps.map((gap, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-nebras-green">{gap.code}</td>
                    <td className="p-4 text-gray-600">{gap.chapter}</td>
                    <td className="p-4 font-medium text-gray-900">{gap.question}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                          gap.value === "0.5"
                            ? "bg-amber-100 text-amber-700"
                            : gap.value === "0"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {gap.value === "0.5" ? "متوفر جزئيًا" : gap.value === "0" ? "غير متوفر" : "لم يتم الإجابة"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center text-green-700">
          <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="mb-2 text-xl font-bold">تهانينا! لا توجد فجوات رئيسية مسجلة.</h3>
          <p>أنت في جاهزية ممتازة للاعتماد.</p>
        </div>
      )}

      <div className="mt-8 hidden border-t border-gray-200 pt-8 text-center text-sm text-gray-500 print:block">
        <p>تم استخراج هذا التقرير من منصة نبراسكو (NEBRASGOO) - www.nebrasgoo.com</p>
      </div>
    </div>
  );
}
