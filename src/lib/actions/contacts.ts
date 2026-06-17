"use server";

import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { assertCanManageFacility } from "@/lib/auth/rbac-guards";
import { addActivity, db, nextId } from "@/lib/data/store";
import type { Contact } from "@/lib/types/domain";
import { normalizeSaudiPhone } from "@/lib/utils/phone";

export interface ContactInput {
  facilityId: string;
  name: string;
  title: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
}

function clearPrimary(facilityId: string) {
  db.contacts.forEach((contact) => {
    if (contact.facilityId === facilityId) contact.isPrimary = false;
  });
}

export async function createContact(input: ContactInput) {
  const context = await getAuthContext();
  const facility = db.facilities.find((item) => item.id === input.facilityId);
  if (!facility) throw new Error("Facility not found");
  assertCanManageFacility(context.role, context.user.id, facility);
  if (input.isPrimary) clearPrimary(input.facilityId);
  const contact: Contact = {
    id: nextId("con", db.contacts),
    companyId: facility.companyId,
    facilityId: input.facilityId,
    name: input.name,
    title: input.title,
    phone: normalizeSaudiPhone(input.phone),
    email: input.email,
    isPrimary: Boolean(input.isPrimary),
    isActive: true
  };
  db.contacts.push(contact);
  addActivity({ companyId: contact.companyId, facilityId: contact.facilityId, kind: "contact_created", message: `تمت إضافة جهة الاتصال ${contact.name}` });
  return contact;
}

export async function updateContact(id: string, input: Partial<ContactInput>) {
  const contact = db.contacts.find((item) => item.id === id);
  if (!contact) throw new Error("Contact not found");
  const facility = db.facilities.find((item) => item.id === contact.facilityId);
  if (!facility) throw new Error("Facility not found");
  const context = await getAuthContext();
  assertCanManageFacility(context.role, context.user.id, facility);
  if (input.isPrimary) clearPrimary(contact.facilityId);
  Object.assign(contact, input, { phone: input.phone ? normalizeSaudiPhone(input.phone) : contact.phone });
  addActivity({ companyId: contact.companyId, facilityId: contact.facilityId, kind: "contact_updated", message: `تم تحديث جهة الاتصال ${contact.name}` });
  return contact;
}

export async function archiveContact(id: string) {
  const contact = db.contacts.find((item) => item.id === id);
  if (!contact) throw new Error("Contact not found");
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  contact.isActive = false;
  contact.isPrimary = false;
  addActivity({ companyId: contact.companyId, facilityId: contact.facilityId, kind: "contact_archived", message: "تمت أرشفة جهة اتصال" });
  return contact;
}

export async function recoverContact(id: string) {
  const contact = db.contacts.find((item) => item.id === id);
  if (!contact) throw new Error("Contact not found");
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  contact.isActive = true;
  addActivity({ companyId: contact.companyId, facilityId: contact.facilityId, kind: "contact_recovered", message: "تمت استعادة جهة اتصال" });
  return contact;
}
