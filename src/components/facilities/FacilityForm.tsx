"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createFacility, reassignFacility, updateFacility, type CreateFacilityInput, type FacilityStatus } from "@/lib/actions/facilities";
import { FACILITY_STATUS_LABELS, FACILITY_TYPE_LABELS } from "@/lib/utils/facilities";

type Region = { id: string; name_ar: string };
type City = { id: string; region_id: string; name_ar: string; name_en: string };
type Owner = { id: string; display_name: string; status: string };
type FacilityDefaults = Partial<CreateFacilityInput> & { id: string; status?: FacilityStatus };

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-nebras-gold";

export function FacilityForm({ regions, cities, owners, canAssign, currentUserId, facility }: {
  regions: Region[];
  cities: City[];
  owners: Owner[];
  canAssign: boolean;
  currentUserId: string;
  facility?: FacilityDefaults;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [cityId, setCityId] = useState(facility?.city_id ?? "");

  const regionNames = useMemo(() => new Map(regions.map((region) => [region.id, region.name_ar])), [regions]);
  const cityNameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    cities
      .filter((city) => city.name_en !== "Other")
      .forEach((city) => counts.set(city.name_ar, (counts.get(city.name_ar) ?? 0) + 1));
    return counts;
  }, [cities]);

  const availableCities = useMemo(
    () => cities.filter((city) => city.name_en !== "Other" || city.id === cityId),
    [cities, cityId],
  );
  const selectedCity = cities.find((city) => city.id === cityId);

  function cityLabel(city: City) {
    const duplicate = (cityNameCounts.get(city.name_ar) ?? 0) > 1;
    const region = regionNames.get(city.region_id);
    return duplicate && region ? `${city.name_ar} - ${region}` : city.name_ar;
  }

  function submit(formData: FormData) {
    const input: CreateFacilityInput & { status?: FacilityStatus } = {
      name_ar: String(formData.get("name_ar") ?? ""),
      type: String(formData.get("type")) as CreateFacilityInput["type"],
      city_id: String(formData.get("city_id") ?? ""),
      city_custom: String(formData.get("city_custom") ?? ""),
      primary_phone: String(formData.get("primary_phone") ?? ""),
      secondary_phone: String(formData.get("secondary_phone") ?? ""),
      lead_source: String(formData.get("lead_source")) as CreateFacilityInput["lead_source"],
      assigned_to: canAssign ? String(formData.get("assigned_to") ?? "") || null : currentUserId,
      notes: String(formData.get("notes") ?? ""),
      status: String(formData.get("status") ?? "new") as FacilityStatus,
    };

    startTransition(async () => {
      let result;
      if (facility) {
        const { assigned_to, ...facilityChanges } = input;
        result = await updateFacility(facility.id, facilityChanges);
        if (result.success && canAssign && assigned_to !== facility.assigned_to) {
          result = await reassignFacility(facility.id, assigned_to || null);
        }
      } else {
        result = await createFacility(input);
      }

      if (!result.success) return setError(result.error);
      setError("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-nebras-green px-5 py-3 font-bold text-white shadow-sm">
        {facility ? "تعديل المنشأة" : "إضافة منشأة جديدة"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={facility ? "تعديل المنشأة" : "إضافة منشأة جديدة"}
        >
          <form action={submit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-slate-50 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-nebras-green">
                {facility ? "تعديل بيانات المنشأة" : "إضافة منشأة جديدة"}
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق">
                <X />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                اسم المنشأة بالعربية
                <input name="name_ar" required minLength={2} defaultValue={facility?.name_ar ?? ""} className={fieldClass} />
              </label>

              <label>
                نوع المنشأة
                <select name="type" defaultValue={facility?.type ?? "medical_complex"} className={fieldClass}>
                  {Object.entries(FACILITY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label>
                مصدر العميل
                <select name="lead_source" defaultValue={facility?.lead_source ?? "manual"} className={fieldClass}>
                  <option value="manual">إضافة يدوية</option>
                  <option value="website_form">نموذج الموقع</option>
                  <option value="imported">مستورد</option>
                </select>
              </label>

              <label className="md:col-span-2">
                المدينة
                <select name="city_id" required value={cityId} onChange={(event) => setCityId(event.target.value)} className={fieldClass}>
                  <option value="">اختر المدينة</option>
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.id}>{cityLabel(city)}</option>
                  ))}
                </select>
              </label>

              {selectedCity?.name_en === "Other" && (
                <label className="md:col-span-2">
                  اسم المدينة
                  <input name="city_custom" required defaultValue={facility?.city_custom ?? ""} className={fieldClass} />
                </label>
              )}

              <label>
                الهاتف الرئيسي
                <input name="primary_phone" required dir="ltr" defaultValue={facility?.primary_phone ?? ""} className={fieldClass} />
              </label>

              <label>
                الهاتف الثانوي
                <input name="secondary_phone" dir="ltr" defaultValue={facility?.secondary_phone ?? ""} className={fieldClass} />
              </label>

              {facility && (
                <label>
                  الحالة
                  <select name="status" defaultValue={facility.status ?? "new"} className={fieldClass}>
                    {Object.entries(FACILITY_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              )}

              {canAssign ? (
                <label>
                  مسؤول المبيعات
                  <select name="assigned_to" defaultValue={facility?.assigned_to ?? ""} className={fieldClass}>
                    <option value="">غير مسندة</option>
                    {owners.filter((owner) => owner.status === "active").map((owner) => (
                      <option key={owner.id} value={owner.id}>{owner.display_name}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <input type="hidden" name="assigned_to" value={currentUserId} />
              )}

              <label className="md:col-span-2">
                ملاحظات
                <textarea name="notes" rows={4} defaultValue={facility?.notes ?? ""} className={fieldClass} />
              </label>
            </div>

            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button disabled={pending} className="rounded-xl bg-nebras-green px-6 py-3 font-bold text-white disabled:opacity-60">
                {pending ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-6 py-3">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
