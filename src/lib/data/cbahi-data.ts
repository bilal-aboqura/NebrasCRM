import { MASTER_AMB_CHAPTER_DEFINITIONS } from "@/lib/data/cbahi-data.generated";
import { MASTER_DENTAL_CHAPTER_DEFINITIONS } from "@/lib/data/cbahi-dental-data.generated";

export type AssessmentFacilityType = "general" | "dental";

export interface AssessmentItem {
  code: string;
  question: string;
  suggestedEvidence: string;
  standardCode: string;
  standardTitle: string;
}

export interface AssessmentStandard {
  code: string;
  title: string;
  items: AssessmentItem[];
}

export interface Chapter {
  code: string;
  title: string;
  standards: AssessmentStandard[];
  items: AssessmentItem[];
}

export interface FacilityTypeConfig {
  id: AssessmentFacilityType;
  title: string;
  description: string;
  chapters: Chapter[];
}

export type AssessmentVisibilityRule = {
  disabledChapterCodes: string[];
  disabledItemCodes: string[];
};

export type AssessmentVisibilitySettings = Record<AssessmentFacilityType, AssessmentVisibilityRule>;
export type AssessmentDataSet = Record<AssessmentFacilityType, FacilityTypeConfig>;

type AssessmentItemDefinition = Omit<AssessmentItem, "standardCode" | "standardTitle">;
type ChapterDefinition = {
  code: string;
  title: string;
  standards: Array<{
    code: string;
    title: string;
    items: AssessmentItemDefinition[];
  }>;
};

function flattenStandardItems(standards: AssessmentStandard[]) {
  return standards.flatMap((standard) => standard.items);
}

function hydrateChapter(definition: ChapterDefinition): Chapter {
  const standards = definition.standards.map((standard) => ({
    code: standard.code,
    title: standard.title,
    items: standard.items.map((item) => ({
      ...item,
      standardCode: standard.code,
      standardTitle: standard.title,
    })),
  }));

  return {
    code: definition.code,
    title: definition.title,
    standards,
    items: flattenStandardItems(standards),
  };
}

export const GENERAL_AMB_CHAPTERS: Chapter[] = (
  MASTER_AMB_CHAPTER_DEFINITIONS as unknown as ChapterDefinition[]
).map(hydrateChapter);

export const DENTAL_CHAPTERS: Chapter[] = (
  MASTER_DENTAL_CHAPTER_DEFINITIONS as unknown as ChapterDefinition[]
).map(hydrateChapter);

export const ASSESSMENT_MASTER_CHAPTERS: Record<AssessmentFacilityType, Chapter[]> = {
  general: GENERAL_AMB_CHAPTERS,
  dental: DENTAL_CHAPTERS,
};

export const ASSESSMENT_MASTER_CHAPTER_CODES: Record<AssessmentFacilityType, string[]> = {
  general: GENERAL_AMB_CHAPTERS.map((chapter) => chapter.code),
  dental: DENTAL_CHAPTERS.map((chapter) => chapter.code),
};

export const ASSESSMENT_MASTER_ITEM_CODES: Record<AssessmentFacilityType, string[]> = {
  general: GENERAL_AMB_CHAPTERS.flatMap((chapter) => chapter.items.map((item) => item.code)),
  dental: DENTAL_CHAPTERS.flatMap((chapter) => chapter.items.map((item) => item.code)),
};

export const MASTER_AMB_CHAPTERS = GENERAL_AMB_CHAPTERS;
export const MASTER_AMB_CHAPTER_CODES = ASSESSMENT_MASTER_CHAPTER_CODES.general;
export const MASTER_AMB_ITEM_CODES = ASSESSMENT_MASTER_ITEM_CODES.general;

export const DEFAULT_ASSESSMENT_VISIBILITY: AssessmentVisibilitySettings = {
  general: {
    disabledChapterCodes: [],
    disabledItemCodes: [],
  },
  dental: {
    disabledChapterCodes: [],
    disabledItemCodes: [],
  },
};

function dedupe(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeRule(rule: Partial<AssessmentVisibilityRule> | null | undefined): AssessmentVisibilityRule {
  return {
    disabledChapterCodes: dedupe(rule?.disabledChapterCodes ?? []),
    disabledItemCodes: dedupe(rule?.disabledItemCodes ?? []),
  };
}

export function normalizeAssessmentVisibilitySettings(
  value?: Partial<Record<AssessmentFacilityType, Partial<AssessmentVisibilityRule>>> | null,
): AssessmentVisibilitySettings {
  return {
    general: normalizeRule({ ...DEFAULT_ASSESSMENT_VISIBILITY.general, ...value?.general }),
    dental: normalizeRule({ ...DEFAULT_ASSESSMENT_VISIBILITY.dental, ...value?.dental }),
  };
}

function resolveChapters(chapters: Chapter[], rule: AssessmentVisibilityRule) {
  const disabledChapters = new Set(rule.disabledChapterCodes);
  const disabledItems = new Set(rule.disabledItemCodes);

  return chapters
    .filter((chapter) => !disabledChapters.has(chapter.code))
    .map((chapter) => {
      const standards = chapter.standards
        .map((standard) => ({
          ...standard,
          items: standard.items.filter((item) => !disabledItems.has(item.code)),
        }))
        .filter((standard) => standard.items.length > 0);

      return {
        ...chapter,
        standards,
        items: flattenStandardItems(standards),
      };
    })
    .filter((chapter) => chapter.items.length > 0);
}

export function resolveAssessmentData(
  settings?: Partial<Record<AssessmentFacilityType, Partial<AssessmentVisibilityRule>>> | null,
): AssessmentDataSet {
  const normalized = normalizeAssessmentVisibilitySettings(settings);
  return {
    general: {
      id: "general",
      title: "Ambulatory Medical Standards Assessment",
      description: "Full assessment built from the CBAHI AMB standards book for ambulatory medical centers.",
      chapters: resolveChapters(GENERAL_AMB_CHAPTERS, normalized.general),
    },
    dental: {
      id: "dental",
      title: "Dental Standards Assessment",
      description: "Full assessment built from the CBAHI dental standards book for dental centers.",
      chapters: resolveChapters(DENTAL_CHAPTERS, normalized.dental),
    },
  };
}

export const CBAHI_DATA: AssessmentDataSet = resolveAssessmentData(DEFAULT_ASSESSMENT_VISIBILITY);
