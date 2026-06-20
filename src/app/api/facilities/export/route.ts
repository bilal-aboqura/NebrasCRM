/**
 * Route: GET /api/facilities/export
 * Exports facilities matching active filters (status, city, type, assigned_to)
 * scoped by the user's company_id and role visibility.
 * Access: all authenticated roles (sales_user sees only owned facilities).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { db } from "@/lib/data/store";
import {
  generateExcelExport,
  FACILITY_EXPORT_HEADERS
} from "@/lib/import-export/generator";
import { facilityStatusLabels } from "@/lib/i18n";
import type { FacilityStatus } from "@/lib/types/domain";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { role, user, activeCompany } = await getAuthContext();

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status") as FacilityStatus | null;
    const cityFilter = searchParams.get("city");
    const typeFilter = searchParams.get("type");
    const assignedToFilter = searchParams.get("assigned_to");

    // Scope: company_id isolation
    let rows = db.facilities.filter(
      (f) => role === "super_admin" || f.companyId === activeCompany.id
    );

    // Sales user can only see owned facilities
    if (!canManageCompanyWide(role)) {
      rows = rows.filter((f) => f.ownerId === user.id);
    }

    // Apply filters
    if (statusFilter) rows = rows.filter((f) => f.status === statusFilter);
    if (cityFilter) rows = rows.filter((f) => f.city === cityFilter);
    if (typeFilter) rows = rows.filter((f) => f.type === typeFilter);
    if (assignedToFilter) rows = rows.filter((f) => f.ownerId === assignedToFilter);

    // Map to export rows with Arabic headers
    const exportRows = rows.map((f) => ({
      [FACILITY_EXPORT_HEADERS[0]]: f.name,
      [FACILITY_EXPORT_HEADERS[1]]: f.type,
      [FACILITY_EXPORT_HEADERS[2]]: f.city,
      [FACILITY_EXPORT_HEADERS[3]]: f.region,
      [FACILITY_EXPORT_HEADERS[4]]: f.primaryPhone,
      [FACILITY_EXPORT_HEADERS[5]]: f.secondaryPhone ?? "",
      [FACILITY_EXPORT_HEADERS[6]]: facilityStatusLabels[f.status],
      [FACILITY_EXPORT_HEADERS[7]]: f.updatedAt
    }));

    const buffer = generateExcelExport(FACILITY_EXPORT_HEADERS, exportRows, "المنشآت");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="facilities-export.xlsx"',
        "Content-Length": String(buffer.length)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
