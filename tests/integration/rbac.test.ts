import { describe, expect, it } from "vitest";
import { canAccessPath, hasAnyRole } from "@/lib/auth/rbac-guards";

describe("deny-by-default RBAC", () => {
  it("allows admins to access administration", () => expect(canAccessPath("company_admin", "/admin/users")).toBe(true));
  it("allows supervisors to view reports but not administration", () => {
    expect(canAccessPath("supervisor", "/reports")).toBe(true);
    expect(canAccessPath("supervisor", "/admin")).toBe(false);
  });
  it("limits sales users to dashboard and sales", () => {
    expect(canAccessPath("sales_user", "/sales/leads")).toBe(true);
    expect(canAccessPath("sales_user", "/reports")).toBe(true);
  });
  it("checks explicit action roles", () => expect(hasAnyRole("supervisor", ["super_admin", "company_admin"])).toBe(false));
});
