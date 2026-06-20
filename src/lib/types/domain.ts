export type Role = "super_admin" | "company_admin" | "supervisor" | "sales_user";
export type CompanyStatus = "active" | "inactive";
export type UserStatus = "invited" | "active" | "inactive";
export type FacilityStatus = "new" | "contacted" | "qualified" | "proposal" | "contract" | "lost";
export type FollowUpStatus = "pending" | "done" | "cancelled";
export type FollowUpType = "call" | "visit" | "send_offer" | "other";
export type FacilityActivityType = "status_change" | "owner_change" | "archived" | "recovered" | "created" | "edited";
export type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "superseded" | "archived";
export type ContractStatus = "draft" | "active" | "completed" | "terminated" | "archived";
export type DiscountType = "fixed" | "percentage";

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
  lostReason?: string;
  statusChangedAt?: string;
  createdAt?: string;
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
  eventType?: FacilityActivityType;
  actorId?: string;
  oldValue?: string;
  newValue?: string;
  message: string;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  companyId: string;
  facilityId: string;
  contactId?: string;
  ownerId: string;
  type: FollowUpType;
  status: FollowUpStatus;
  dueAt: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
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
  amount?: number;
}

export interface Offer {
  id: string;
  companyId: string;
  facilityId: string;
  contactId?: string;
  ownerId: string;
  title?: string;
  status: OfferStatus;
  version: number;
  rootOfferId?: string;
  parentOfferId?: string;
  isSuperseded?: boolean;
  isActive?: boolean;
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: string;
  notes?: string;
  sentAt?: string;
  decisionAt?: string;
  decisionNote?: string;
  archivedAt?: string;
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
  parentContractId?: string;
  isActive?: boolean;
  title?: string;
  terminationReason?: string;
  archivedAt?: string;
}
