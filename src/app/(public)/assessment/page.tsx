"use client";

import { useCbahisession } from "@/hooks/use-cbahi-session";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import FacilityTypeSelector from "@/components/assessment/FacilityTypeSelector";
import AssessmentPanel from "@/components/assessment/AssessmentPanel";
import ScoringSidebar from "@/components/assessment/ScoringSidebar";
import GapReportSection from "@/components/assessment/GapReportSection";
import { getFacilityDetail } from "@/lib/actions/facilities";
import type { Facility } from "@/lib/types/domain";

function AssessmentContent() {
  const { state, setFacilityType, setAnswer, setNote, setChapterFilter, setShowReport, reset, scoreBreakdown } = useCbahisession();
  const searchParams = useSearchParams();
  const facilityId = searchParams.get("facility_id");
  const typeParam = searchParams.get("type") as "general" | "dental" | null;
  const [prelinkedFacility, setPrelinkedFacility] = useState<Facility | null>(null);

  useEffect(() => {
    if (typeParam) {
      setFacilityType(typeParam);
    }
    if (facilityId) {
      getFacilityDetail(facilityId)
        .then(fac => {
          setPrelinkedFacility(fac);
          if (!typeParam) {
            if (fac.type.includes("أسنان")) setFacilityType("dental");
            else setFacilityType("general");
          }
        })
        .catch(console.error);
    }
  }, [facilityId, typeParam, setFacilityType]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {prelinkedFacility && (
        <div className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-800 border border-blue-100 flex items-center justify-between">
          <div>
            <span className="font-bold">تقييم مرتبط بمنشأة: </span>
            {prelinkedFacility.name}
          </div>
        </div>
      )}

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

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}>
      <AssessmentContent />
    </Suspense>
  );
}
