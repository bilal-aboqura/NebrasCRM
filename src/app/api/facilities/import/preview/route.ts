/**
 * Route: POST /api/facilities/import/preview
 * Accepts a multipart/form-data upload (field: "file"), parses it,
 * validates rows, creates a preview batch, and returns the structured result.
 * Access: super_admin, company_admin, supervisor only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, assertRole } from "@/lib/auth/context";
import { parseImportFile } from "@/lib/import-export/parser";
import { validateFacilityRows } from "@/lib/import-export/validator";
import { importBatches, nextBatchId, getMaxImportRows } from "@/lib/data/import-batches";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { role, user, activeCompany } = await getAuthContext();
    assertRole(role, ["super_admin", "company_admin", "supervisor"]);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "يجب إرفاق ملف للرفع" }, { status: 400 });
    }

    const filename = (file as File).name;
    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse
    const { rows, totalRows } = parseImportFile(buffer, filename);

    // Row limit check
    const maxRows = getMaxImportRows();
    if (totalRows > maxRows) {
      return NextResponse.json(
        { error: `عدد الصفوف يتجاوز الحد الأقصى المسموح به (${maxRows} صف)` },
        { status: 400 }
      );
    }

    // Gather existing phones for this company (tenant isolation)
    const companyId = role === "super_admin" ? activeCompany.id : activeCompany.id;
    const existingPhones = new Set(
      db.facilities
        .filter((f) => f.companyId === companyId)
        .map((f) => f.primaryPhone)
    );

    // Validate rows
    const { validatedRows, summary } = validateFacilityRows(rows, existingPhones);

    // Create preview batch in mock store
    const batchId = nextBatchId();
    importBatches.push({
      id: batchId,
      companyId,
      uploadedBy: user.id,
      filename,
      totalRows: summary.total,
      validRows: summary.valid,
      skippedRows: summary.duplicates,
      errorRows: summary.errors,
      status: "preview",
      createdAt: new Date().toISOString(),
      _rows: validatedRows
    });

    return NextResponse.json({
      batchId,
      summary,
      rows: validatedRows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    if (message.includes("403")) {
      return NextResponse.json({ error: "غير مصرح لك برفع الملفات" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
