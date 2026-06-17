import { describe, expect, it } from "vitest";
import { getContracts } from "@/lib/actions/contracts";

describe("contract directory", () => {
  it("returns active tenant-scoped contracts", async () => {
    const rows = await getContracts();
    expect(rows.every((contract) => contract.companyId === "company-a")).toBe(true);
  });
});
