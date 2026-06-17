import { describe, expect, it } from "vitest";
import { normalizeSaudiPhone, toWaMe } from "@/lib/utils/phone";

describe("phone utilities", () => {
  it("normalizes Saudi local mobile numbers", () => {
    expect(normalizeSaudiPhone("050 111 2233")).toBe("+966501112233");
  });

  it("builds encoded WhatsApp links", () => {
    expect(toWaMe("0501112233", "مرحبا")).toContain("text=%D9%85");
  });
});
