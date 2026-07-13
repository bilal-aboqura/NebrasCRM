import { ARABIC_AMB_TEXT_BY_CODE } from "@/lib/data/cbahi-arabic.generated";
import { ARABIC_DENTAL_TEXT_BY_CODE } from "@/lib/data/cbahi-dental-arabic.generated";
import type { AssessmentDataSet, Chapter, FacilityTypeConfig } from "@/lib/data/cbahi-data";

export type AssessmentLanguage = "ar" | "en";

const ARABIC_AMB_CHAPTER_TITLES: Record<string, string> = {
  LD: "قيادة المنظمة", PC: "تقديم الرعاية", LB: "خدمات المختبر", RD: "خدمات الأشعة", DN: "خدمات طب الأسنان",
  MM: "إدارة الدواء", MOI: "إدارة المعلومات", IPC: "الوقاية من العدوى ومكافحتها", FMS: "إدارة المنشأة والسلامة",
  DPU: "وحدة إجراءات اليوم الواحد", DA: "الأمراض الجلدية والطب التجميلي",
};

function localizeChapter(chapter: Chapter, translations: Record<string, string>): Chapter {
  const standards = chapter.standards.map((standard) => {
    const title = translations[standard.code] ?? standard.title;
    const items = standard.items.map((item) => ({ ...item, question: translations[item.code] ?? item.question, standardTitle: title }));
    return { ...standard, title, items };
  });
  return { ...chapter, title: ARABIC_AMB_CHAPTER_TITLES[chapter.code] ?? chapter.title, standards, items: standards.flatMap((standard) => standard.items) };
}

function localizeGeneralConfig(config: FacilityTypeConfig): FacilityTypeConfig {
  return { ...config, title: "تقييم معايير سباهي للمستوصفات", description: "تقييم ذاتي مبني على معايير سباهي للمراكز الطبية الخارجية.", chapters: config.chapters.map((chapter) => ({ ...localizeChapter(chapter, ARABIC_AMB_TEXT_BY_CODE), title: ARABIC_AMB_CHAPTER_TITLES[chapter.code] ?? chapter.title })) };
}

function localizeDentalConfig(config: FacilityTypeConfig): FacilityTypeConfig {
  return {
    ...config,
    title: "تقييم معايير سباهي لمنشآت الأسنان",
    description: "ترجمة تشغيلية غير رسمية لمعايير منشآت الأسنان، ويُرجع للدليل الرسمي عند توفره.",
    chapters: config.chapters.map((chapter) => ({ ...localizeChapter(chapter, ARABIC_DENTAL_TEXT_BY_CODE), title: ARABIC_DENTAL_TEXT_BY_CODE[chapter.code] ?? chapter.title })),
  };
}

/** Display-only localization; answer codes stay stable across languages. */
export function localizeAssessmentData(data: AssessmentDataSet, language: AssessmentLanguage): AssessmentDataSet {
  return language === "en" ? data : { ...data, general: localizeGeneralConfig(data.general), dental: localizeDentalConfig(data.dental) };
}
