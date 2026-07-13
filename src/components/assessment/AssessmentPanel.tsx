"use client";

import { Info, MessageSquare } from "lucide-react";
import type { AssessmentLanguage } from "@/lib/data/cbahi-localization";
import type { AssessmentDataSet } from "@/lib/data/cbahi-data";
import type { AnswerValue, FacilityType } from "@/hooks/use-cbahi-session";

interface AssessmentPanelProps {
  assessmentData: AssessmentDataSet;
  facilityType: FacilityType;
  answers: Record<string, AnswerValue>;
  notes: Record<string, string>;
  activeChapterFilter: string;
  language: AssessmentLanguage;
  setAnswer: (code: string, value: AnswerValue) => void;
  setNote: (code: string, note: string) => void;
  setChapterFilter: (chapterCode: string) => void;
}

const copy = {
  ar: { heading: "أسئلة التقييم", all: "جميع الفصول", standards: "معايير", items: "عناصر تقييم", evidence: "دليل الإثبات:", choose: "اختر التقييم...", full: "متوفر ومطبق بالكامل (1)", partial: "متوفر جزئيًا (0.5)", none: "غير متوفر (0)", na: "غير منطبق (N/A)", notes: "ملاحظات وخطة التحسين (اختياري)..." },
  en: { heading: "Assessment questions", all: "All chapters", standards: "standards", items: "assessment items", evidence: "Suggested evidence:", choose: "Choose an assessment...", full: "Fully met (1)", partial: "Partially met (0.5)", none: "Not met (0)", na: "Not applicable (N/A)", notes: "Notes and improvement plan (optional)..." },
} as const;

export default function AssessmentPanel({ assessmentData, facilityType, answers, notes, activeChapterFilter, language, setAnswer, setNote, setChapterFilter }: AssessmentPanelProps) {
  const data = assessmentData[facilityType];
  const visibleChapters = data.chapters.filter((chapter) => activeChapterFilter === "all" || chapter.code === activeChapterFilter);
  const text = copy[language];

  return (
    <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4 flex items-center justify-between gap-4 print:hidden">
        <h2 className="text-xl font-bold text-gray-800">{text.heading} ({data.title})</h2>
        <select className="rounded-md border border-gray-300 p-2 text-sm text-gray-700 outline-none focus:border-nebras-green" value={activeChapterFilter} onChange={(event) => setChapterFilter(event.target.value)}>
          <option value="all">{text.all}</option>
          {data.chapters.map((chapter) => <option key={chapter.code} value={chapter.code}>{chapter.title}</option>)}
        </select>
      </div>

      {visibleChapters.map((chapter) => (
        <div key={chapter.code} className="break-before-page overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-slate-50 p-4">
            <h3 className="text-lg font-bold text-nebras-ink">{chapter.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{chapter.standards.length} {text.standards} - {chapter.items.length} {text.items}</p>
          </div>
          <div className="space-y-6 p-4 sm:p-6">
            {chapter.standards.map((standard) => (
              <section key={standard.code} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                <div className="border-b border-slate-200 bg-white/80 px-4 py-4 sm:px-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded bg-nebras-gold/15 px-2.5 py-1 text-xs font-bold text-nebras-gold">{standard.code}</span><p className="text-sm font-bold leading-7 text-slate-900 sm:text-base">{standard.title}</p></div></div>
                <div className="divide-y divide-slate-200">
                  {standard.items.map((item) => (
                    <div key={item.code} className="p-4 transition-colors hover:bg-white/70 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 space-y-2"><div className="flex items-center gap-2"><span className="rounded bg-nebras-green/10 px-2 py-1 text-xs font-bold text-nebras-green">{item.code}</span><p className="font-bold leading-snug text-gray-900">{item.question}</p></div>{item.suggestedEvidence && <div className="mt-2 flex items-start gap-2 text-sm text-gray-500"><Info size={16} className="mt-0.5 shrink-0 text-nebras-gold" /><p>{text.evidence} {item.suggestedEvidence}</p></div>}</div>
                        <div className="w-full shrink-0 print:hidden lg:w-48"><select value={answers[item.code] || ""} onChange={(event) => setAnswer(item.code, event.target.value as AnswerValue)} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-700 outline-none focus:border-nebras-green focus:ring-1 focus:ring-nebras-green"><option value="" disabled>{text.choose}</option><option value="1">{text.full}</option><option value="0.5">{text.partial}</option><option value="0">{text.none}</option><option value="na">{text.na}</option></select></div>
                      </div>
                      <div className="mt-4 print:hidden"><div className="flex items-start gap-2"><MessageSquare size={16} className="mt-2 shrink-0 text-gray-400" /><textarea value={notes[item.code] || ""} onChange={(event) => setNote(item.code, event.target.value)} placeholder={text.notes} className="w-full resize-none rounded-lg border border-gray-200 bg-white p-2 text-sm text-gray-700 outline-none focus:border-nebras-green focus:ring-1 focus:ring-nebras-green" rows={2} /></div></div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
