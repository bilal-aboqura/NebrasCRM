import { Suspense } from "react";
import AssessmentExperience from "@/components/assessment/AssessmentExperience";
import { loadPublishedAssessmentData } from "@/lib/assessment/visibility";
import { getAuthContext } from "@/lib/auth/context";

export default async function AssessmentPage() {
  const [assessmentData, context] = await Promise.all([
    loadPublishedAssessmentData(),
    getAuthContext(),
  ]);

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-nebras-cream font-bold text-nebras-green">جارٍ تحميل أداة التقييم...</div>}>
      <AssessmentExperience assessmentData={assessmentData} viewerRole={context?.role ?? null} />
    </Suspense>
  );
}
