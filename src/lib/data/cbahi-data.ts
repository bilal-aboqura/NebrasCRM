export interface AssessmentItem {
  code: string;
  question: string;
  suggestedEvidence: string;
}

export interface Chapter {
  code: string;
  title: string;
  items: AssessmentItem[];
}

export interface FacilityTypeConfig {
  id: "general" | "dental";
  title: string;
  description: string;
  chapters: Chapter[];
}

// Generating representative data for General Medical Complexes (33 items across 11 chapters)
const generalChapters: Chapter[] = Array.from({ length: 11 }, (_, i) => ({
  code: `CH-${i + 1}`,
  title: `الفصل ${i + 1}`,
  items: Array.from({ length: 3 }, (_, j) => ({
    code: `CH-${i + 1}-0${j + 1}`,
    question: `هل يتوفر المعيار رقم ${j + 1} في الفصل ${i + 1}؟`,
    suggestedEvidence: "وثيقة سياسات وإجراءات معتمدة",
  })),
}));

// Generating representative data for Dental Centers (23 items across 6 chapters)
const dentalChapters: Chapter[] = Array.from({ length: 6 }, (_, i) => {
  const itemCount = i === 5 ? 3 : 4; // 5*4 + 3 = 23
  return {
    code: `DEN-${i + 1}`,
    title: `فصل الأسنان ${i + 1}`,
    items: Array.from({ length: itemCount }, (_, j) => ({
      code: `DEN-${i + 1}-0${j + 1}`,
      question: `هل يتوفر المعيار رقم ${j + 1} في فصل الأسنان ${i + 1}؟`,
      suggestedEvidence: "سجل صيانة الأجهزة",
    })),
  };
});

export const CBAHI_DATA: Record<"general" | "dental", FacilityTypeConfig> = {
  general: {
    id: "general",
    title: "المجمعات الطبية العامة",
    description: "أداة التقييم الذاتي لمتطلبات المركز السعودي لاعتماد المنشآت الصحية (سباهي) للمجمعات الطبية العامة.",
    chapters: generalChapters,
  },
  dental: {
    id: "dental",
    title: "مجمعات وعيادات طب الأسنان",
    description: "أداة التقييم الذاتي لمتطلبات المركز السعودي لاعتماد المنشآت الصحية (سباهي) لمجمعات وعيادات طب الأسنان.",
    chapters: dentalChapters,
  },
};
