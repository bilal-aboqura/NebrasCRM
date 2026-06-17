import { cookies } from "next/headers";
import { companies, profiles } from "@/lib/data/mock";
import type { Company, Profile, Role } from "@/lib/types/domain";

export interface AuthContext {
  user: Profile;
  activeCompany: Company;
  role: Role;
}

export const MANAGEMENT_ROLES: Role[] = ["super_admin", "company_admin", "supervisor"];

export function isManagementRole(role: Role) {
  return MANAGEMENT_ROLES.includes(role);
}

export function canAccessAdmin(role: Role) {
  return role === "super_admin" || role === "company_admin";
}

export function canManageCompanyWide(role: Role) {
  return role === "super_admin" || role === "company_admin" || role === "supervisor";
}

export async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = cookies();
  const userId = cookieStore.get("nebras_user")?.value ?? "u-super";
  const activeCompanyId = cookieStore.get("nebras_active_company")?.value;
  const user = profiles.find((profile) => profile.id === userId) ?? profiles[0];
  const companyId = activeCompanyId ?? user.companyId ?? companies[0].id;
  const activeCompany = companies.find((company) => company.id === companyId) ?? companies[0];

  return { user, activeCompany, role: user.role };
}

export async function getUserRole() {
  return (await getAuthContext()).role;
}

export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    throw new Error("403 Forbidden: role is not authorized for this action");
  }
}
