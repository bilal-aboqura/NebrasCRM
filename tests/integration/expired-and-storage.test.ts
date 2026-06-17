import { describe, expect, it } from "vitest";
import { GET as signedGet } from "@/app/api/contracts/signed/route";
import { GET as directGet } from "@/app/storage/v1/object/contracts/[...path]/route";
import { getOfferDisplayStatus } from "@/lib/actions/offers";
import { offers } from "@/lib/data/mock";

describe("expiry and secure storage verification", () => {
  it("derives expired offer status in Riyadh date logic", () => {
    const expired = offers.find((offer) => offer.id === "off-expired");
    expect(expired).toBeTruthy();
    expect(getOfferDisplayStatus(expired!)).toBe("expired");
  });

  it("keeps private contract object paths distinct from signed action URLs", async () => {
    const direct = directGet();
    const signed = signedGet(new Request("http://127.0.0.1:3000/api/contracts/signed?path=company-a/ctr-1/signed.pdf"));
    expect(direct.status).toBe(403);
    expect(signed.status).toBe(200);
  });
});
