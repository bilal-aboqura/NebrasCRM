/**
 * Route: POST /api/facilities/import/confirm
 * Confirms a previously previewed import batch:
 * - Bulk-inserts valid rows as facilities (status=new, ownerId=null)
 * - Logs an import_created activity for each facility
 * - Updates the batch status to confirmed
 * Access: super_admin, company_admin, supervisor only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, assertRole } from "@/lib/auth/context";
import { importBatches } from "@/lib/data/import-batches";
import { db, addActivity, nextId, nowIso } from "@/lib/data/store";
import type { Facility } from "@/lib/types/domain";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { role, user, activeCompany } = await getAuthContext();
    assertRole(role, ["super_admin", "company_admin", "supervisor"]);

    const body = await request.json();
    const { batchId } = body as { batchId?: string };
    if (!batchId) {
      return NextResponse.json({ error: "معرّف الدفعة مطلوب" }, { status: 400 });
    }

    const batch = importBatches.find((b) => b.id === batchId);
    if (!batch) {
      return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
    }

    // Tenant isolation check
    if (role !== "super_admin" && batch.companyId !== activeCompany.id) {
      return NextResponse.json({ error: "غير مصرح لك بتأكيد هذه الدفعة" }, { status: 403 });
    }

    if (batch.status !== "preview") {
      return NextResponse.json(
        { error: "هذه الدفعة تم تأكيدها مسبقاً أو فشلت" },
        { status: 409 }
      );
    }

    const validRows = (batch._rows ?? []).filter(
      (r: { status: string }) => r.status === "valid"
    );

    let importedCount = 0;
    let skippedCount = (batch._rows ?? []).length - validRows.length;

    // "Transaction": insert all valid rows and activities atomically in mock store
    const insertedFacilities: Facility[] = [];
    try {
      for (const row of validRows) {
        const facility: Facility = {
          id: nextId("fac", db.facilities),
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
          updatedAt: nowIso()
        };
        db.facilities.push(facility);
        insertedFacilities.push(facility);
        importedCount++;
      }

      // Log activities for each inserted facility
      for (const facility of insertedFacilities) {
        addActivity({
          companyId: facility.companyId,
          facilityId: facility.id,
          kind: "import_created",
          message: `تم إنشاء المنشأة عبر الاستيراد من ملف ${batch.filename}`,
          createdAt: nowIso()
        });
      }

      // Update batch status
      batch.status = "confirmed";
      batch.validRows = importedCount;
      batch.skippedRows = skippedCount;
    } catch (insertError) {
      // Rollback: remove any inserted facilities
      for (const facility of insertedFacilities) {
        const idx = db.facilities.findIndex((f) => f.id === facility.id);
        if (idx !== -1) db.facilities.splice(idx, 1);
      }
      batch.status = "failed";
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    if (message.includes("403")) {
      return NextResponse.json({ error: "غير مصرح لك بتأكيد الاستيراد" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
