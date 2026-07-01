import { AssessmentSettingsEditor } from "@/components/admin/AssessmentSettingsEditor";
import { requireAuth } from "@/lib/auth/context";
import { requireRole } from "@/lib/auth/rbac-guards";
import { loadAssessmentVisibilitySettings } from "@/lib/assessment/visibility";

export default async function AssessmentSettingsPage() {
  requireRole(await requireAuth(), ["super_admin", "company_admin"]);
  const initialSettings = await loadAssessmentVisibilitySettings();

  return <AssessmentSettingsEditor initialSettings={initialSettings} />;
}
