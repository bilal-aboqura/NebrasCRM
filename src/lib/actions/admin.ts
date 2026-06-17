import { getAuthContext } from "@/lib/auth/context";
import { assertAllowed } from "@/lib/auth/rbac-guards";
import { addActivity, db, nextId } from "@/lib/data/store";
import type { CompanyStatus, Role, UserStatus } from "@/lib/types/domain";

interface CompanyInput {
  name: string;
  city: string;
  status?: CompanyStatus;
}

interface InviteInput {
  email: string;
  displayName: string;
  role: Role;
  companyId?: string;
}

export async function createCompany(input: CompanyInput) {
  const { role } = await getAuthContext();
  assertAllowed(role, ["super_admin"]);
  const company = { id: nextId("company", db.companies), name: input.name, city: input.city, status: input.status ?? "active" };
  db.companies.push(company);
  return company;
}

export async function updateCompany(id: string, input: Partial<CompanyInput>) {
  const { role } = await getAuthContext();
  assertAllowed(role, ["super_admin"]);
  const company = db.companies.find((item) => item.id === id);
  if (!company) throw new Error("Company not found");
  Object.assign(company, input);
  return company;
}

export async function inviteUser(input: InviteInput) {
  const { role, activeCompany } = await getAuthContext();
  assertAllowed(role, ["super_admin", "company_admin"]);
  const companyId = role === "super_admin" ? input.companyId ?? activeCompany.id : activeCompany.id;
  const user = {
    id: nextId("u", db.profiles),
    companyId,
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    status: "invited" as UserStatus
  };
  db.profiles.push(user);
  return { user, invitationToken: `${user.id}.local-token` };
}

export async function toggleUserStatus(id: string, status: UserStatus) {
  const context = await getAuthContext();
  assertAllowed(context.role, ["super_admin", "company_admin"]);
  const user = db.profiles.find((item) => item.id === id);
  if (!user) throw new Error("User not found");
  if (context.role !== "super_admin" && user.companyId !== context.activeCompany.id) throw new Error("403 Forbidden");
  if (user.id === context.user.id && status !== "active") throw new Error("Cannot deactivate your own active session");
  user.status = status;
  return user;
}

export async function completeInvitation(token: string, password: string) {
  if (password.length < 8) throw new Error("Password must contain at least 8 characters");
  const userId = token.split(".")[0];
  const user = db.profiles.find((item) => item.id === userId);
  if (!user || user.status !== "invited") throw new Error("Invalid invitation");
  user.status = "active";
  return user;
}

export async function revokeSessionsForUser(userId: string) {
  const { role } = await getAuthContext();
  assertAllowed(role, ["super_admin", "company_admin"]);
  return { ok: true, userId };
}

export function auditAdminChange(companyId: string, facilityId: string, message: string) {
  return addActivity({ companyId, facilityId, kind: "admin_change", message });
}
