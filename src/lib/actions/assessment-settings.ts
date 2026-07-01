"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth/context";
import type { AssessmentVisibilitySettings } from "@/lib/data/cbahi-data";
import {
  ASSESSMENT_VISIBILITY_SETTINGS_KEY,
  sanitizeAssessmentVisibilitySettings,
} from "@/lib/assessment/visibility";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveAssessmentVisibilitySettings(input: AssessmentVisibilitySettings) {
  const context = await getAuthContext();
  if (!context || (context.role !== "super_admin" && context.role !== "company_admin")) {
    return { success: false as const, error: "غير مصرح لك بإدارة إعدادات تقييم سباهي." };
  }

  try {
    const settings = sanitizeAssessmentVisibilitySettings(input);
    const admin = createAdminClient();
    const { error } = await admin.from("system_settings").upsert({
      key: ASSESSMENT_VISIBILITY_SETTINGS_KEY,
      value: JSON.stringify(settings),
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) throw error;

    revalidatePath("/assessment");
    revalidatePath("/admin/assessment-settings");
    revalidatePath("/");

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "تعذر حفظ إعدادات تقييم سباهي.",
    };
  }
}
