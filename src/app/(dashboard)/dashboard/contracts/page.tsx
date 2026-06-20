import { getContracts, getContractDisplayStatus } from "@/lib/actions/contracts";
import { facilities, profiles } from "@/lib/data/mock";
import { formatSar } from "@/lib/data/store";
import { contractStatusLabels } from "@/lib/i18n";
import ExportButton from "@/app/(dashboard)/dashboard/facilities/components/ExportButton";

export default async function ContractsPage({ searchParams }: { searchParams?: { status?: string; ownerId?: string } }) {
  const rows = await getContracts({ status: (searchParams?.status as never) ?? "all", ownerId: searchParams?.ownerId });
  const total = rows.reduce((sum, contract) => sum + contract.value, 0);
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-nebras-green">العقود</h1>
        <div className="flex items-center gap-2">
          <p className="rounded-lg border border-nebras-line bg-white px-4 py-2 font-bold">{formatSar(total)}</p>
          <ExportButton exportUrl="/api/contracts/export" label="تصدير Excel" />
        </div>
      </div>
      <form className="flex flex-wrap gap-2 rounded-lg border border-nebras-line bg-white p-3">
        <select name="status" defaultValue={searchParams?.status ?? "all"} className="rounded-md border border-nebras-line px-3 py-2"><option value="all">كل الحالات</option><option value="draft">مسودة</option><option value="active">نشط</option><option value="completed">مكتمل</option></select>
        <select name="ownerId" defaultValue={searchParams?.ownerId ?? ""} className="rounded-md border border-nebras-line px-3 py-2"><option value="">كل المندوبين</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}</select>
        <button className="rounded-md bg-nebras-green px-4 py-2 text-white">تصفية</button>
      </form>
      <div className="overflow-hidden rounded-lg border border-nebras-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-nebras-cream text-nebras-green"><tr><th className="p-3 text-right">المرجع</th><th className="p-3 text-right">المنشأة</th><th className="p-3 text-right">القيمة</th><th className="p-3 text-right">الحالة</th></tr></thead>
          <tbody>{rows.map((contract) => <tr key={contract.id} className="border-t border-nebras-line"><td className="p-3">{contract.referenceNumber}</td><td className="p-3">{facilities.find((facility) => facility.id === contract.facilityId)?.name}</td><td className="p-3">{formatSar(contract.value)}</td><td className="p-3">{contractStatusLabels[getContractDisplayStatus(contract)]}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
