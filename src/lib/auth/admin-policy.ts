import type { AppRole, AuthContext } from "./types";

export const MANAGED_ROLES: readonly AppRole[] = ["company_admin", "supervisor", "sales_user"];

export function resolveInvitationScope(context: Pick<AuthContext, "role" | "companyId">, requestedCompanyId: string | null, requestedRole: AppRole) {
  if (context.role === "super_admin") {
    if (requestedRole !== "super_admin" && !requestedCompanyId) throw new Error("يجب اختيار شركة للمستخدم.");
    return requestedRole === "super_admin" ? null : requestedCompanyId;
  }
  if (context.role !== "company_admin" || !context.companyId) throw new Error("غير مصرح لك بإدارة المستخدمين.");
  if (!MANAGED_ROLES.includes(requestedRole)) throw new Error("غير مصرح لك بتعيين هذا الدور.");
  return context.companyId;
}

export function assertCanManageUser(context: Pick<AuthContext, "userId" | "role" | "companyId">, target: { id: string; role: AppRole; company_id: string | null }) {
  if (context.userId === target.id) throw new Error("لا يمكنك إلغاء تفعيل حسابك.");
  if (context.role === "super_admin") return;
  if (context.role !== "company_admin" || target.company_id !== context.companyId || target.role === "super_admin") {
    throw new Error("غير مصرح لك بإدارة هذا المستخدم.");
  }
}

