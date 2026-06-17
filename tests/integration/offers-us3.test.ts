import { describe, expect, it } from "vitest";
import { createOffer, createOfferRevision, sendOffer } from "@/lib/actions/offers";

describe("offer revisions", () => {
  it("increments versions and supersedes predecessor", async () => {
    const offer = await createOffer({ facilityId: "fac-1", title: "Revision Test", validUntil: "2099-01-01", lineItems: [{ description: "Service", quantity: 1, unitPrice: 100 }] });
    await sendOffer(offer.id);
    const revision = await createOfferRevision(offer.id);
    expect(revision.version).toBe(2);
    expect(revision.parentOfferId).toBe(offer.id);
    expect(offer.isSuperseded).toBe(true);
  });
});
