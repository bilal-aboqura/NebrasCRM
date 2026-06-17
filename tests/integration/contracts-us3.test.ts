import { describe, expect, it } from "vitest";
import { completeContract, createContract, uploadContractDocument, activateContract } from "@/lib/actions/contracts";

describe("contract completion", () => {
  it("allows manager completion", async () => {
    const contract = await createContract({ facilityId: "fac-1", title: "Completion Test", value: 1000 });
    const path = await uploadContractDocument(contract.id, { name: "contract.pdf", size: 1024, type: "application/pdf" });
    await activateContract(contract.id, { startDate: "2099-01-01", endDate: "2100-01-01", documentPath: path });
    const completed = await completeContract(contract.id);
    expect(completed.status).toBe("completed");
  });
});
