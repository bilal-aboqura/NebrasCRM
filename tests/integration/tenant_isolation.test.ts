import { describe, expect, it } from "vitest";
import { scopeFacilitiesForUser } from "@/lib/auth/isolation-helpers";
import { facilities } from "@/lib/data/mock";

describe("tenant isolation", () => {
  it("limits sales users to assigned facilities in their company", () => {
    const rows = scopeFacilitiesForUser(facilities, "company-a", "sales_user", "u-sales-a");
    expect(rows.every((facility) => facility.companyId === "company-a" && facility.ownerId === "u-sales-a")).toBe(true);
  });
});
