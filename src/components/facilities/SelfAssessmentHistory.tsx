"use client";

import { useEffect, useState } from "react";
import { getFacilityAssessments, canManageAssessments, recoverAssessment } from "@/lib/actions/assessment-actions";
import { FileText, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import type { Assessment } from "@/lib/types/assessment";
import SavedAssessmentModal from "@/components/assessment/SavedAssessmentModal";

interface SelfAssessmentHistoryProps {
  facilityId: string;
}

export default function SelfAssessmentHistory({ facilityId }: SelfAssessmentHistoryProps) {
  const [assessments, setAssessments] = useState<(Assessment & { previousScore?: number, delta?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const [data, isManager] = await Promise.all([
        getFacilityAssessments(facilityId, undefined, showArchived),
        canManageAssessments()
      ]);
      setAssessments(data);
      setCanManage(isManager);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [facilityId, showArchived]);

  const handleRecover = async (e: React.MouseEvent, assessmentId: string) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من استعادة هذا التقييم؟")) return;
    try {
      const res = await recoverAssessment(assessmentId);
      if (res.success) {
        loadHistory();
      } else {
        alert(res.error || "حدث خطأ أثناء الاستعادة");
      }
    } catch (err: any) {
      alert("حدث خطأ غير متوقع");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-nebras-green" size={32} />
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
        <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p>لا يوجد سجل تقييم ذاتي لهذه المنشأة.</p>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "high": return "bg-green-100 text-green-700";
      case "medium": return "bg-amber-100 text-amber-700";
      case "low": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "high": return "مستوى عالي";
      case "medium": return "مستوى متوسط";
      case "low": return "مستوى منخفض";
      default: return "غير محدد";
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "general" ? "مجمع عام" : "مجمع أسنان";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {canManage && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded text-nebras-green focus:ring-nebras-green"
            />
            عرض التقييمات المؤرشفة
          </label>
        )}
        <div className={!canManage ? "ml-auto" : ""}>
          <a 
            href={`/assessment?facility_id=${facilityId}`}
            className="flex items-center gap-2 bg-nebras-green text-white px-4 py-2 rounded-lg font-bold hover:bg-[#208f60] transition-colors text-sm"
          >
            <FileText size={16} />
            بدء تقييم جديد
          </a>
        </div>
      </div>
      
      {assessments.map((assessment) => (
        <div 
          key={assessment.id} 
          onClick={() => setSelectedAssessment(assessment)}
          className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer ${!assessment.isActive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-100"}`}
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-bold text-gray-800 text-lg">{assessment.overallScore}%</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${!assessment.isActive ? "bg-gray-200 text-gray-600" : getTierColor(assessment.readinessTier)}`}>
                  {getTierLabel(assessment.readinessTier)}
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {getTypeLabel(assessment.facilityTypeAssessed)}
                </span>
                {!assessment.isActive && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                    مؤرشف
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                <span>تاريخ التقييم: {new Date(assessment.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {assessment.previousScore !== undefined && assessment.delta !== undefined && (
                <div className="bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{assessment.previousScore}%</span>
                  <ArrowLeft size={14} className="text-gray-400" />
                  <span className="font-bold text-gray-800">{assessment.overallScore}%</span>
                  <span className={`font-bold ml-1 dir-ltr ${assessment.delta > 0 ? "text-green-600" : assessment.delta < 0 ? "text-red-600" : "text-gray-500"}`}>
                    ({assessment.delta > 0 ? "+" : ""}{assessment.delta}%)
                  </span>
                </div>
              )}

              {canManage && !assessment.isActive && (
                <button
                  onClick={(e) => handleRecover(e, assessment.id)}
                  className="flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                  title="استعادة التقييم"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
            
          </div>
        </div>
      ))}
      
      <SavedAssessmentModal 
        assessment={selectedAssessment} 
        isOpen={!!selectedAssessment} 
        onClose={() => setSelectedAssessment(null)}
        canManage={canManage}
        onRefresh={loadHistory}
      />
    </div>
  );
}
