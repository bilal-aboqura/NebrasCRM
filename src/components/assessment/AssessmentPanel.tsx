"use client";

import { MessageSquare, Info } from "lucide-react";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";
import type { FacilityType, AnswerValue } from "@/hooks/use-cbahi-session";

interface AssessmentPanelProps {
  facilityType: FacilityType;
  answers: Record<string, AnswerValue>;
  notes: Record<string, string>;
  activeChapterFilter: string;
  setAnswer: (code: string, value: AnswerValue) => void;
  setNote: (code: string, note: string) => void;
  setChapterFilter: (chapterCode: string) => void; // Phase 6 task T014 logic placeholder
}

export default function AssessmentPanel({
  facilityType,
  answers,
  notes,
  activeChapterFilter,
  setAnswer,
  setNote,
  setChapterFilter
}: AssessmentPanelProps) {
  const data = CBAHI_DATA[facilityType];

  const visibleChapters = data.chapters.filter(ch => 
    activeChapterFilter === "all" || ch.code === activeChapterFilter
  );

  return (
    <div className="space-y-8">
      {/* Chapter Filter Placeholder for Phase 6 */}
      <div className="print:hidden flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">أسئلة التقييم ({data.title})</h2>
        <select 
          className="rounded-md border border-gray-300 p-2 text-sm text-gray-700 outline-none focus:border-nebras-green"
          value={activeChapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
        >
          <option value="all">جميع الفصول</option>
          {data.chapters.map(ch => (
            <option key={ch.code} value={ch.code}>{ch.title}</option>
          ))}
        </select>
      </div>

      {visibleChapters.map((chapter) => (
        <div key={chapter.code} className="break-before-page rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 p-4">
            <h3 className="font-bold text-nebras-ink text-lg">{chapter.title}</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {chapter.items.map((item) => (
              <div key={item.code} className="p-4 sm:p-6 transition-colors hover:bg-slate-50/50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-nebras-green/10 px-2 py-1 text-xs font-bold text-nebras-green">
                        {item.code}
                      </span>
                      <p className="font-bold text-gray-900 leading-snug">{item.question}</p>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm text-gray-500 mt-2">
                      <Info size={16} className="mt-0.5 shrink-0 text-nebras-gold" />
                      <p>دليل الإثبات: {item.suggestedEvidence}</p>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-48 shrink-0 print:hidden">
                    <select
                      value={answers[item.code] || ""}
                      onChange={(e) => setAnswer(item.code, e.target.value as AnswerValue)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-700 outline-none focus:border-nebras-green focus:ring-1 focus:ring-nebras-green"
                    >
                      <option value="" disabled>اختر التقييم...</option>
                      <option value="1">متوفر ومطبق بالكامل (1)</option>
                      <option value="0.5">متوفر جزئياً (0.5)</option>
                      <option value="0">غير متوفر (0)</option>
                      <option value="na">غير منطبق (N/A)</option>
                    </select>
                  </div>
                  <div className="hidden print:block w-full text-sm">
                     <strong>التقييم: </strong> 
                     {answers[item.code] === "1" ? "متوفر ومطبق بالكامل (1)" :
                      answers[item.code] === "0.5" ? "متوفر جزئياً (0.5)" :
                      answers[item.code] === "0" ? "غير متوفر (0)" :
                      answers[item.code] === "na" ? "غير منطبق (N/A)" : "لم يتم التقييم"}
                  </div>
                </div>
                
                <div className="mt-4 print:hidden">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={16} className="mt-2 shrink-0 text-gray-400" />
                    <textarea
                      value={notes[item.code] || ""}
                      onChange={(e) => setNote(item.code, e.target.value)}
                      placeholder="ملاحظات وخطة التحسين (اختياري)..."
                      className="w-full resize-none rounded-lg border border-gray-200 bg-slate-50 p-2 text-sm text-gray-700 outline-none focus:border-nebras-green focus:bg-white focus:ring-1 focus:ring-nebras-green"
                      rows={2}
                    />
                  </div>
                </div>

                {notes[item.code] && (
                  <div className="hidden print:block mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>ملاحظات: </strong> {notes[item.code]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
