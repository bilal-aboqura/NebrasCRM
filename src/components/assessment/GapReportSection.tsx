"use client";

import { Printer, ArrowRight, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { ScoreBreakdown, FacilityType } from "@/hooks/use-cbahi-session";

interface GapReportSectionProps {
  scoreBreakdown: ScoreBreakdown;
  facilityType: FacilityType;
  onBack: () => void;
}

export default function GapReportSection({ scoreBreakdown, facilityType, onBack }: GapReportSectionProps) {
  const { score, gaps, tier, tierLabel, tierDescription } = scoreBreakdown;
  const scorePercent = Math.round(score);

  // Link to the public lead capture form with pre-filled query params
  const ctaLink = `/?type=${facilityType}&score=${scorePercent}#assessment`;

  const tierColors = {
    high: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-red-50 text-red-700 border-red-200",
  };

  const TierIcon = tier === 'high' ? CheckCircle : tier === 'medium' ? AlertTriangle : AlertCircle;

  return (
    <div className="mx-auto max-w-4xl space-y-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-6 print:border-black">
        <div>
          <h2 className="text-2xl font-bold text-nebras-ink">تقرير الجاهزية المبدئي</h2>
          <p className="text-sm text-gray-500 mt-1">
            لـ {facilityType === "general" ? "المجمعات الطبية العامة" : "مجمعات وعيادات الأسنان"}
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Printer size={18} />
            طباعة التقرير
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg border border-nebras-green bg-white px-4 py-2 font-bold text-nebras-green transition-colors hover:bg-green-50"
          >
            <ArrowRight size={18} />
            تعديل التقييم
          </button>
        </div>
      </div>

      <div className={`rounded-xl border p-6 flex flex-col md:flex-row items-center gap-6 ${tierColors[tier]}`}>
        <div className="shrink-0">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="text-3xl font-black">{scorePercent}%</span>
          </div>
        </div>
        <div className="flex-1 text-center md:text-right">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
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
                  <th className="p-4 font-bold w-24">الرمز</th>
                  <th className="p-4 font-bold w-32">الفصل</th>
                  <th className="p-4 font-bold">وصف المعيار</th>
                  <th className="p-4 font-bold w-32">التقييم الحالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gaps.map((gap, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-nebras-green">{gap.code}</td>
                    <td className="p-4 text-gray-600">{gap.chapter}</td>
                    <td className="p-4 font-medium text-gray-900">{gap.question}</td>
                    <td className="p-4">
                      <span className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                        gap.value === "0.5" ? "bg-amber-100 text-amber-700" :
                        gap.value === "0" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {gap.value === "0.5" ? "متوفر جزئياً" :
                         gap.value === "0" ? "غير متوفر" :
                         "لم يتم الإجابة"}
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
          <h3 className="text-xl font-bold mb-2">تهانينا! لا توجد فجوات رئيسية مسجلة.</h3>
          <p>أنت في جاهزية ممتازة للاعتماد.</p>
        </div>
      )}

      <div className="mt-8 rounded-xl bg-nebras-ink p-8 text-center text-white print:hidden">
        <h3 className="mb-4 text-2xl font-bold">هل تحتاج لمساعدة في تحسين الجاهزية؟</h3>
        <p className="mb-6 text-gray-300">
          خبراء نبراسكو مستعدون لتقديم الاستشارة وتصميم خطة تحسين متكاملة تضمن نجاحك في الحصول على الاعتماد.
        </p>
        <Link 
          href={ctaLink}
          className="inline-block rounded-lg bg-nebras-gold px-8 py-3 font-bold text-white transition-colors hover:bg-yellow-500"
        >
          طلب استشارة مجانية
        </Link>
      </div>
      
      <div className="hidden print:block mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>تم استخراج هذا التقرير من منصة نبراسكو (NEBRASGOO) - www.nebrasgoo.com</p>
      </div>
    </div>
  );
}
