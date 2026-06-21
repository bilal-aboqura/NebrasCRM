import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["0501234567", "966501234567"],
    ["+966 50 123 4567", "966501234567"],
    ["00966-11-456-7890", "966114567890"],
    ["0114567890", "966114567890"],
  ])("normalizes %s", (input, expected) => expect(normalizePhone(input)).toBe(expected));

  it("returns an empty value when no digits are supplied", () => {
    expect(normalizePhone("---")).toBe("");
  });
});

describe("buildWhatsAppUrl", () => {
  it("uses digits only and resolves every company placeholder", () => {
    const url = buildWhatsAppUrl("+966 50-000-0000", "شركة نبراس", "مرحباً من [اسم الشركة] - [اسم الشركة]");
    expect(url).toBe(`https://wa.me/966500000000?text=${encodeURIComponent("مرحباً من شركة نبراس - شركة نبراس")}`);
  });
});
