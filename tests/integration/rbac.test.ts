import { describe, expect, it } from "vitest";
import { canManageFacility } from "@/lib/auth/rbac-guards";
import { facilities } from "@/lib/data/mock";

describe("rbac guards", () => {
  it("allows managers company-wide and sales users only on owned facilities", () => {
    expect(canManageFacility("supervisor", "someone", facilities[0])).toBe(true);
    expect(canManageFacility("sales_user", "u-sales-a", facilities[0])).toBe(true);
    expect(canManageFacility("sales_user", "u-sales-b", facilities[0])).toBe(false);
  });
});
