import { describe, expect, it } from "vitest";
import { getOffers } from "@/lib/actions/offers";

describe("offer directory", () => {
  it("returns active tenant-scoped offers", async () => {
    const rows = await getOffers();
    expect(rows.every((offer) => offer.companyId === "company-a")).toBe(true);
  });
});
