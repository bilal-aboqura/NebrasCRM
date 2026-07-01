import {
  MASTER_AMB_CHAPTER_CODES,
  MASTER_AMB_ITEM_CODES,
  normalizeAssessmentVisibilitySettings,
  resolveAssessmentData,
  type AssessmentDataSet,
  type AssessmentVisibilitySettings,
} from "@/lib/data/cbahi-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const ASSESSMENT_VISIBILITY_SETTINGS_KEY = "assessment_visibility_settings";

function filterKnownCodes(codes: readonly string[], known: readonly string[]) {
  const allowed = new Set(known);
  return Array.from(new Set(codes.filter((code) => allowed.has(code))));
}

export function sanitizeAssessmentVisibilitySettings(
  value?: Partial<AssessmentVisibilitySettings> | null,
): AssessmentVisibilitySettings {
  const normalized = normalizeAssessmentVisibilitySettings(value);
  return {
    general: {
      disabledChapterCodes: filterKnownCodes(normalized.general.disabledChapterCodes, MASTER_AMB_CHAPTER_CODES),
      disabledItemCodes: filterKnownCodes(normalized.general.disabledItemCodes, MASTER_AMB_ITEM_CODES),
    },
    dental: {
      disabledChapterCodes: filterKnownCodes(normalized.dental.disabledChapterCodes, MASTER_AMB_CHAPTER_CODES),
      disabledItemCodes: filterKnownCodes(normalized.dental.disabledItemCodes, MASTER_AMB_ITEM_CODES),
    },
  };
}

export async function loadAssessmentVisibilitySettings(): Promise<AssessmentVisibilitySettings> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("system_settings")
    .select("value")
    .eq("key", ASSESSMENT_VISIBILITY_SETTINGS_KEY)
    .maybeSingle();
  if (error) throw error;
  if (!data?.value) return sanitizeAssessmentVisibilitySettings();

  try {
    return sanitizeAssessmentVisibilitySettings(JSON.parse(String(data.value)) as Partial<AssessmentVisibilitySettings>);
  } catch {
    return sanitizeAssessmentVisibilitySettings();
  }
}

export async function loadPublishedAssessmentData(): Promise<AssessmentDataSet> {
  return resolveAssessmentData(await loadAssessmentVisibilitySettings());
}
