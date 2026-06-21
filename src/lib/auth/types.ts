export const ROLES = ["super_admin", "company_admin", "supervisor", "sales_user"] as const;
export type AppRole = (typeof ROLES)[number];

export interface AuthContext {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  companyId: string | null;
  activeCompanyId: string | null;
  companyName: string;
  status: "active" | "inactive" | "pending";
}
