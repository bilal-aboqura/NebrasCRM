import { getAuthContext } from "@/lib/auth/context";
import { db, formatSar } from "@/lib/data/store";

export default async function DashboardHomePage() {
  const context = await getAuthContext();
  const companyFacilities = db.facilities.filter((facility) => context.role === "super_admin" || facility.companyId === context.activeCompany.id);
  const activeFacilities = companyFacilities.filter((facility) => !facility.isArchived);
  const totalOffers = db.offers.filter((offer) => activeFacilities.some((facility) => facility.id === offer.facilityId)).reduce((sum, offer) => sum + offer.total, 0);
  const totalContracts = db.contracts.filter((contract) => activeFacilities.some((facility) => facility.id === contract.facilityId)).reduce((sum, contract) => sum + contract.value, 0);

  const cards = [
    ["المنشآت النشطة", activeFacilities.length.toString()],
    ["المتابعات المفتوحة", db.followUps.filter((item) => item.status === "pending").length.toString()],
    ["قيمة العروض", formatSar(totalOffers)],
    ["قيمة العقود", formatSar(totalContracts)]
  ];

  return (
    <section>
      <h1 className="text-2xl font-bold text-nebras-green">لوحة التحكم</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-lg border border-nebras-line bg-white p-5">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-2 text-2xl font-bold text-nebras-green">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
