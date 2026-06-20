/**
 * Route: GET /api/followups/export
 * Exports follow-ups scoped to user's company and role visibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { db } from "@/lib/data/store";
import { generateExcelExport, FOLLOWUP_EXPORT_HEADERS } from "@/lib/import-export/generator";
import { facilities } from "@/lib/data/mock";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { role, user, activeCompany } = await getAuthContext();
    void request;

    let rows = db.followUps.filter(
      (f) => role === "super_admin" || f.companyId === activeCompany.id
    );

    if (!canManageCompanyWide(role)) {
      rows = rows.filter((f) => f.ownerId === user.id);
    }

    const exportRows = rows.map((f) => ({
      [FOLLOWUP_EXPORT_HEADERS[0]]: facilities.find((fac) => fac.id === f.facilityId)?.name ?? f.facilityId,
      [FOLLOWUP_EXPORT_HEADERS[1]]: f.type,
      [FOLLOWUP_EXPORT_HEADERS[2]]: f.status,
      [FOLLOWUP_EXPORT_HEADERS[3]]: f.dueAt,
      [FOLLOWUP_EXPORT_HEADERS[4]]: f.notes ?? "",
      [FOLLOWUP_EXPORT_HEADERS[5]]: f.outcome ?? ""
    }));

    const buffer = generateExcelExport(FOLLOWUP_EXPORT_HEADERS, exportRows, "المتابعات");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="followups-export.xlsx"',
        "Content-Length": String(buffer.length)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
