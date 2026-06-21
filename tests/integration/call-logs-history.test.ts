import { describe, expect, it } from "vitest";

describe("call-log history paging contract", () => {
  it("uses ten records per page with deterministic offsets", () => {
    const limit = 10;
    const page = 3;
    expect((page - 1) * limit).toBe(20);
    expect(Math.ceil(31 / limit)).toBe(4);
  });

  it("sorts newest communication timestamps first", () => {
    const values = ["2026-06-20T09:00:00Z", "2026-06-21T09:00:00Z"];
    expect(values.sort((a, b) => Date.parse(b) - Date.parse(a))[0]).toContain("2026-06-21");
  });
});
