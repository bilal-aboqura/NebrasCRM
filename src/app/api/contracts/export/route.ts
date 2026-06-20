/**
 * Route: GET /api/contracts/export
 * Exports contracts scoped to user's company and role visibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { db } from "@/lib/data/store";
import { generateExcelExport, CONTRACT_EXPORT_HEADERS } from "@/lib/import-export/generator";
import { facilities } from "@/lib/data/mock";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { role, user, activeCompany } = await getAuthContext();
    void request;

    let rows = db.contracts.filter(
      (c) => role === "super_admin" || c.companyId === activeCompany.id
    );

    if (!canManageCompanyWide(role)) {
      rows = rows.filter((c) => c.ownerId === user.id);
    }

    const exportRows = rows.map((c) => ({
      [CONTRACT_EXPORT_HEADERS[0]]: c.referenceNumber,
      [CONTRACT_EXPORT_HEADERS[1]]: facilities.find((f) => f.id === c.facilityId)?.name ?? c.facilityId,
      [CONTRACT_EXPORT_HEADERS[2]]: c.status,
      [CONTRACT_EXPORT_HEADERS[3]]: c.value,
      [CONTRACT_EXPORT_HEADERS[4]]: c.startDate ?? "",
      [CONTRACT_EXPORT_HEADERS[5]]: c.endDate ?? ""
    }));

    const buffer = generateExcelExport(CONTRACT_EXPORT_HEADERS, exportRows, "العقود");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="contracts-export.xlsx"',
        "Content-Length": String(buffer.length)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
