import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ActivityTimeline } from "@/components/facilities/ActivityTimeline";
import { CallLogsSection } from "@/components/facilities/CallLogsSection";
import { ContactsSection } from "@/components/facilities/ContactsSection";
import { ContractsSection } from "@/components/facilities/ContractsSection";
import { FacilityArchiveButton } from "@/components/facilities/FacilityArchiveButton";
import { FacilityForm } from "@/components/facilities/FacilityForm";
import { FollowUpsSection } from "@/components/facilities/FollowUpsSection";
import { OffersSection } from "@/components/facilities/OffersSection";
import { LogCommunicationModal } from "@/components/facilities/LogCommunicationModal";
import { QuickLogBanner, TrackedCommunicationLink } from "@/components/facilities/QuickLogBanner";
import SelfAssessmentHistory from "@/components/facilities/SelfAssessmentHistory";
import { getFacilityCallLogs } from "@/lib/actions/call-logs";
import { getFacilityContacts } from "@/lib/actions/contacts";
import { getContractOptions, getFacilityContracts } from "@/lib/actions/contracts";
import { getFacilityActivity, getFacilityDetail, getFacilityOptions } from "@/lib/actions/facilities";
import { getFacilityFollowUps, getFollowUpOptions } from "@/lib/actions/followups";
import { getFacilityOffers, getOfferOptions } from "@/lib/actions/offers";
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/utils/phone";

const statusLabels: Record<string, string> = { new: "جديد", contacted: "تم التواصل", interested: "مهتم", offer: "عرض", negotiation: "تفاوض", contract: "عقد", lost: "مفقود" };
const typeLabels: Record<string, string> = { medical_complex: "مجمع طبي", dental_complex: "مجمع أسنان", lab: "مختبر", radiology: "مركز أشعة", hospital: "مستشفى" };

export default async function FacilityDetailPage({ params, searchParams }: { params: { id: string }; searchParams?: { callsPage?: string; archivedCalls?: string } }) {
  const detail = await getFacilityDetail(params.id);
  if (!detail.success) notFound();
  const callsPage = Math.max(1, Number(searchParams?.callsPage) || 1);
  const [activity, options, contactsResult, archivedResult, followUpsResult, followUpOptions, callLogsResult, offersResult, offerOptions, contractsResult, contractOptions] = await Promise.all([
    getFacilityActivity(params.id), getFacilityOptions(), getFacilityContacts(params.id),
    detail.canManage ? getFacilityContacts(params.id, true) : Promise.resolve({ success: true as const, data: [] }),
    getFacilityFollowUps(params.id), getFollowUpOptions(params.id),
    getFacilityCallLogs(params.id, callsPage, searchParams?.archivedCalls === "1"),
    getFacilityOffers(params.id), detail.data.is_active ? getOfferOptions(params.id) : Promise.resolve({ success: true as const, data: { contacts: [], canManage: detail.canManage } }),
    getFacilityContracts(params.id), detail.data.is_active ? getContractOptions(params.id) : Promise.resolve({ success: true as const, data: { contacts: [], offers: [], canManage: detail.canManage, facilityStatus: detail.data.status } }),
  ]);
  const facility = detail.data;
  const company = facility.companies as unknown as { name_ar?: string; whatsapp_template?: string } | null;
  const region = facility.regions as unknown as { name_ar?: string } | null;
  const city = facility.cities as unknown as { name_ar?: string } | null;
  const owner = facility.owner as unknown as { display_name?: string; status?: string } | null;
  const whatsappUrl = buildWhatsAppUrl(facility.primary_phone, company?.name_ar ?? "", company?.whatsapp_template ?? DEFAULT_WHATSAPP_TEMPLATE);
  const contacts = contactsResult.success ? contactsResult.data : [];
  const followUps = followUpsResult.success ? followUpsResult.data : [];

  return <section className="space-y-6" dir="rtl">
    <Link href="/dashboard/facilities" className="inline-flex items-center gap-2 text-nebras-green"><ArrowRight size={18} />العودة إلى قائمة المنشآت</Link>
    {!facility.is_active && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 font-bold text-amber-900">هذه المنشأة مؤرشفة، وسجلها محفوظ للقراءة.</div>}
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-bold text-nebras-gold">ملف المنشأة</p><h1 className="text-3xl font-extrabold text-nebras-green">{facility.name_ar}</h1><span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{statusLabels[facility.status]}</span></div><div className="flex flex-wrap gap-3">{facility.is_active && <LogCommunicationModal facilityId={facility.id} contacts={contacts} followUps={followUps} />}{detail.canEdit && <FacilityForm {...options} facility={facility} />}{detail.canManage && <FacilityArchiveButton id={facility.id} active={facility.is_active} />}</div></div>
    <div className="grid gap-6 lg:grid-cols-3">
      <article className="space-y-5 rounded-2xl bg-white p-6 shadow-sm lg:col-span-2"><h2 className="text-xl font-extrabold">البيانات الأساسية</h2><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">نوع المنشأة</dt><dd className="font-bold">{typeLabels[facility.type]}</dd></div><div><dt className="text-sm text-slate-500">الموقع</dt><dd className="font-bold">{facility.city_custom || city?.name_ar}، {region?.name_ar}</dd></div><div><dt className="text-sm text-slate-500">مسؤول المبيعات</dt><dd className="font-bold">{owner?.display_name ?? "غير مسندة"}{owner?.status === "inactive" && <span className="mr-2 text-amber-700">(غير نشط)</span>}</dd></div><div><dt className="text-sm text-slate-500">مصدر العميل</dt><dd className="font-bold">{facility.lead_source === "manual" ? "إضافة يدوية" : facility.lead_source === "website_form" ? "نموذج الموقع" : "مستورد"}</dd></div></dl><div><h3 className="text-sm text-slate-500">ملاحظات</h3><p className="mt-1 whitespace-pre-wrap">{facility.notes || "لا توجد ملاحظات."}</p></div></article>
      <aside className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold">التواصل</h2><div className="mt-5 space-y-3"><TrackedCommunicationLink href={`tel:${facility.primary_phone}`} facilityId={facility.id} channel="call" className="flex items-center justify-center gap-2 rounded-xl border p-3 font-bold text-nebras-green">{facility.primary_phone}</TrackedCommunicationLink>{facility.secondary_phone && <TrackedCommunicationLink href={`tel:${facility.secondary_phone}`} facilityId={facility.id} channel="call" className="flex items-center justify-center gap-2 rounded-xl border p-3">{facility.secondary_phone}</TrackedCommunicationLink>}<TrackedCommunicationLink href={whatsappUrl} facilityId={facility.id} channel="whatsapp" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 font-bold text-white">واتساب</TrackedCommunicationLink></div></aside>
    </div>
    {contactsResult.success ? <ContactsSection facilityId={facility.id} contacts={contacts} archivedContacts={archivedResult.success ? archivedResult.data : []} canEdit={Boolean(facility.is_active)} canManage={detail.canManage && Boolean(facility.is_active)} companyName={company?.name_ar ?? ""} whatsappTemplate={company?.whatsapp_template} /> : <article className="rounded-2xl bg-white p-6 text-red-700 shadow-sm">{contactsResult.error}</article>}
    {followUpsResult.success && followUpOptions.success ? <FollowUpsSection facilityId={facility.id} followUps={followUps} contacts={followUpOptions.data.contacts} owners={followUpOptions.data.owners} canEdit={Boolean(facility.is_active)} canManage={followUpOptions.data.canManage && Boolean(facility.is_active)} defaultOwnerId={followUpOptions.data.defaultOwnerId} /> : <article className="rounded-2xl bg-white p-6 text-red-700 shadow-sm">{followUpsResult.success ? (followUpOptions.success ? "" : followUpOptions.error) : followUpsResult.error}</article>}
    {callLogsResult.success ? <CallLogsSection page={callLogsResult.data} canManage={Boolean(callLogsResult.canManage)} currentUserId={callLogsResult.currentUserId ?? ""} showArchived={searchParams?.archivedCalls === "1"} /> : <article className="rounded-2xl bg-white p-6 text-red-700 shadow-sm">{callLogsResult.error}</article>}
    {offersResult.success && offerOptions.success ? <OffersSection facilityId={facility.id} facilityName={facility.name_ar} facilityStatus={facility.status} offers={offersResult.data} contacts={offerOptions.data.contacts} canEdit={Boolean(facility.is_active)} /> : <article className="rounded-2xl bg-white p-6 text-red-700 shadow-sm">{offersResult.success ? (offerOptions.success ? "" : offerOptions.error.message) : offersResult.error.message}</article>}
    {contractsResult.success && contractOptions.success ? <ContractsSection facilityId={facility.id} facilityName={facility.name_ar} facilityStatus={facility.status} contracts={contractsResult.data} contacts={contractOptions.data.contacts} offers={contractOptions.data.offers} canEdit={Boolean(facility.is_active)} canManage={contractOptions.data.canManage && Boolean(facility.is_active)} /> : <article className="rounded-2xl bg-white p-6 text-red-700 shadow-sm">{contractsResult.success ? (contractOptions.success ? "" : contractOptions.error.message) : contractsResult.error.message}</article>}
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 px-1">سجل التقييم الذاتي (CBAHI)</h2>
      <SelfAssessmentHistory facilityId={facility.id} facilityType={facility.type} />
    </div>
    <article className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="mb-6 text-xl font-extrabold">سجل النشاط</h2>{activity.success ? <ActivityTimeline activities={activity.data} /> : <p className="text-red-700">{activity.error}</p>}</article>
    <QuickLogBanner facilityId={facility.id} />
  </section>;
}
