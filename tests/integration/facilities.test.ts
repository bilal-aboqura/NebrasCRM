import { describe, expect, it } from "vitest";
import { createFacility, getFacilitiesList, updateFacility } from "@/lib/actions/facilities";

describe("facility management", () => {
  it("normalizes phone numbers and prevents duplicate tenant phones", async () => {
    const facility = await createFacility({ name: "Test Clinic", type: "Clinic", city: "Riyadh", region: "Riyadh", primaryPhone: "055 111 2233" });
    expect(facility.primaryPhone).toBe("+966551112233");
    await expect(createFacility({ name: "Copy Clinic", type: "Clinic", city: "Riyadh", region: "Riyadh", primaryPhone: "0551112233" })).rejects.toThrow();
  });

  it("returns searchable lists and writes status changes", async () => {
    const { rows } = await getFacilitiesList({ query: "Test", pageSize: 5 });
    expect(rows.length).toBeGreaterThan(0);
    const updated = await updateFacility(rows[0].id, { status: "qualified" });
    expect(updated.status).toBe("qualified");
  });
});
