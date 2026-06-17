"use client";

import { useRouter } from "next/navigation";
import type { Facility } from "@/lib/types/domain";
import { facilityStatusLabels } from "@/lib/i18n";

export default function FacilitiesClient({ facilities }: { facilities: Facility[] }) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-lg border border-nebras-line bg-white">
      <table className="w-full text-sm">
        <thead className="bg-nebras-cream text-nebras-green">
          <tr><th className="p-3 text-right">المنشأة</th><th className="p-3 text-right">المدينة</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الهاتف</th></tr>
        </thead>
        <tbody>
          {facilities.map((facility) => (
            <tr key={facility.id} onClick={() => router.push(`/dashboard/facilities/${facility.id}`)} className="cursor-pointer border-t border-nebras-line hover:bg-nebras-cream">
              <td className="p-3 font-medium">{facility.name}</td>
              <td className="p-3">{facility.city}</td>
              <td className="p-3">{facilityStatusLabels[facility.status]}</td>
              <td className="p-3 text-left">{facility.primaryPhone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
