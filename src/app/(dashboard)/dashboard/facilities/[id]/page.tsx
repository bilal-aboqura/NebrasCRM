import ActivityTimeline from "@/components/facilities/ActivityTimeline";
import CallLogsSection from "@/components/facilities/CallLogsSection";
import ContactsSection from "@/components/facilities/ContactsSection";
import ContractsSection from "@/components/facilities/ContractsSection";
import FacilityForm from "@/components/facilities/FacilityForm";
import SelfAssessmentHistory from "@/components/facilities/SelfAssessmentHistory";
import LogCommunicationModal from "@/components/facilities/LogCommunicationModal";
import OffersSection from "@/components/facilities/OffersSection";
import QuickLogBanner from "@/components/facilities/QuickLogBanner";
import { getCallLogs } from "@/lib/actions/call-logs";
import { getContracts } from "@/lib/actions/contracts";
import { getFacilityActivity, getFacilityDetail } from "@/lib/actions/facilities";
import { getOffers } from "@/lib/actions/offers";
import { contacts } from "@/lib/data/mock";
import { toWaMe } from "@/lib/utils/phone";

export default async function FacilityDetailPage({ params }: { params: { id: string } }) {
  const facility = await getFacilityDetail(params.id);
  const [activity, logs, offers, contracts] = await Promise.all([
    getFacilityActivity(params.id),
    getCallLogs(params.id),
    getOffers({ facilityId: params.id }),
    getContracts({ facilityId: params.id })
  ]);
  const facilityContacts = contacts.filter((contact) => contact.facilityId === params.id);

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-nebras-line bg-white p-5">
        <h1 className="text-2xl font-bold text-nebras-green">{facility.name}</h1>
        <p className="mt-1 text-sm text-slate-600">{facility.type} · {facility.city} · {facility.region}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a className="rounded-md border border-nebras-line px-3 py-2" href={`tel:${facility.primaryPhone}`}>اتصال</a>
          <a className="rounded-md border border-nebras-line px-3 py-2" href={toWaMe(facility.primaryPhone, `مرحبا ${facility.name}`)}>واتساب</a>
        </div>
      </div>
      <FacilityForm facility={facility} />
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 px-1">سجل التقييم الذاتي (CBAHI)</h2>
        <SelfAssessmentHistory facilityId={facility.id} />
      </div>
      <ContactsSection contacts={facilityContacts} />
      <LogCommunicationModal />
      <CallLogsSection logs={logs} />
      <OffersSection offers={offers} />
      <ContractsSection contracts={contracts} />
      <ActivityTimeline activities={activity} />
      <QuickLogBanner />
    </section>
  );
}
