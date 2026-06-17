import { describe, expect, it } from "vitest";
import { db } from "@/lib/data/store";

describe("dashboard counts", () => {
  it("has scoped source data for stat cards", () => {
    expect(db.facilities.length).toBeGreaterThan(0);
    expect(db.offers.length).toBeGreaterThan(0);
    expect(db.contracts.length).toBeGreaterThan(0);
  });
});
