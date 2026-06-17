import Link from "next/link";
import { getOfferDisplayStatus, getOffers } from "@/lib/actions/offers";
import { formatSar } from "@/lib/data/store";
import { contacts, facilities, profiles } from "@/lib/data/mock";
import { offerStatusLabels } from "@/lib/i18n";

export default async function OffersPage({ searchParams }: { searchParams?: { status?: string; ownerId?: string } }) {
  const rows = await getOffers({ status: (searchParams?.status as never) ?? "all", ownerId: searchParams?.ownerId });
  const total = rows.reduce((sum, offer) => sum + offer.total, 0);
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-nebras-green">العروض</h1>
        <p className="rounded-lg border border-nebras-line bg-white px-4 py-2 font-bold">{formatSar(total)}</p>
      </div>
      <form className="flex flex-wrap gap-2 rounded-lg border border-nebras-line bg-white p-3">
        <select name="status" defaultValue={searchParams?.status ?? "all"} className="rounded-md border border-nebras-line px-3 py-2">
          <option value="all">كل الحالات</option><option value="draft">مسودة</option><option value="sent">مرسل</option><option value="expired">منتهي الصلاحية</option><option value="accepted">مقبول</option>
        </select>
        <select name="ownerId" defaultValue={searchParams?.ownerId ?? ""} className="rounded-md border border-nebras-line px-3 py-2">
          <option value="">كل المندوبين</option>
          {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
        </select>
        <button className="rounded-md bg-nebras-green px-4 py-2 text-white">تصفية</button>
      </form>
      <div className="overflow-hidden rounded-lg border border-nebras-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-nebras-cream text-nebras-green"><tr><th className="p-3 text-right">العرض</th><th className="p-3 text-right">المنشأة</th><th className="p-3 text-right">جهة الاتصال</th><th className="p-3 text-right">القيمة</th><th className="p-3 text-right">الحالة</th></tr></thead>
          <tbody>
            {rows.map((offer) => (
              <tr key={offer.id} className="border-t border-nebras-line">
                <td className="p-3"><Link href={`/dashboard/offers/${offer.id}/print`}>{offer.title ?? offer.id}</Link></td>
                <td className="p-3">{facilities.find((facility) => facility.id === offer.facilityId)?.name}</td>
                <td className="p-3">{contacts.find((contact) => contact.id === offer.contactId)?.name ?? "-"}</td>
                <td className="p-3">{formatSar(offer.total)}</td>
                <td className="p-3">{offerStatusLabels[getOfferDisplayStatus(offer)]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
