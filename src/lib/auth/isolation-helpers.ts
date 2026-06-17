import type { Facility, Role } from "@/lib/types/domain";
import { canManageCompanyWide } from "@/lib/auth/context";

export function scopeByCompany<T extends { companyId: string }>(rows: T[], companyId: string, role: Role) {
  return role === "super_admin" ? rows : rows.filter((row) => row.companyId === companyId);
}

export function scopeFacilitiesForUser(rows: Facility[], companyId: string, role: Role, userId: string) {
  const companyRows = scopeByCompany(rows, companyId, role);
  if (canManageCompanyWide(role)) return companyRows;
  return companyRows.filter((facility) => facility.ownerId === userId);
}

export function requireTenantMatch(rowCompanyId: string, activeCompanyId: string, role: Role) {
  if (role !== "super_admin" && rowCompanyId !== activeCompanyId) {
    throw new Error("403 Forbidden: cross-tenant access denied");
  }
}
