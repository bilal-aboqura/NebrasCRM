"use client";

import { CBAHI_DATA } from "@/lib/data/cbahi-data";
import type { Assessment } from "@/lib/types/assessment";
import { X, CheckCircle, XCircle, MinusCircle, Info, Archive, Loader2 } from "lucide-react";
import { useState } from "react";
import { archiveAssessment } from "@/lib/actions/assessment-actions";

interface SavedAssessmentModalProps {
  assessment: Assessment | null;
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  onRefresh: () => void;
}

export default function SavedAssessmentModal({ assessment, isOpen, onClose, canManage, onRefresh }: SavedAssessmentModalProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  if (!isOpen || !assessment) return null;

  const data = CBAHI_DATA[assessment.facilityTypeAssessed];
  
  // Create a map for quick lookup
  const answersMap = new Map(assessment.answers.map(a => [a.item_code, a]));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Met": return <CheckCircle className="text-green-600" size={20} />;
      case "Partially Met": return <MinusCircle className="text-amber-500" size={20} />;
      case "Not Met": return <XCircle className="text-red-500" size={20} />;
      case "Not Applicable": return <MinusCircle className="text-gray-400" size={20} />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Met": return "مطبق بالكامل";
      case "Partially Met": return "مطبق جزئياً";
      case "Not Met": return "غير مطبق";
      case "Not Applicable": return "غير منطبق";
      default: return "غير محدد";
    }
  };

  const handleArchive = async () => {
    if (!assessment || !confirm("هل أنت متأكد من أرشفة هذا التقييم؟")) return;
    
    setIsArchiving(true);
    try {
      const res = await archiveAssessment(assessment.id);
      if (res.success) {
        onRefresh();
        onClose();
      } else {
        alert(res.error || "حدث خطأ أثناء الأرشفة");
      }
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              تفاصيل التقييم - {data.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              تاريخ: {new Date(assessment.createdAt).toLocaleDateString('ar-SA')} | النتيجة: {assessment.overallScore}%
              {!assessment.isActive && <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">مؤرشف</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canManage && assessment.isActive && (
              <button 
                onClick={handleArchive}
                disabled={isArchiving}
                className="flex items-center gap-2 rounded-lg bg-red-50 text-red-600 px-3 py-1.5 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isArchiving ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
                أرشفة التقييم
              </button>
            )}
            <button 
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-8 bg-gray-50/50">
          {data.chapters.map((chapter) => (
            <div key={chapter.code} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-gray-200 p-4">
                <h3 className="font-bold text-nebras-ink text-lg">{chapter.title}</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {chapter.items.map((item) => {
                  const answer = answersMap.get(item.code);
                  if (!answer) return null; // Don't show unanswered items? Or show as unassessed. We'll show if it's in the list.

                  return (
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
                        
                        <div className="w-full lg:w-auto shrink-0 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                          {getStatusIcon(answer.status)}
                          <span className="font-bold text-gray-700 text-sm">{getStatusText(answer.status)}</span>
                        </div>
                      </div>
                      
                      {answer.notes && (
                        <div className="mt-4 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700">
                          <strong>ملاحظات:</strong> {answer.notes}
                        </div>
                      )}
                    </div>
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
