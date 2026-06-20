import { activities, callLogs, companies, contacts, contracts, facilities, followUps, offers, profiles } from "@/lib/data/mock";
import type { Activity, CallLog, Company, Contact, Contract, Facility, FollowUp, Offer, Profile } from "@/lib/types/domain";

export const db = {
  activities,
  callLogs,
  companies,
  contacts,
  contracts,
  facilities,
  followUps,
  offers,
  profiles
};

export type TableName = keyof typeof db;

export function nextId(prefix: string, rows: Array<{ id: string }>) {
  return `${prefix}-${rows.length + 1}-${Date.now().toString(36)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function addActivity(input: Omit<Activity, "id" | "createdAt"> & { createdAt?: string }) {
  const activity: Activity = {
    id: nextId("act", activities),
    createdAt: input.createdAt ?? nowIso(),
    companyId: input.companyId,
    facilityId: input.facilityId,
    kind: input.kind,
    eventType: input.eventType,
    actorId: input.actorId,
    oldValue: input.oldValue,
    newValue: input.newValue,
    message: input.message
  };
  activities.unshift(activity);
  return activity;
}

export function cloneRows<T extends Company | Profile | Facility | Contact | Activity | FollowUp | CallLog | Offer | Contract>(rows: T[]) {
  return rows.map((row) => ({ ...row }));
}

export function formatSar(value: number) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(value);
}

export function isPastRiyadhDate(date: string) {
  const now = new Date();
  const riyadhToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  return date < riyadhToday;
}
