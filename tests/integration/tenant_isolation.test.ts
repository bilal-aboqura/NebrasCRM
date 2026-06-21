import { describe, expect, it } from "vitest";
import { assertTenantAccess, scopeToTenant, TenantAccessError } from "@/lib/auth/isolation-helpers";

const tenantA = { role: "company_admin" as const, companyId: "a", activeCompanyId: "a" };

describe("tenant isolation", () => {
  it("filters records to the authenticated company", () => {
    expect(scopeToTenant(tenantA, [{ company_id: "a", id: 1 }, { company_id: "b", id: 2 }])).toEqual([{ company_id: "a", id: 1 }]);
  });
  it("rejects a direct cross-tenant identifier with 403 semantics", () => {
    expect(() => assertTenantAccess(tenantA, "b")).toThrow(TenantAccessError);
    try { assertTenantAccess(tenantA, "b"); } catch (error) { expect((error as TenantAccessError).status).toBe(403); }
  });
});

