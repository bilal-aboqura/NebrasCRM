"use client";

import { Building2, Stethoscope } from "lucide-react";
import type { FacilityType } from "@/hooks/use-cbahi-session";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";

interface FacilitySelectorProps {
  currentType: FacilityType;
  onChange: (type: FacilityType) => void;
  hasAnswers: boolean;
}

export default function FacilityTypeSelector({ currentType, onChange, hasAnswers }: FacilitySelectorProps) {
  const handleSelect = (type: FacilityType) => {
    if (type === currentType) return;

    if (hasAnswers) {
      if (confirm("تغيير نوع المنشأة سيؤدي إلى مسح جميع الإجابات الحالية. هل أنت متأكد؟")) {
        onChange(type);
      }
    } else {
      onChange(type);
    }
  };

  const generalCount = CBAHI_DATA.general.chapters.reduce((s, ch) => s + ch.items.length, 0);
  const dentalCount = CBAHI_DATA.dental.chapters.reduce((s, ch) => s + ch.items.length, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row print:hidden">
      <button
        onClick={() => handleSelect("general")}
        className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 text-right transition-all ${
          currentType === "general"
            ? "border-nebras-green bg-green-50 text-nebras-green shadow-sm"
            : "border-gray-100 bg-white text-gray-500 hover:border-green-100 hover:bg-slate-50"
        }`}
      >
        <div className={`rounded-full p-2 ${currentType === "general" ? "bg-nebras-green text-white" : "bg-gray-100 text-gray-400"}`}>
          <Building2 size={24} />
        </div>
        <div>
          <h3 className={`font-bold ${currentType === "general" ? "text-nebras-green" : "text-gray-700"}`}>
            المجمعات الطبية العامة
          </h3>
          <p className="text-xs">{generalCount} معيار - {CBAHI_DATA.general.chapters.length} فصل</p>
        </div>
      </button>

      <button
        onClick={() => handleSelect("dental")}
        className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 text-right transition-all ${
          currentType === "dental"
            ? "border-nebras-green bg-green-50 text-nebras-green shadow-sm"
            : "border-gray-100 bg-white text-gray-500 hover:border-green-100 hover:bg-slate-50"
        }`}
      >
        <div className={`rounded-full p-2 ${currentType === "dental" ? "bg-nebras-green text-white" : "bg-gray-100 text-gray-400"}`}>
          <Stethoscope size={24} />
        </div>
        <div>
          <h3 className={`font-bold ${currentType === "dental" ? "text-nebras-green" : "text-gray-700"}`}>
            مجمعات وعيادات الأسنان
          </h3>
          <p className="text-xs">{dentalCount} معيار - {CBAHI_DATA.dental.chapters.length} فصول</p>
        </div>
      </button>
    </div>
  );
}
