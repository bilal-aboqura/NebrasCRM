"use client";

import { useCbahisession } from "@/hooks/use-cbahi-session";
import FacilityTypeSelector from "@/components/assessment/FacilityTypeSelector";
import AssessmentPanel from "@/components/assessment/AssessmentPanel";
import ScoringSidebar from "@/components/assessment/ScoringSidebar";
import GapReportSection from "@/components/assessment/GapReportSection";

export default function AssessmentPage() {
  const { state, setFacilityType, setAnswer, setNote, setChapterFilter, setShowReport, reset, scoreBreakdown } = useCbahisession();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center print:hidden">
        <h1 className="mb-2 text-3xl font-bold text-nebras-green">التقييم الذاتي لمتطلبات الاعتماد</h1>
        <p className="text-gray-600">اختر نوع المنشأة للبدء في تقييم جاهزيتك لمعايير سباهي (CBAHI)</p>
      </div>

      <div className="mb-8">
        <FacilityTypeSelector
          currentType={state.facilityType}
          onChange={setFacilityType}
          hasAnswers={scoreBreakdown.answeredCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!state.showReport && (
            <AssessmentPanel
              facilityType={state.facilityType}
              answers={state.answers}
              notes={state.notes}
              activeChapterFilter={state.activeChapterFilter}
              setAnswer={setAnswer}
              setNote={setNote}
              setChapterFilter={setChapterFilter}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          {!state.showReport && (
            <ScoringSidebar
              scoreBreakdown={scoreBreakdown}
              onReset={() => {
                if (confirm("هل أنت متأكد من مسح جميع بيانات التقييم؟")) reset();
              }}
              onGenerateReport={() => setShowReport(true)}
            />
          )}
        </div>
      </div>

      {state.showReport && (
        <div className="mt-8">
          <GapReportSection
            scoreBreakdown={scoreBreakdown}
            facilityType={state.facilityType}
            onBack={() => setShowReport(false)}
          />
        </div>
      )}
    </div>
  );
}
