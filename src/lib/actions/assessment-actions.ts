"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthContext } from "@/lib/auth/types";
import type {
  Assessment,
  AssessmentAnswer,
  FacilityTypeAssessed,
  ReadinessTier,
} from "@/lib/types/assessment";

export interface SaveAssessmentInput {
  facilityId: string;
  facilityTypeAssessed: FacilityTypeAssessed;
  answers: AssessmentAnswer[];
}

type AssessmentRow = {
  id: string;
  company_id: string;
  facility_id: string;
  assessed_by: string;
  facility_type_assessed: FacilityTypeAssessed;
  overall_score: number;
  readiness_tier: ReadinessTier;
  answers: AssessmentAnswer[];
  is_active: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
};

const MANAGEMENT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);
const ANSWER_STATUSES = new Set(["Met", "Partially Met", "Not Met", "Not Applicable"]);

function activeCompany(context: AuthContext) {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("No active company is selected.");
  return companyId;
}

function toAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    companyId: row.company_id,
    facilityId: row.facility_id,
    assessedBy: row.assessed_by,
    facilityTypeAssessed: row.facility_type_assessed,
    overallScore: row.overall_score,
    readinessTier: row.readiness_tier,
    answers: row.answers,
    isActive: row.is_active,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by,
    createdAt: row.created_at,
  };
}

function scoreAnswers(answers: AssessmentAnswer[]) {
  const applicable = answers.filter((answer) => answer.status !== "Not Applicable");
  const points = applicable.reduce((total, answer) => {
    if (answer.status === "Met") return total + 1;
    if (answer.status === "Partially Met") return total + 0.5;
    return total;
  }, 0);
  const score = applicable.length ? Math.round((points / applicable.length) * 100) : 0;
  const tier: ReadinessTier = score >= 85 ? "high" : score >= 65 ? "medium" : "low";
  return { score, tier };
}

function validateInput(input: SaveAssessmentInput) {
  if (!input.facilityId) throw new Error("A facility is required.");
  if (input.facilityTypeAssessed !== "general" && input.facilityTypeAssessed !== "dental") {
    throw new Error("Invalid assessment facility type.");
  }
  if (!Array.isArray(input.answers)) throw new Error("Invalid assessment answers.");
  const codes = new Set<string>();
  for (const answer of input.answers) {
    if (!answer.item_code?.trim() || !ANSWER_STATUSES.has(answer.status) || codes.has(answer.item_code)) {
      throw new Error("Invalid assessment answers.");
    }
    codes.add(answer.item_code);
  }
}

async function authorizedFacility(context: AuthContext, facilityId: string, requireActive = false) {
  const companyId = activeCompany(context);
  let query = createAdminClient()
    .from("facilities")
    .select("id,company_id,assigned_to,is_active")
    .eq("id", facilityId)
    .eq("company_id", companyId);
  if (context.role === "sales_user") query = query.eq("assigned_to", context.userId);
  if (requireActive) query = query.eq("is_active", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Unauthorized: You do not have permission to assess this facility.");
  return data;
}

async function contextOrThrow() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  return context;
}

function failure(error: unknown) {
  return { success: false as const, error: error instanceof Error ? error.message : "Assessment operation failed." };
}

export async function saveAssessment(input: SaveAssessmentInput) {
  try {
    validateInput(input);
    const context = await contextOrThrow();
    const companyId = activeCompany(context);
    await authorizedFacility(context, input.facilityId, true);
    const { score, tier } = scoreAnswers(input.answers);
    const admin = createAdminClient();
    const { data, error } = await admin.from("assessments").insert({
      company_id: companyId,
      facility_id: input.facilityId,
      assessed_by: context.userId,
      facility_type_assessed: input.facilityTypeAssessed,
      overall_score: score,
      readiness_tier: tier,
      answers: input.answers,
    }).select("*").single();
    if (error) throw error;

    const { error: activityError } = await admin.from("facility_activity").insert({
      company_id: companyId,
      facility_id: input.facilityId,
      actor_id: context.userId,
      event_type: "assessment_saved",
      new_value: `${score}% | ${tier} | ${context.fullName}`,
    });
    if (activityError) throw activityError;
    revalidatePath(`/dashboard/facilities/${input.facilityId}`);
    return { success: true as const, assessment: toAssessment(data as AssessmentRow) };
  } catch (error) {
    return failure(error);
  }
}

export async function getFacilityAssessments(facilityId: string, includeArchived = false) {
  const context = await contextOrThrow();
  const companyId = activeCompany(context);
  await authorizedFacility(context, facilityId);
  let query = createAdminClient().from("assessments").select("*")
    .eq("company_id", companyId).eq("facility_id", facilityId);
  if (!includeArchived) query = query.eq("is_active", true);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  const assessments = ((data ?? []) as AssessmentRow[]).map(toAssessment);
  return assessments.map((assessment, index) => {
    const previousScore = assessments[index + 1]?.overallScore;
    return previousScore === undefined
      ? assessment
      : { ...assessment, previousScore, delta: assessment.overallScore - previousScore };
  });
}

async function setAssessmentActive(assessmentId: string, active: boolean) {
  try {
    const context = await contextOrThrow();
    if (!MANAGEMENT_ROLES.has(context.role)) {
      throw new Error("Unauthorized: Only supervisors or admins can manage archived assessments.");
    }
    const companyId = activeCompany(context);
    const admin = createAdminClient();
    const { data, error } = await admin.from("assessments").update({
      is_active: active,
      archived_at: active ? null : new Date().toISOString(),
      archived_by: active ? null : context.userId,
    }).eq("id", assessmentId).eq("company_id", companyId).eq("is_active", !active)
      .select("facility_id,overall_score").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Assessment not found.");
    await authorizedFacility(context, data.facility_id);
    const { error: activityError } = await admin.from("facility_activity").insert({
      company_id: companyId,
      facility_id: data.facility_id,
      actor_id: context.userId,
      event_type: active ? "assessment_recovered" : "assessment_archived",
      new_value: `${data.overall_score}%`,
    });
    if (activityError) throw activityError;
    revalidatePath(`/dashboard/facilities/${data.facility_id}`);
    return { success: true as const };
  } catch (error) {
    return failure(error);
  }
}

export async function archiveAssessment(assessmentId: string) {
  return setAssessmentActive(assessmentId, false);
}

export async function recoverAssessment(assessmentId: string) {
  return setAssessmentActive(assessmentId, true);
}

export async function canManageAssessments() {
  const context = await getAuthContext();
  return !!context && MANAGEMENT_ROLES.has(context.role);
}
