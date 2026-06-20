"use server";

import { getFacilitiesList, updateFacility } from "@/lib/actions/facilities";
import { addActivity } from "@/lib/data/store";
import type { Facility, FacilityStatus } from "@/lib/types/domain";

export interface PipelineColumn {
  status: FacilityStatus;
  title: string;
  cards: Facility[];
  total: number;
}

export async function getPipelineAction(options: { query?: string; ownerId?: string; pageSize?: number } = {}) {
  const { rows } = await getFacilitiesList({ query: options.query, pageSize: 500 });
  const statuses: FacilityStatus[] = ["new", "contacted", "qualified", "proposal", "contract", "lost"];
  return statuses.map((status) => {
    const cards = rows.filter((facility) => facility.status === status && (!options.ownerId || facility.ownerId === options.ownerId));
    return { status, title: status, cards: cards.slice(0, options.pageSize ?? 20), total: cards.length };
  });
}

export async function updateFacilityStatusAction(facilityId: string, status: FacilityStatus, lostReason?: string) {
  const previous = (await getFacilitiesList({ pageSize: 500 })).rows.find((row) => row.id === facilityId);
  const facility = await updateFacility(facilityId, { status });
  addActivity({
    companyId: facility.companyId,
    facilityId,
    kind: "status_change",
    eventType: "status_change",
    oldValue: previous?.status,
    newValue: status,
    message: lostReason ? `تم تغيير المرحلة إلى ${status}: ${lostReason}` : `تم تغيير المرحلة إلى ${status}`
  });
  return facility;
}
