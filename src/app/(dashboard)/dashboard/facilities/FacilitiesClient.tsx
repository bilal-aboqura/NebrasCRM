"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export type FacilityListRecord = {
  id: string;
  name_ar: string;
  type: string;
  primary_phone: string;
  status: string;
  is_active: boolean;
  city_custom: string | null;
  regions: unknown;
  cities: unknown;
  owner: unknown;
};

export function FacilitiesClient({ records, typeLabels, statusLabels }: {
  records: FacilityListRecord[];
  typeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
}) {
  const router = useRouter();
  const open = (id: string) => router.push(`/dashboard/facilities/${id}`);

  return <tbody>{records.map((facility) => {
    const region = facility.regions as { name_ar?: string } | null;
    const city = facility.cities as { name_ar?: string } | null;
    const owner = facility.owner as { display_name?: string; status?: string } | null;
    return <tr
      key={facility.id}
      tabIndex={0}
      aria-label={`فتح ملف ${facility.name_ar}`}
      onClick={() => open(facility.id)}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(facility.id); } }}
      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-slate-50 focus:bg-amber-50 focus:outline-none"
    >
      <td className="p-4"><Link href={`/dashboard/facilities/${facility.id}`} onClick={(event) => event.stopPropagation()} className="font-bold text-nebras-green hover:underline">{facility.name_ar}</Link>{!facility.is_active && <span className="mr-2 rounded-full bg-slate-200 px-2 py-1 text-xs">مؤرشف</span>}</td>
      <td className="p-4">{typeLabels[facility.type]}</td>
      <td className="p-4">{facility.city_custom || city?.name_ar}<small className="block text-slate-400">{region?.name_ar}</small></td>
      <td className="p-4" dir="ltr">{facility.primary_phone}</td>
      <td className="p-4">{owner?.display_name ?? "غير مسندة"}{owner?.status === "inactive" && <small className="block text-amber-700">المسؤول غير نشط</small>}</td>
      <td className="p-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800">{statusLabels[facility.status]}</span></td>
    </tr>;
  })}{!records.length && <tr><td colSpan={6} className="p-10 text-center text-slate-500">لا توجد منشآت مطابقة.</td></tr>}</tbody>;
}
