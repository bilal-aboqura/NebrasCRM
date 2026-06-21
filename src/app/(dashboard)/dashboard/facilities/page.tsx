import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { FacilityForm } from "@/components/facilities/FacilityForm";
import { getFacilitiesList, getFacilityOptions, type FacilityStatus, type FacilityType } from "@/lib/actions/facilities";
import { FacilitiesClient, type FacilityListRecord } from "./FacilitiesClient";
import { ImportModal } from "./components/ImportModal";
import { ExportButton } from "./components/ExportButton";

const statusLabels: Record<string, string> = { new: "جديد", contacted: "تم التواصل", interested: "مهتم", offer: "عرض", negotiation: "تفاوض", contract: "عقد", lost: "مفقود" };
const typeLabels: Record<string, string> = { medical_complex: "مجمع طبي", dental_complex: "مجمع أسنان", lab: "مختبر", radiology: "مركز أشعة", hospital: "مستشفى" };
const control = "rounded-xl border border-slate-200 bg-white px-3 py-2";

export default async function FacilitiesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const param = (key: string) => typeof searchParams[key] === "string" ? searchParams[key] as string : "";
  const page = Number(param("page")) || 1;
  const showArchived = param("archived") === "1";
  const [result, options] = await Promise.all([
    getFacilitiesList({ page, search: param("search"), status: param("status") as FacilityStatus, type: param("type") as FacilityType, region_id: param("region"), city_id: param("city"), assigned_to: param("owner"), show_archived: showArchived }),
    getFacilityOptions(),
  ]);
  const records = result.success ? result.data.records : [];
  const meta = result.success ? result.data.meta : { page: 1, pages: 1, total: 0 };
  const queryFor = (nextPage: number) => {
    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => { if (typeof value === "string" && key !== "page") query.set(key, value); });
    query.set("page", String(nextPage));
    return query.toString();
  };
  const cities = options.cities.filter((city) => !param("region") || city.region_id === param("region"));

  return <section className="space-y-6" dir="rtl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-bold text-nebras-gold">إدارة العملاء</p><h1 className="text-3xl font-extrabold text-nebras-green">قائمة المنشآت</h1><p className="mt-2 text-slate-600">{meta.total} منشأة ضمن النطاق المسموح لك</p></div><div className="flex flex-wrap gap-2"><ExportButton endpoint="/api/facilities/export" params={searchParams} />{options.canAssign && <ImportModal />}<FacilityForm {...options} /></div></div>
    <form className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <label className="relative sm:col-span-2"><span className="sr-only">بحث</span><Search className="absolute right-3 top-3 text-slate-400" size={18} /><input name="search" defaultValue={param("search")} placeholder="بحث بالاسم أو الهاتف" className={`${control} w-full pr-10`} /></label>
      <select name="status" defaultValue={param("status")} className={control} aria-label="الحالة"><option value="">كل الحالات</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select name="type" defaultValue={param("type")} className={control} aria-label="النوع"><option value="">كل الأنواع</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select name="region" defaultValue={param("region")} className={control} aria-label="المنطقة"><option value="">كل المناطق</option>{options.regions.map((region) => <option key={region.id} value={region.id}>{region.name_ar}</option>)}</select>
      <select name="city" defaultValue={param("city")} className={control} aria-label="المدينة"><option value="">كل المدن</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name_ar}</option>)}</select>
      {options.canAssign && <select name="owner" defaultValue={param("owner")} className={control} aria-label="المسؤول"><option value="">كل المسؤولين</option>{options.owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.display_name}{owner.status !== "active" ? " (غير نشط)" : ""}</option>)}</select>}
      {options.canAssign && <label className="flex items-center gap-2 rounded-xl border px-3"><input type="checkbox" name="archived" value="1" defaultChecked={showArchived} />عرض المؤرشف</label>}
      <button className="rounded-xl bg-nebras-green px-4 py-2 font-bold text-white">تطبيق</button>
    </form>
    {!result.success && <p className="rounded-xl bg-red-50 p-4 text-red-700">{result.error}</p>}
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[850px] text-right"><thead className="bg-nebras-green text-white"><tr><th className="p-4">المنشأة</th><th className="p-4">النوع</th><th className="p-4">المدينة</th><th className="p-4">الهاتف</th><th className="p-4">المسؤول</th><th className="p-4">الحالة</th></tr></thead><FacilitiesClient records={records as FacilityListRecord[]} typeLabels={typeLabels} statusLabels={statusLabels} /></table></div>
    <nav className="flex items-center justify-center gap-4" aria-label="صفحات المنشآت"><Link aria-disabled={meta.page <= 1} href={`?${queryFor(Math.max(1, meta.page - 1))}`} className={`rounded-lg border p-2 ${meta.page <= 1 ? "pointer-events-none opacity-40" : ""}`}><ChevronRight /></Link><span>صفحة {meta.page} من {meta.pages}</span><Link aria-disabled={meta.page >= meta.pages} href={`?${queryFor(Math.min(meta.pages, meta.page + 1))}`} className={`rounded-lg border p-2 ${meta.page >= meta.pages ? "pointer-events-none opacity-40" : ""}`}><ChevronLeft /></Link></nav>
  </section>;
}
