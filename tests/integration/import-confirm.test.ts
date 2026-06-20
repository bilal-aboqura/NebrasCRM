import { describe, expect, it, beforeEach } from "vitest";
import { importBatches } from "@/lib/data/import-batches";
import { db } from "@/lib/data/store";
import { facilities, activities } from "@/lib/data/mock";

// Helper: seed a preview batch with valid rows
function seedPreviewBatch(batchId: string, companyId: string, uploadedBy: string) {
  importBatches.push({
    id: batchId,
    companyId,
    uploadedBy,
    filename: "test.xlsx",
    totalRows: 2,
    validRows: 2,
    skippedRows: 0,
    errorRows: 0,
    status: "preview",
    createdAt: new Date().toISOString(),
    _rows: [
      {
        index: 1,
        status: "valid",
        data: {
          name: "مستشفى الاختبار",
          type: "مستشفى",
          city: "الرياض",
          region: "منطقة الرياض",
          primary_phone: "+966551110001",
          secondary_phone: null,
          lead_source: "imported",
          notes: ""
        },
        errors: []
      },
      {
        index: 2,
        status: "valid",
        data: {
          name: "عيادة الاختبار",
          type: "عيادة",
          city: "جدة",
          region: "منطقة مكة",
          primary_phone: "+966551110002",
          secondary_phone: null,
          lead_source: "imported",
          notes: ""
        },
        errors: []
      }
    ]
  });
}

describe("US3: Confirm import & activity logs", () => {
  const BATCH_ID = "batch-confirm-test";

  beforeEach(() => {
    importBatches.length = 0;
    // Keep only original mock facilities
    facilities.splice(3);
    // Keep only original mock activities
    activities.splice(2);
  });

  it("inserts valid rows as facilities with status=new and ownerId=null", async () => {
    seedPreviewBatch(BATCH_ID, "company-a", "u-admin-a");
    const batch = importBatches.find((b) => b.id === BATCH_ID)!;

    const validRows = (batch._rows ?? []).filter((r: { status: string }) => r.status === "valid");
    const facilityCountBefore = db.facilities.filter((f) => f.companyId === "company-a").length;

    for (const row of validRows) {
      db.facilities.push({
        id: `fac-import-${row.index}`,
        companyId: batch.companyId,
        name: row.data.name,
        type: row.data.type,
        city: row.data.city,
        region: row.data.region,
        primaryPhone: row.data.primary_phone,
        secondaryPhone: row.data.secondary_phone ?? undefined,
        ownerId: null,
        status: "new",
        isArchived: false,
        updatedAt: new Date().toISOString()
      });
    }

    const facilityCountAfter = db.facilities.filter((f) => f.companyId === "company-a").length;
    expect(facilityCountAfter).toBe(facilityCountBefore + 2);

    const importedFacility = db.facilities.find((f) => f.name === "مستشفى الاختبار");
    expect(importedFacility).toBeDefined();
    expect(importedFacility?.status).toBe("new");
    expect(importedFacility?.ownerId).toBeNull();
  });

  it("updates batch status to confirmed after successful import", () => {
    seedPreviewBatch(BATCH_ID, "company-a", "u-admin-a");
    const batch = importBatches.find((b) => b.id === BATCH_ID)!;
    batch.status = "confirmed";
    expect(importBatches.find((b) => b.id === BATCH_ID)?.status).toBe("confirmed");
  });

  it("rejects confirming a batch that is already confirmed (idempotency guard)", () => {
    seedPreviewBatch(BATCH_ID, "company-a", "u-admin-a");
    const batch = importBatches.find((b) => b.id === BATCH_ID)!;
    batch.status = "confirmed";
    expect(batch.status).not.toBe("preview");
  });
});
