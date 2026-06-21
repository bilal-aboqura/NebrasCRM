import { isValidSaudiPhone, normalizePhone } from "@/lib/utils/phone";
import type { RawFacilityImportRow } from "./parser";

export type ImportRowStatus = "valid" | "error" | "duplicate";
export type ImportFacilityType = "medical_complex" | "dental_complex" | "lab" | "radiology" | "hospital";

export interface GeographyOption {
  id: string;
  name_ar: string;
  region_id?: string;
  name_en?: string;
}

export interface ValidatedImportData {
  name_ar: string;
  type: ImportFacilityType | "";
  region_id: string;
  city_id: string;
  city_custom: string | null;
  primary_phone: string;
  secondary_phone: string | null;
  lead_source: "imported";
  notes: string | null;
}

export interface ValidatedImportRow {
  index: number;
  status: ImportRowStatus;
  data: ValidatedImportData;
  errors: string[];
}

const TYPE_MAP: Record<string, ImportFacilityType> = {
  "مجمع طبي": "medical_complex",
  "مجمع لطب الأسنان": "dental_complex",
  "مجمع أسنان": "dental_complex",
  "مختبر": "lab",
  "مركز أشعة": "radiology",
  "مستشفى": "hospital",
};

export function validateFacilityImportRows(
  rows: RawFacilityImportRow[],
  geography: { regions: GeographyOption[]; cities: GeographyOption[] },
  existingPhones: Iterable<string> = [],
): ValidatedImportRow[] {
  const knownPhones = new Set(Array.from(existingPhones, normalizePhone));
  const seenPhones = new Set<string>();
  const regions = new Map(geography.regions.map((region) => [region.name_ar.trim(), region]));

  return rows.map((row, offset) => {
    const errors: string[] = [];
    const normalizedPrimary = normalizePhone(row.primaryPhone);
    const normalizedSecondary = row.secondaryPhone ? normalizePhone(row.secondaryPhone) : "";
    const region = regions.get(row.region.trim());
    const city = geography.cities.find((candidate) =>
      candidate.region_id === region?.id && candidate.name_ar.trim() === row.city.trim(),
    );
    const type = TYPE_MAP[row.type.trim()] ?? "";

    if (row.name.trim().length < 2) errors.push("اسم المنشأة مطلوب ولا يمكن تركه فارغاً.");
    if (!type) errors.push("نوع المنشأة غير مدعوم.");
    if (!region) errors.push("المنطقة غير موجودة في النظام.");
    if (!city) errors.push("المدينة غير موجودة أو لا تتبع المنطقة المحددة.");
    if (!row.primaryPhone || !isValidSaudiPhone(row.primaryPhone)) errors.push("رقم الهاتف الرئيسي غير صالح.");
    if (row.secondaryPhone && !isValidSaudiPhone(row.secondaryPhone)) errors.push("رقم الهاتف الفرعي غير صالح.");

    let status: ImportRowStatus = errors.length ? "error" : "valid";
    if (!errors.length && (knownPhones.has(normalizedPrimary) || seenPhones.has(normalizedPrimary))) {
      status = "duplicate";
      errors.push("رقم الهاتف الرئيسي مستخدم بالفعل في منشأة أخرى للشركة أو مكرر داخل الملف.");
    }
    if (!errors.length) seenPhones.add(normalizedPrimary);

    return {
      index: offset + 1,
      status,
      data: {
        name_ar: row.name.trim(),
        type,
        region_id: region?.id ?? "",
        city_id: city?.id ?? "",
        city_custom: city?.name_en === "Other" ? row.city.trim() : null,
        primary_phone: normalizedPrimary,
        secondary_phone: normalizedSecondary || null,
        lead_source: "imported",
        notes: row.notes.trim() || null,
      },
      errors,
    };
  });
}

