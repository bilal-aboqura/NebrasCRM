import { ARABIC_AMB_TEXT_BY_CODE } from "@/lib/data/cbahi-arabic.generated";
import type { AssessmentDataSet, Chapter, FacilityTypeConfig } from "@/lib/data/cbahi-data";

export type AssessmentLanguage = "ar" | "en";

const ARABIC_AMB_CHAPTER_TITLES: Record<string, string> = {
  LD: "قيادة المنظمة", PC: "تقديم الرعاية", LB: "خدمات المختبر", RD: "خدمات الأشعة", DN: "خدمات طب الأسنان",
  MM: "إدارة الدواء", MOI: "إدارة المعلومات", IPC: "الوقاية من العدوى ومكافحتها", FMS: "إدارة المنشأة والسلامة",
  DPU: "وحدة إجراءات اليوم الواحد", DA: "الأمراض الجلدية والطب التجميلي",
};

function localizeGeneralChapter(chapter: Chapter): Chapter {
  const standards = chapter.standards.map((standard) => {
    const title = ARABIC_AMB_TEXT_BY_CODE[standard.code] ?? standard.title;
    const items = standard.items.map((item) => ({ ...item, question: ARABIC_AMB_TEXT_BY_CODE[item.code] ?? item.question, standardTitle: title }));
    return { ...standard, title, items };
  });
  return { ...chapter, title: ARABIC_AMB_CHAPTER_TITLES[chapter.code] ?? chapter.title, standards, items: standards.flatMap((standard) => standard.items) };
}

function localizeGeneralConfig(config: FacilityTypeConfig): FacilityTypeConfig {
  return { ...config, title: "تقييم معايير سباهي للمستوصفات", description: "تقييم ذاتي مبني على معايير سباهي للمراكز الطبية الخارجية.", chapters: config.chapters.map(localizeGeneralChapter) };
}

/** Display-only localization; answer codes stay stable across languages. */
export function localizeAssessmentData(data: AssessmentDataSet, language: AssessmentLanguage): AssessmentDataSet {
  return language === "en" ? data : { ...data, general: localizeGeneralConfig(data.general) };
}
