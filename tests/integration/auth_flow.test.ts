import { describe, expect, it } from "vitest";
import { canAccessAdmin, canManageCompanyWide } from "@/lib/auth/context";

describe("auth and role helpers", () => {
  it("scopes admin surfaces by role", () => {
    expect(canAccessAdmin("super_admin")).toBe(true);
    expect(canAccessAdmin("sales_user")).toBe(false);
    expect(canManageCompanyWide("supervisor")).toBe(true);
  });
});
