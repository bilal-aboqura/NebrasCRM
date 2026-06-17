import { describe, expect, it } from "vitest";
import { createOffer, sendOffer, updateDraftOffer } from "@/lib/actions/offers";

describe("offer send and immutability", () => {
  it("blocks edits after send", async () => {
    const offer = await createOffer({ facilityId: "fac-1", title: "Send Test", validUntil: "2099-01-01", lineItems: [{ description: "Service", quantity: 1, unitPrice: 100 }] });
    await sendOffer(offer.id);
    await expect(updateDraftOffer(offer.id, { title: "Changed", validUntil: "2099-01-01", lineItems: [{ description: "Service", quantity: 1, unitPrice: 120 }] })).rejects.toThrow();
  });
});
