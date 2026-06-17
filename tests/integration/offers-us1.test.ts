import { describe, expect, it } from "vitest";
import { createOffer } from "@/lib/actions/offers";

describe("offer creation", () => {
  it("calculates draft offer totals server-side", async () => {
    const offer = await createOffer({ facilityId: "fac-1", contactId: "con-1", title: "Test Offer", validUntil: "2099-01-01", discountType: "fixed", discountValue: 100, taxRate: 15, lineItems: [{ description: "Service", quantity: 2, unitPrice: 500 }] });
    expect(offer.subtotal).toBe(1000);
    expect(offer.discount).toBe(100);
    expect(offer.tax).toBe(135);
    expect(offer.total).toBe(1035);
  });

  it("rejects discounts exceeding subtotal", async () => {
    await expect(createOffer({ facilityId: "fac-1", title: "Bad Offer", validUntil: "2099-01-01", discountValue: 2000, lineItems: [{ description: "Service", quantity: 1, unitPrice: 100 }] })).rejects.toThrow();
  });
});
