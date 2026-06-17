import { describe, expect, it } from "vitest";
import { activateContract, createContract, updateDraftContract, uploadContractDocument } from "@/lib/actions/contracts";

describe("contract activation", () => {
  it("requires document and blocks edits after activation", async () => {
    const contract = await createContract({ facilityId: "fac-1", title: "Activation Test", value: 1000 });
    await expect(activateContract(contract.id, { startDate: "2099-01-01", endDate: "2100-01-01" })).rejects.toThrow();
    const path = await uploadContractDocument(contract.id, { name: "contract.pdf", size: 1024, type: "application/pdf" });
    await activateContract(contract.id, { startDate: "2099-01-01", endDate: "2100-01-01", documentPath: path });
    await expect(updateDraftContract(contract.id, { value: 1200 })).rejects.toThrow();
  });
});
