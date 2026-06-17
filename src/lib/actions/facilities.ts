"use server";

import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { assertCanManageFacility } from "@/lib/auth/rbac-guards";
import { addActivity, db, nextId, nowIso } from "@/lib/data/store";
import type { Facility, FacilityStatus } from "@/lib/types/domain";
import { normalizeSaudiPhone } from "@/lib/utils/phone";

export interface FacilityInput {
  name: string;
  type: string;
  city: string;
  region: string;
  primaryPhone: string;
  secondaryPhone?: string;
  ownerId?: string | null;
  status?: FacilityStatus;
}

export async function createFacility(input: FacilityInput) {
  const context = await getAuthContext();
  const primaryPhone = normalizeSaudiPhone(input.primaryPhone);
  if (db.facilities.some((facility) => facility.companyId === context.activeCompany.id && facility.primaryPhone === primaryPhone)) {
    throw new Error("يوجد منشأة بنفس رقم الهاتف");
  }
  const facility: Facility = {
    id: nextId("fac", db.facilities),
    companyId: context.activeCompany.id,
    name: input.name,
    type: input.type,
    city: input.city,
    region: input.region,
    primaryPhone,
    secondaryPhone: input.secondaryPhone ? normalizeSaudiPhone(input.secondaryPhone) : undefined,
    ownerId: input.ownerId ?? context.user.id,
    status: input.status ?? "new",
    isArchived: false,
    updatedAt: nowIso()
  };
  db.facilities.push(facility);
  addActivity({ companyId: facility.companyId, facilityId: facility.id, kind: "facility_created", message: `تم إنشاء المنشأة ${facility.name}` });
  return facility;
}

export async function getFacilitiesList(options: { query?: string; status?: FacilityStatus | "all"; showArchived?: boolean; page?: number; pageSize?: number } = {}) {
  const context = await getAuthContext();
  const pageSize = options.pageSize ?? 25;
  const page = options.page ?? 1;
  let rows = db.facilities.filter((facility) => context.role === "super_admin" || facility.companyId === context.activeCompany.id);
  if (!canManageCompanyWide(context.role)) rows = rows.filter((facility) => facility.ownerId === context.user.id);
  if (!options.showArchived) rows = rows.filter((facility) => !facility.isArchived);
  if (options.status && options.status !== "all") rows = rows.filter((facility) => facility.status === options.status);
  if (options.query) rows = rows.filter((facility) => facility.name.includes(options.query!) || facility.primaryPhone.includes(options.query!));
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
}

export async function getFacilityDetail(id: string) {
  const context = await getAuthContext();
  const facility = db.facilities.find((item) => item.id === id);
  if (!facility) throw new Error("Facility not found");
  assertCanManageFacility(context.role, context.user.id, facility);
  return facility;
}

export async function getFacilityActivity(facilityId: string) {
  await getFacilityDetail(facilityId);
  return db.activities.filter((activity) => activity.facilityId === facilityId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateFacility(id: string, input: Partial<FacilityInput>) {
  const context = await getAuthContext();
  const facility = await getFacilityDetail(id);
  if (input.ownerId !== undefined || input.status !== undefined) {
    assertCanManageFacility(context.role, context.user.id, facility);
  }
  Object.assign(facility, {
    ...input,
    primaryPhone: input.primaryPhone ? normalizeSaudiPhone(input.primaryPhone) : facility.primaryPhone,
    secondaryPhone: input.secondaryPhone ? normalizeSaudiPhone(input.secondaryPhone) : facility.secondaryPhone,
    updatedAt: nowIso()
  });
  addActivity({ companyId: facility.companyId, facilityId: facility.id, kind: "facility_updated", message: "تم تحديث بيانات المنشأة" });
  return facility;
}

export async function reassignFacility(id: string, ownerId: string | null) {
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  const facility = await updateFacility(id, { ownerId });
  db.followUps.forEach((followUp) => {
    if (followUp.facilityId === id && followUp.status === "pending") {
      followUp.ownerId = ownerId ?? context.user.id;
    }
  });
  return facility;
}

export async function archiveFacility(id: string) {
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  const facility = await getFacilityDetail(id);
  facility.isArchived = true;
  addActivity({ companyId: facility.companyId, facilityId: facility.id, kind: "facility_archived", message: "تمت أرشفة المنشأة" });
  return facility;
}

export async function recoverFacility(id: string) {
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  const facility = await getFacilityDetail(id);
  facility.isArchived = false;
  addActivity({ companyId: facility.companyId, facilityId: facility.id, kind: "facility_recovered", message: "تمت استعادة المنشأة" });
  return facility;
}
