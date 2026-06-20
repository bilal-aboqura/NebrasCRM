/**
 * Route: GET /api/offers/export
 * Exports offers scoped to user's company and role visibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { db } from "@/lib/data/store";
import { generateExcelExport, OFFER_EXPORT_HEADERS } from "@/lib/import-export/generator";
import { facilities } from "@/lib/data/mock";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { role, user, activeCompany } = await getAuthContext();
    void request;

    let rows = db.offers.filter(
      (o) => role === "super_admin" || o.companyId === activeCompany.id
    );

    if (!canManageCompanyWide(role)) {
      rows = rows.filter((o) => o.ownerId === user.id);
    }

    const exportRows = rows.map((o) => ({
      [OFFER_EXPORT_HEADERS[0]]: o.title ?? o.id,
      [OFFER_EXPORT_HEADERS[1]]: facilities.find((f) => f.id === o.facilityId)?.name ?? o.facilityId,
      [OFFER_EXPORT_HEADERS[2]]: o.status,
      [OFFER_EXPORT_HEADERS[3]]: o.total,
      [OFFER_EXPORT_HEADERS[4]]: o.validUntil,
      [OFFER_EXPORT_HEADERS[5]]: o.notes ?? ""
    }));

    const buffer = generateExcelExport(OFFER_EXPORT_HEADERS, exportRows, "العروض");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="offers-export.xlsx"',
        "Content-Length": String(buffer.length)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
