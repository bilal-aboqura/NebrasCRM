"use client";

import { RefreshCw, FileText } from "lucide-react";
import type { ScoreBreakdown } from "@/hooks/use-cbahi-session";

interface ScoringSidebarProps {
  scoreBreakdown: ScoreBreakdown;
  onReset: () => void; // Phase 6 task T015
  onGenerateReport: () => void; // Phase 5 task T011
}

export default function ScoringSidebar({ scoreBreakdown, onReset, onGenerateReport }: ScoringSidebarProps) {
  const {
    score,
    pointsEarned,
    applicableItems,
    totalItems,
    answeredCount,
    unansweredCount,
    isComplete,
    tierLabel,
    tierDescription,
    tier,
  } = scoreBreakdown;
  const progressPercent = Math.round((answeredCount / totalItems) * 100) || 0;
  const scorePercent = Math.round(score);

  // Determine colors based on tier
  const tierColors = {
    high: "text-green-600 bg-green-50 border-green-200 ring-green-600",
    medium: "text-amber-600 bg-amber-50 border-amber-200 ring-amber-500",
    low: "text-red-600 bg-red-50 border-red-200 ring-red-500",
  };

  const currentTierColor = answeredCount === 0 ? "text-gray-400 bg-gray-50 border-gray-200 ring-gray-200" : tierColors[tier];

  return (
    <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-lg print:hidden">
      <h2 className="mb-6 text-xl font-bold text-nebras-ink">نتيجة التقييم</h2>

      <div className="mb-8 flex flex-col items-center justify-center">
        {/* CSS Conic Gradient for Circular Score */}
        <div 
          className={`relative flex h-40 w-40 items-center justify-center rounded-full bg-slate-100 before:absolute before:inset-2 before:rounded-full before:bg-white`}
          style={{
            background: answeredCount > 0 
              ? `conic-gradient(${tier === 'high' ? '#16a34a' : tier === 'medium' ? '#d97706' : '#dc2626'} ${scorePercent * 3.6}deg, #f1f5f9 0deg)`
              : `conic-gradient(#e2e8f0 360deg, #f1f5f9 0deg)`
          }}
        >
          <div className="relative z-10 flex flex-col items-center">
            <span className={`text-4xl font-black ${answeredCount > 0 ? (tier === 'high' ? 'text-green-600' : tier === 'medium' ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}>
              {scorePercent}%
            </span>
            <span className="text-xs text-gray-500 mt-1">نسبة التوافق</span>
          </div>
        </div>

        {answeredCount > 0 && (
          <div className={`mt-6 rounded-lg border p-4 text-center ${currentTierColor}`}>
            <h3 className="font-bold">{tierLabel}</h3>
            <p className="mt-1 text-xs">{tierDescription}</p>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-600">التقدم في التقييم</span>
            <span className="font-bold text-gray-900">{answeredCount} / {totalItems}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div 
              className="h-full bg-nebras-green transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-600">النقاط المكتسبة</span>
            <span className="font-bold text-nebras-ink">{pointsEarned}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-gray-600">المعايير المنطبقة</span>
            <span className="font-bold text-nebras-ink">{applicableItems}</span>
          </div>
        </div>

        {!isComplete && answeredCount > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            أكمل جميع البنود أولاً قبل إصدار التقرير أو حفظ التقييم. المتبقي: {unansweredCount}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onGenerateReport}
          disabled={!isComplete}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-nebras-green px-4 py-3 font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <FileText size={18} />
          إصدار تقرير الجاهزية
        </button>

        <button
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600"
        >
          <RefreshCw size={18} />
          إعادة تعيين التقييم
        </button>
      </div>
    </div>
  );
}
