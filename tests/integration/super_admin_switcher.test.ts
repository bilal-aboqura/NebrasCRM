import { describe, expect, it } from "vitest";
import { effectiveCompanyId, scopeToTenant } from "@/lib/auth/isolation-helpers";

describe("super admin active company", () => {
  it("uses the validated active-company override", () => {
    const context = { role: "super_admin" as const, companyId: null, activeCompanyId: "b" };
    expect(effectiveCompanyId(context)).toBe("b");
    expect(scopeToTenant(context, [{ company_id: "a" }, { company_id: "b" }])).toEqual([{ company_id: "b" }]);
  });
  it("does not permit an unscoped super admin query", () => {
    expect(() => effectiveCompanyId({ role: "super_admin", companyId: null, activeCompanyId: null })).toThrow();
  });
});

