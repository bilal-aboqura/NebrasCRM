import { redirect } from "next/navigation";
import type { AppRole, AuthContext } from "./types";

const ROLE_PATHS: Record<AppRole, readonly string[]> = {
  super_admin: ["/", "/admin", "/profile", "/reports", "/team", "/sales", "/dashboard/facilities", "/dashboard/pipeline", "/dashboard/followups", "/dashboard/offers", "/dashboard/contracts"],
  company_admin: ["/", "/admin/users", "/profile", "/reports", "/team", "/sales", "/dashboard/facilities", "/dashboard/pipeline", "/dashboard/followups", "/dashboard/offers", "/dashboard/contracts"],
  supervisor: ["/", "/admin/users", "/profile", "/reports", "/team", "/sales", "/dashboard/facilities", "/dashboard/pipeline", "/dashboard/followups", "/dashboard/offers", "/dashboard/contracts"],
  sales_user: ["/", "/profile", "/reports", "/sales", "/dashboard/facilities", "/dashboard/pipeline", "/dashboard/followups", "/dashboard/offers", "/dashboard/contracts"],
};

export function canAccessPath(role: AppRole, pathname: string) {
  return ROLE_PATHS[role].some((path) => path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`));
}

export function hasAnyRole(role: AppRole, allowed: readonly AppRole[]) {
  return allowed.includes(role);
}

export function requireRole(context: AuthContext, allowed: readonly AppRole[]) {
  if (!hasAnyRole(context.role, allowed)) redirect("/access-denied");
  return context;
}
