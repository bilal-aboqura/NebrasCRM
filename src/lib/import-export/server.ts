import type { AuthContext } from "@/lib/auth/types";

export const IMPORT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);

export function activeCompanyId(context: AuthContext) {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

export function canImport(context: AuthContext) {
  return IMPORT_ROLES.has(context.role);
}

export function jsonError(error: string, status = 400) {
  return Response.json({ error }, { status });
}

