import type { AuthContext } from "./types";

export class TenantAccessError extends Error {
  readonly status = 403;
  constructor() { super("غير مصرح لك بالوصول إلى بيانات هذه الشركة."); }
}

export function effectiveCompanyId(context: Pick<AuthContext, "role" | "companyId" | "activeCompanyId">) {
  const companyId = context.role === "super_admin" ? context.activeCompanyId : context.companyId;
  if (!companyId) throw new TenantAccessError();
  return companyId;
}

export function assertTenantAccess(context: Pick<AuthContext, "role" | "companyId" | "activeCompanyId">, requestedCompanyId: string) {
  if (effectiveCompanyId(context) !== requestedCompanyId) throw new TenantAccessError();
  return requestedCompanyId;
}

export function scopeToTenant<T extends { company_id: string }>(context: Pick<AuthContext, "role" | "companyId" | "activeCompanyId">, records: readonly T[]) {
  const companyId = effectiveCompanyId(context);
  return records.filter((record) => record.company_id === companyId);
}

