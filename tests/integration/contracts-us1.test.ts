import { describe, expect, it } from "vitest";
import { createContract } from "@/lib/actions/contracts";

describe("contract drafts", () => {
  it("creates draft contracts with generated references", async () => {
    const contract = await createContract({ facilityId: "fac-1", title: "Contract Test", value: 1000 });
    expect(contract.referenceNumber).toMatch(/^CON-/);
    expect(contract.status).toBe("draft");
  });
});
