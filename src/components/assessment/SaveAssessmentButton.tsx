"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import FacilitySelector from "@/components/assessment/FacilitySelector";
import { saveAssessment } from "@/lib/actions/assessment-actions";
import { useCbahisession } from "@/hooks/use-cbahi-session";

export default function SaveAssessmentButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state } = useCbahisession();

  // If there are no answers, we could disable the button
  const hasAnswers = Object.keys(state.answers).length > 0;

  const handleSave = async (facilityId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      // Map answers to the format expected by the action
      const mappedAnswers = Object.entries(state.answers).map(([item_code, val]) => {
        let status: any = "Not Applicable";
        if (val === "1") status = "Met";
        else if (val === "0.5") status = "Partially Met";
        else if (val === "0") status = "Not Met";

        return {
          item_code,
          status,
          notes: state.notes[item_code]
        };
      });

      const result = await saveAssessment({
        facilityId,
        facilityTypeAssessed: state.facilityType,
        answers: mappedAnswers
      });

      if (result.success) {
        setIsModalOpen(false);
        alert("تم حفظ التقييم بنجاح!");
      } else {
        setError(result.error || "حدث خطأ أثناء حفظ التقييم");
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={!hasAnswers}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-nebras-green py-3 font-bold text-white transition-colors hover:bg-[#208f60] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={20} />
        حفظ التقييم
      </button>

      <FacilitySelector
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSave}
        isSaving={isSaving}
        error={error}
      />
    </>
  );
}
