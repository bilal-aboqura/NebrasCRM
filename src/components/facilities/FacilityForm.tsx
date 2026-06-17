"use client";

import type { Facility } from "@/lib/types/domain";

export default function FacilityForm({ facility }: { facility?: Facility }) {
  return (
    <form className="grid gap-3 rounded-lg border border-nebras-line bg-white p-4 md:grid-cols-2">
      <input defaultValue={facility?.name} placeholder="اسم المنشأة" className="rounded-md border border-nebras-line px-3 py-2" />
      <input defaultValue={facility?.type} placeholder="النوع" className="rounded-md border border-nebras-line px-3 py-2" />
      <select defaultValue={facility?.region ?? "منطقة الرياض"} className="rounded-md border border-nebras-line px-3 py-2">
        <option>منطقة الرياض</option>
        <option>منطقة مكة</option>
        <option>أخرى</option>
      </select>
      <input defaultValue={facility?.city} placeholder="المدينة" className="rounded-md border border-nebras-line px-3 py-2" />
      <input defaultValue={facility?.primaryPhone} placeholder="رقم الهاتف" className="rounded-md border border-nebras-line px-3 py-2 text-left" />
      <button type="button" className="rounded-md bg-nebras-green px-4 py-2 font-semibold text-white">حفظ</button>
    </form>
  );
}
