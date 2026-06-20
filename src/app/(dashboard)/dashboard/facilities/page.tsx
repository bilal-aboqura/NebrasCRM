import FacilitiesClient from "@/app/(dashboard)/dashboard/facilities/FacilitiesClient";
import FacilitiesToolbar from "@/app/(dashboard)/dashboard/facilities/components/FacilitiesToolbar";
import FacilityForm from "@/components/facilities/FacilityForm";
import { getFacilitiesList } from "@/lib/actions/facilities";
import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";

export default async function FacilitiesPage() {
  const { rows } = await getFacilitiesList({ pageSize: 100 });
  const { role } = await getAuthContext();
  const canImport = canManageCompanyWide(role);
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-nebras-green">المنشآت</h1>
        <FacilitiesToolbar canImport={canImport} />
      </div>
      <FacilityForm />
      <FacilitiesClient facilities={rows} />
    </section>
  );
}
