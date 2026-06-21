"use server";

import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { assertCanManageFacility } from "@/lib/auth/rbac-guards";
import { addActivity, db, nextId, nowIso } from "@/lib/data/store";
import { getFacilityDetail } from "@/lib/actions/facilities";
import type { Assessment, AssessmentAnswer, FacilityTypeAssessed, ReadinessTier } from "@/lib/types/assessment";

export interface SaveAssessmentInput {
  facilityId: string;
  facilityTypeAssessed: FacilityTypeAssessed;
  answers: AssessmentAnswer[];
}

// Support mock auth overriding for unit testing
export async function saveAssessment(input: SaveAssessmentInput, overrideAuth?: any) {
  try {
    let userContext;
    if (overrideAuth) {
      userContext = {
        user: { id: overrideAuth.userId },
        activeCompany: { id: overrideAuth.companyId },
        role: overrideAuth.role
      };
    } else {
      userContext = await getAuthContext();
    }

    // Tenant isolation: Ensure the facility belongs to the user's active company
    // Using mock db here directly for sync logic, or getFacilityDetail if using standard flow
    const facility = db.facilities.find(f => f.id === input.facilityId);
    
    if (!facility || facility.companyId !== userContext.activeCompany.id) {
      return { success: false, error: 'Unauthorized: You do not have permission to assess this facility.' };
    }

    // Role-based access control
    assertCanManageFacility(userContext.role, userContext.user.id, facility);

    // Dynamic score recalculation
    const applicableAnswers = input.answers.filter(a => a.status !== 'Not Applicable');
    let points = 0;
    
    applicableAnswers.forEach(answer => {
      if (answer.status === 'Met') points += 1;
      else if (answer.status === 'Partially Met') points += 0.5;
    });

    const overall_score = applicableAnswers.length > 0 
      ? Math.round((points / applicableAnswers.length) * 100) 
      : 0;

    let readiness_tier: ReadinessTier = 'low';
    if (overall_score >= 80) readiness_tier = 'high';
    else if (overall_score >= 60) readiness_tier = 'medium';

    const assessment: Assessment = {
      id: nextId("asm", db.assessments),
      companyId: userContext.activeCompany.id,
      facilityId: input.facilityId,
      assessedBy: userContext.user.id,
      facilityTypeAssessed: input.facilityTypeAssessed,
      overallScore: overall_score,
      readinessTier: readiness_tier,
      answers: input.answers,
      isActive: true,
      archivedAt: null,
      archivedBy: null,
      createdAt: nowIso()
    };

    db.assessments.push(assessment);

    // Timeline activity logging
    addActivity({
      companyId: assessment.companyId,
      facilityId: assessment.facilityId,
      kind: "assessment_saved",
      message: `تم حفظ التقييم بنسبة ${overall_score}%`,
      actorId: userContext.user.id,
      newValue: assessment.id
    });

    return { success: true, assessment };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save assessment' };
  }
}

export async function getFacilityAssessments(facilityId: string, overrideAuth?: any, includeArchived: boolean = false) {
  let userContext;
  if (overrideAuth) {
    userContext = {
      user: { id: overrideAuth.userId },
      activeCompany: { id: overrideAuth.companyId },
      role: overrideAuth.role
    };
  } else {
    userContext = await getAuthContext();
  }

  // Ensure facility exists and belongs to active company
  const facility = db.facilities.find(f => f.id === facilityId);
  if (!facility || facility.companyId !== userContext.activeCompany.id) {
    throw new Error('Unauthorized');
  }

  assertCanManageFacility(userContext.role, userContext.user.id, facility);

  // Fetch assessments and sort newest first
  const assessments = db.assessments
    .filter(a => a.facilityId === facilityId && (includeArchived || a.isActive))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate progression deltas
  return assessments.map((assessment, index) => {
    let delta = undefined;
    let previousScore = undefined;
    
    // Compare with the immediately previous (older) assessment in time
    if (index < assessments.length - 1) {
      previousScore = assessments[index + 1].overallScore;
      delta = assessment.overallScore - previousScore;
    }

    return {
      ...assessment,
      previousScore,
      delta
    };
  });
}

export async function archiveAssessment(assessmentId: string, overrideAuth?: any) {
  let userContext;
  if (overrideAuth) {
    userContext = {
      user: { id: overrideAuth.userId },
      activeCompany: { id: overrideAuth.companyId },
      role: overrideAuth.role
    };
  } else {
    userContext = await getAuthContext();
  }

  // Check role: supervisor or admin
  if (userContext.role !== 'supervisor' && userContext.role !== 'company_admin' && userContext.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Only supervisors or admins can archive assessments.' };
  }

  const assessment = db.assessments.find(a => a.id === assessmentId);
  if (!assessment || assessment.companyId !== userContext.activeCompany.id) {
    return { success: false, error: 'Assessment not found.' };
  }

  assessment.isActive = false;
  assessment.archivedAt = nowIso();
  assessment.archivedBy = userContext.user.id;

  // Log timeline event
  addActivity({
    companyId: userContext.activeCompany.id,
    facilityId: assessment.facilityId,
    actorId: userContext.user.id,
    kind: 'system',
    eventType: 'assessment_archived',
    message: `تم أرشفة التقييم الذاتي (النتيجة: ${assessment.overallScore}%)`
  });

  return { success: true };
}

export async function recoverAssessment(assessmentId: string, overrideAuth?: any) {
  let userContext;
  if (overrideAuth) {
    userContext = {
      user: { id: overrideAuth.userId },
      activeCompany: { id: overrideAuth.companyId },
      role: overrideAuth.role
    };
  } else {
    userContext = await getAuthContext();
  }

  // Check role: supervisor or admin
  if (userContext.role !== 'supervisor' && userContext.role !== 'company_admin' && userContext.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Only supervisors or admins can recover assessments.' };
  }

  const assessment = db.assessments.find(a => a.id === assessmentId);
  if (!assessment || assessment.companyId !== userContext.activeCompany.id) {
    return { success: false, error: 'Assessment not found.' };
  }

  assessment.isActive = true;
  assessment.archivedAt = null;
  assessment.archivedBy = null;

  // Log timeline event
  addActivity({
    companyId: userContext.activeCompany.id,
    facilityId: assessment.facilityId,
    actorId: userContext.user.id,
    kind: 'system',
    eventType: 'assessment_recovered',
    message: `تم استعادة التقييم الذاتي (النتيجة: ${assessment.overallScore}%)`
  });

  return { success: true };
}

export async function canManageAssessments() {
  const userContext = await getAuthContext();
  return userContext.role === 'supervisor' || userContext.role === 'company_admin' || userContext.role === 'super_admin';
}
