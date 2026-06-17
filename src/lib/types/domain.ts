export type Role = "super_admin" | "company_admin" | "supervisor" | "sales_user";
export type CompanyStatus = "active" | "inactive";
export type UserStatus = "invited" | "active" | "inactive";
export type FacilityStatus = "new" | "contacted" | "qualified" | "proposal" | "contract" | "lost";
export type FollowUpStatus = "pending" | "done" | "cancelled";
export type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "superseded" | "archived";
export type ContractStatus = "draft" | "active" | "completed" | "terminated" | "archived";

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  city: string;
}

export interface Profile {
  id: string;
  companyId: string | null;
  email: string;
  displayName: string;
  role: Role;
  status: UserStatus;
}

export interface Facility {
  id: string;
  companyId: string;
  name: string;
  type: string;
  city: string;
  region: string;
  primaryPhone: string;
  secondaryPhone?: string;
  ownerId: string | null;
  status: FacilityStatus;
  isArchived: boolean;
  updatedAt: string;
}

export interface Contact {
  id: string;
  companyId: string;
  facilityId: string;
  name: string;
  title: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface Activity {
  id: string;
  companyId: string;
  facilityId: string;
  kind: string;
  message: string;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  companyId: string;
  facilityId: string;
  contactId?: string;
  ownerId: string;
  type: "call" | "visit" | "email" | "whatsapp";
  status: FollowUpStatus;
  dueAt: string;
  outcome?: string;
  notes?: string;
}

export interface CallLog {
  id: string;
  companyId: string;
  facilityId: string;
  contactId?: string;
  followUpId?: string;
  channel: "phone" | "whatsapp" | "email" | "visit";
  direction: "outbound" | "inbound";
  outcome: "answered" | "no_answer" | "callback" | "not_interested";
  occurredAt: string;
  notes?: string;
  isArchived: boolean;
}

export interface OfferLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Offer {
  id: string;
  companyId: string;
  facilityId: string;
  contactId?: string;
  ownerId: string;
  status: OfferStatus;
  version: number;
  parentOfferId?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: string;
  lineItems: OfferLineItem[];
}

export interface Contract {
  id: string;
  companyId: string;
  facilityId: string;
  offerId?: string;
  ownerId: string;
  referenceNumber: string;
  status: ContractStatus;
  value: number;
  startDate?: string;
  endDate?: string;
  documentPath?: string;
}
