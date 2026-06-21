import { describe, expect, it } from "vitest";
import { canEditCallLog } from "@/lib/types/call-logs";

describe("call-log edit window", () => {
  const now = Date.parse("2026-06-21T12:00:00Z");
  it("allows a creator strictly within 24 hours", () => {
    expect(canEditCallLog("2026-06-20T12:00:01Z", "user-a", "user-a", false, now)).toBe(true);
    expect(canEditCallLog("2026-06-20T11:59:59Z", "user-a", "user-a", false, now)).toBe(false);
  });
  it("allows managers at any age and blocks other representatives", () => {
    expect(canEditCallLog("2020-01-01T00:00:00Z", "user-a", "manager", true, now)).toBe(true);
    expect(canEditCallLog("2026-06-21T11:00:00Z", "user-a", "user-b", false, now)).toBe(false);
  });
});
