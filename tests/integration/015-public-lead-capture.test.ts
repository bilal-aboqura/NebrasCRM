import { describe, it, expect, beforeEach, vi } from "vitest";
import { submitLeadAction } from "@/lib/actions/lead-capture";
import { db } from "@/lib/data/store";
import { headers } from "next/headers";

let currentIp = "192.168.1.1";

// Mock headers for IP tracking
vi.mock("next/headers", () => {
  return {
    headers: vi.fn(() => new Map([["x-forwarded-for", currentIp]])),
  };
});

describe("Public Lead Capture Server Action", () => {
  let testCounter = 1;
  beforeEach(() => {
    // Reset DB state for clean tests
    db.facilities = [];
    db.activities = [];
    currentIp = `192.168.1.${testCounter++}`; // new IP for each test
  });

  it("should fail validation on missing fields", async () => {
    const res = await submitLeadAction({
      facilityName: "",
      city: "",
      phone: "",
      facilityType: "",
    });
    
    expect(res.success).toBe(false);
    expect(res.errors?.facilityName).toBeDefined();
    expect(res.errors?.city).toBeDefined();
    expect(res.errors?.phone).toBeDefined();
    expect(res.errors?.facilityType).toBeDefined();
  });

  it("should successfully create a new lead", async () => {
    const res = await submitLeadAction({
      facilityName: "مجمع النور الطبي",
      city: "الرياض",
      phone: "0551234567",
      facilityType: "مجمع طبي",
    });

    expect(res.success).toBe(true);
    expect(res.duplicate).toBeUndefined();

    expect(db.facilities.length).toBe(1);
    const newFac = db.facilities[0];
    expect(newFac.name).toBe("مجمع النور الطبي");
    expect(newFac.primaryPhone).toBe("+966551234567");
    expect(newFac.lead_source).toBe("website_form");
    expect(newFac.status).toBe("new");
    expect(newFac.ownerId).toBeNull();
    expect(newFac.notes).toContain("المدينة المدخلة: الرياض");

    expect(db.activities.length).toBe(1);
    expect(db.activities[0].kind).toBe("facility_created");
  });

  it("should handle active duplicates gracefully", async () => {
    // First submission
    await submitLeadAction({
      facilityName: "مجمع النور الطبي",
      city: "الرياض",
      phone: "0551234567",
      facilityType: "مجمع طبي",
    });

    // Second submission with same phone
    const res = await submitLeadAction({
      facilityName: "مجمع النور الجديد",
      city: "جدة",
      phone: "0551234567",
      facilityType: "مجمع طبي",
    });

    expect(res.success).toBe(true);
    expect(res.duplicate).toBe(true);
    
    // Ensure no new facility was created
    expect(db.facilities.length).toBe(1);
  });

  it("should unarchive and update archived duplicates", async () => {
    // First submission
    await submitLeadAction({
      facilityName: "مجمع النور القديم",
      city: "الرياض",
      phone: "0551234567",
      facilityType: "مجمع طبي",
    });

    // Manually archive it
    db.facilities[0].isArchived = true;
    db.facilities[0].status = "lost";
    db.facilities[0].ownerId = "user-1";

    // Second submission with same phone
    const res = await submitLeadAction({
      facilityName: "مجمع النور الجديد",
      city: "جدة",
      phone: "0551234567",
      facilityType: "مستشفى",
    });

    expect(res.success).toBe(true);
    expect(res.duplicate).toBeUndefined();
    
    expect(db.facilities.length).toBe(1);
    const updatedFac = db.facilities[0];
    
    expect(updatedFac.isArchived).toBe(false);
    expect(updatedFac.status).toBe("new");
    expect(updatedFac.ownerId).toBeNull();
    expect(updatedFac.name).toBe("مجمع النور الجديد");
    expect(updatedFac.type).toBe("مستشفى");
    expect(updatedFac.notes).toContain("المدينة المدخلة: جدة");
    expect(updatedFac.notes).toContain("المدينة المدخلة: الرياض");

    expect(db.activities.length).toBe(2);
    expect(db.activities[1].kind).toBe("facility_reactivated");
  });
  
  it("should rate limit after 5 submissions", async () => {
    for (let i = 0; i < 5; i++) {
      await submitLeadAction({
        facilityName: `Test ${i}`,
        city: "Test",
        phone: `055000000${i}`,
        facilityType: "مجمع طبي",
      });
    }

    const res = await submitLeadAction({
      facilityName: "Spam",
      city: "Spam",
      phone: "0559999999",
      facilityType: "مجمع طبي",
    });

    expect(res.success).toBe(false);
    expect(res.rateLimited).toBe(true);
  });
});
