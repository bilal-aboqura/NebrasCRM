import FacilitiesClient from "@/app/(dashboard)/dashboard/facilities/FacilitiesClient";
import FacilityForm from "@/components/facilities/FacilityForm";
import { getFacilitiesList } from "@/lib/actions/facilities";

export default async function FacilitiesPage() {
  const { rows } = await getFacilitiesList({ pageSize: 100 });
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-nebras-green">المنشآت</h1>
      </div>
      <FacilityForm />
      <FacilitiesClient facilities={rows} />
    </section>
  );
}
