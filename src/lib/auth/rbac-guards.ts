import type { Facility, Role } from "@/lib/types/domain";
import { canManageCompanyWide } from "@/lib/auth/context";

export function assertAllowed(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    throw new Error("403 Forbidden");
  }
}

export function canManageFacility(role: Role, userId: string, facility: Facility) {
  return canManageCompanyWide(role) || facility.ownerId === userId;
}

export function assertCanManageFacility(role: Role, userId: string, facility: Facility) {
  if (!canManageFacility(role, userId, facility)) {
    throw new Error("403 Forbidden: facility is outside your scope");
  }
}
