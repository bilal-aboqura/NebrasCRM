import { resolveFacilityStatus, resolveFacilityType } from "@/lib/utils/facilities";
import { isValidSaudiPhone, normalizePhone } from "@/lib/utils/phone";
import type { RawFacilityImportRow } from "./parser";

export type ImportRowStatus = "valid" | "error" | "duplicate";
export type ImportFacilityType = "medical_complex" | "dental_complex" | "lab" | "radiology" | "hospital";
export type ImportFacilityStage = "new" | "contacted" | "interested" | "offer" | "negotiation" | "contract" | "lost";

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
  status: ImportFacilityStage;
  notes: string | null;
}

export interface ValidatedImportRow {
  index: number;
  status: ImportRowStatus;
  data: ValidatedImportData;
  errors: string[];
}

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function splitCityLabel(cityLabel: string, knownRegions: Set<string>) {
  const normalized = normalizeLabel(cityLabel);
  const separator = " - ";
  const separatorIndex = normalized.lastIndexOf(separator);
  if (separatorIndex < 0) return { cityName: normalized, regionName: "" };

  const cityName = normalizeLabel(normalized.slice(0, separatorIndex));
  const regionName = normalizeLabel(normalized.slice(separatorIndex + separator.length));
  if (!cityName || !knownRegions.has(regionName)) {
    return { cityName: normalized, regionName: "" };
  }
  return { cityName, regionName };
}

export function validateFacilityImportRows(
  rows: RawFacilityImportRow[],
  geography: { regions: GeographyOption[]; cities: GeographyOption[] },
  existingPhones: Iterable<string> = [],
): ValidatedImportRow[] {
  const knownPhones = new Set(Array.from(existingPhones, normalizePhone));
  const seenPhones = new Set<string>();
  const regions = new Map(geography.regions.map((region) => [normalizeLabel(region.name_ar), region]));
  const knownRegionNames = new Set(regions.keys());
  const regionNamesById = new Map(geography.regions.map((region) => [region.id, normalizeLabel(region.name_ar)]));
  const citiesByName = new Map<string, GeographyOption[]>();

  geography.cities
    .filter((city) => city.name_en !== "Other")
    .forEach((city) => {
      const key = normalizeLabel(city.name_ar);
      const current = citiesByName.get(key) ?? [];
      current.push(city);
      citiesByName.set(key, current);
    });

  return rows.map((row, offset) => {
    const errors: string[] = [];
    const normalizedPrimary = normalizePhone(row.primaryPhone);
    const normalizedSecondary = row.secondaryPhone ? normalizePhone(row.secondaryPhone) : "";
    const type = resolveFacilityType(row.type.trim()) as ImportFacilityType | "";
    const stage = resolveFacilityStatus(row.status) as ImportFacilityStage | "";
    const splitLabel = splitCityLabel(row.city, knownRegionNames);
    const cityName = splitLabel.cityName;
    const regionName = normalizeLabel(row.region) || splitLabel.regionName;
    const requestedRegion = regionName ? regions.get(regionName) : undefined;

    let matchedCity: GeographyOption | undefined;
    const candidates = citiesByName.get(cityName) ?? [];
    if (!candidates.length) {
      errors.push("المدينة غير موجودة في النظام.");
    } else if (requestedRegion) {
      matchedCity = candidates.find((candidate) => candidate.region_id === requestedRegion.id);
      if (!matchedCity) {
        errors.push("المدينة غير موجودة أو لا تتبع المنطقة المحددة.");
      }
    } else if (regionName && !requestedRegion) {
      errors.push("المنطقة غير موجودة في النظام.");
    } else if (candidates.length > 1) {
      const candidateLabels = candidates.map((candidate) => regionNamesById.get(candidate.region_id ?? "")).filter(Boolean).join("، ");
      errors.push(`اسم المدينة مكرر في أكثر من منطقة. يرجى استخدام الاسم المعتمد فقط أو الملف الأحدث. المناطق المحتملة: ${candidateLabels}.`);
    } else {
      matchedCity = candidates[0];
    }

    if (row.name.trim().length < 2) errors.push("اسم المنشأة مطلوب ولا يمكن تركه فارغًا.");
    if (!type) errors.push("نوع المنشأة غير مدعوم.");
    if (row.status.trim() && !stage) errors.push("حالة المنشأة غير مدعومة.");
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
        region_id: matchedCity?.region_id ?? "",
        city_id: matchedCity?.id ?? "",
        city_custom: matchedCity?.name_en === "Other" ? row.city.trim() : null,
        primary_phone: normalizedPrimary,
        secondary_phone: normalizedSecondary || null,
        lead_source: "imported",
        status: stage || "new",
        notes: row.notes.trim() || null,
      },
      errors,
    };
  });
}
