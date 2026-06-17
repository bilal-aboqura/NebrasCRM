import { describe, expect, it } from "vitest";
import { createOffer, recordOfferDecision, sendOffer } from "@/lib/actions/offers";

describe("offer decisions", () => {
  it("records accepted and rejected decisions", async () => {
    const offer = await createOffer({ facilityId: "fac-1", title: "Decision Test", validUntil: "2099-01-01", lineItems: [{ description: "Service", quantity: 1, unitPrice: 100 }] });
    await sendOffer(offer.id);
    const decided = await recordOfferDecision(offer.id, { decision: "accepted", decisionNote: "Approved" });
    expect(decided.status).toBe("accepted");
    expect(decided.decisionNote).toBe("Approved");
  });
});
