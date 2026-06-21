import { createAdminClient } from "@/lib/supabase/admin";

type AuditInput = {
  actorUserId?: string | null;
  actorCompanyId?: string | null;
  eventType: "login" | "logout" | "failed_login" | "company_switch" | "company_create" | "company_update" | "user_invite" | "profile_update" | "unauthorized_admin_attempt";
  targetCompanyId?: string | null;
  sourceIp?: string | null;
  outcome: "success" | "failure" | "throttled";
  details?: Record<string, unknown>;
};

export async function writeAudit(input: AuditInput) {
  const { error } = await createAdminClient().from("audit_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    actor_company_id: input.actorCompanyId ?? null,
    event_type: input.eventType,
    target_company_id: input.targetCompanyId ?? null,
    source_ip: input.sourceIp ?? null,
    outcome: input.outcome,
    details: input.details ?? {},
  });
  if (error) console.error("Unable to write auth audit event", error.message);
}
