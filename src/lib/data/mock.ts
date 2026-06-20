import type { Activity, CallLog, Company, Contact, Contract, Facility, FollowUp, Offer, Profile } from "@/lib/types/domain";
import type { Assessment } from "@/lib/types/assessment";

export const companies: Company[] = [
  { id: "company-a", name: "نبراس الجودة", status: "active", city: "الرياض" },
  { id: "company-b", name: "تقنية الارتقاء", status: "active", city: "جدة" }
];

export const profiles: Profile[] = [
  { id: "u-super", companyId: null, email: "super@nebras.local", displayName: "مدير النظام", role: "super_admin", status: "active" },
  { id: "u-admin-a", companyId: "company-a", email: "admin@nebras.local", displayName: "مدير الشركة", role: "company_admin", status: "active" },
  { id: "u-supervisor-a", companyId: "company-a", email: "supervisor@nebras.local", displayName: "مشرف المبيعات", role: "supervisor", status: "active" },
  { id: "u-sales-a", companyId: "company-a", email: "sales@nebras.local", displayName: "مندوب المبيعات", role: "sales_user", status: "active" },
  { id: "u-sales-b", companyId: "company-b", email: "sales-b@nebras.local", displayName: "مندوب جدة", role: "sales_user", status: "active" }
];

export const facilities: Facility[] = [
  {
    id: "fac-1",
    companyId: "company-a",
    name: "مستشفى النور",
    type: "مستشفى",
    city: "الرياض",
    region: "منطقة الرياض",
    primaryPhone: "+966501112233",
    secondaryPhone: "+966501114455",
    ownerId: "u-sales-a",
    status: "new",
    isArchived: false,
    updatedAt: "2026-06-16T09:00:00.000Z"
  },
  {
    id: "fac-2",
    companyId: "company-a",
    name: "مجمع العناية الطبي",
    type: "مجمع طبي",
    city: "الخرج",
    region: "منطقة الرياض",
    primaryPhone: "+966502224466",
    ownerId: null,
    status: "proposal",
    isArchived: false,
    updatedAt: "2026-06-15T10:30:00.000Z"
  },
  {
    id: "fac-3",
    companyId: "company-b",
    name: "مركز الارتقاء الصحي",
    type: "مركز صحي",
    city: "جدة",
    region: "منطقة مكة",
    primaryPhone: "+966503335577",
    ownerId: "u-sales-b",
    status: "contract",
    isArchived: false,
    updatedAt: "2026-06-14T12:00:00.000Z"
  }
];

export const contacts: Contact[] = [
  { id: "con-1", companyId: "company-a", facilityId: "fac-1", name: "د. أحمد سالم", title: "مدير الجودة", phone: "+966501112233", email: "ahmad@example.com", isPrimary: true, isActive: true },
  { id: "con-2", companyId: "company-a", facilityId: "fac-1", name: "أ. نورة علي", title: "مسؤولة الاعتماد", phone: "+966501114455", isPrimary: false, isActive: true },
  { id: "con-3", companyId: "company-a", facilityId: "fac-2", name: "د. خالد", title: "المدير الطبي", phone: "+966502224466", isPrimary: true, isActive: true }
];

export const activities: Activity[] = [
  { id: "act-1", companyId: "company-a", facilityId: "fac-1", kind: "facility_created", message: "تم إنشاء المنشأة وتعيين المالك.", createdAt: "2026-06-16T09:05:00.000Z" },
  { id: "act-2", companyId: "company-a", facilityId: "fac-1", kind: "call_logged", message: "تم تسجيل اتصال صادر مع جهة الاتصال الأساسية.", createdAt: "2026-06-16T10:00:00.000Z" }
];

export const followUps: FollowUp[] = [
  { id: "fu-1", companyId: "company-a", facilityId: "fac-1", contactId: "con-1", ownerId: "u-sales-a", type: "call", status: "pending", dueAt: "2026-06-18T08:00:00.000Z", notes: "متابعة عرض الاعتماد" },
  { id: "fu-2", companyId: "company-a", facilityId: "fac-2", ownerId: "u-supervisor-a", type: "visit", status: "done", dueAt: "2026-06-15T08:00:00.000Z", outcome: "تم الاجتماع" }
];

export const callLogs: CallLog[] = [
  { id: "call-1", companyId: "company-a", facilityId: "fac-1", contactId: "con-1", channel: "phone", direction: "outbound", outcome: "answered", occurredAt: "2026-06-16T10:00:00.000Z", notes: "طلبوا عرضا محدثا", isArchived: false }
];

export const offers: Offer[] = [
  {
    id: "off-1",
    companyId: "company-a",
    facilityId: "fac-1",
    contactId: "con-1",
    ownerId: "u-sales-a",
    status: "sent",
    version: 1,
    subtotal: 15000,
    discount: 1000,
    tax: 2100,
    total: 16100,
    validUntil: "2026-07-15",
    lineItems: [{ id: "li-1", description: "استشارات اعتماد CBAHI", quantity: 1, unitPrice: 15000 }]
  },
  {
    id: "off-expired",
    companyId: "company-a",
    facilityId: "fac-1",
    contactId: "con-2",
    ownerId: "u-sales-a",
    title: "عرض منتهي الصلاحية",
    status: "sent",
    version: 1,
    subtotal: 5000,
    discount: 0,
    tax: 750,
    total: 5750,
    validUntil: "2026-01-01",
    lineItems: [{ id: "li-expired-1", description: "مراجعة تحضيرية", quantity: 1, unitPrice: 5000 }]
  }
];

export const contracts: Contract[] = [
  { id: "ctr-1", companyId: "company-a", facilityId: "fac-1", offerId: "off-1", ownerId: "u-sales-a", referenceNumber: "CON-2026-0001", status: "active", value: 16100, startDate: "2026-06-20", endDate: "2027-06-19", documentPath: "company-a/ctr-1/signed.pdf" }
];

export const assessments: Assessment[] = [];
