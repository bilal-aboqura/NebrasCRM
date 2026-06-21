import { describe, expect, it } from "vitest";
import { canAccessPath } from "@/lib/auth/rbac-guards";

describe("session route lifecycle", () => {
  it("never treats unknown paths as authorized", () => expect(canAccessPath("super_admin", "/unknown-sensitive-route")).toBe(false));
  it("keeps access-denied outside role grants", () => expect(canAccessPath("sales_user", "/access-denied")).toBe(false));
});

