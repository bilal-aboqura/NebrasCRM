/**
 * validator.ts - Facility row validator for bulk import (Feature 011)
 *
 * Validates parsed facility rows against business rules:
 * - Required fields
 * - Phone number format (Saudi)
 * - Duplicate detection (in-file and against existing DB records)
 */

import { normalizeSaudiPhone } from "@/lib/utils/phone";
import type { ParsedFacilityRow } from "./parser";

export type RowStatus = "valid" | "error" | "duplicate";

export interface ValidatedRow {
  index: number;
  status: RowStatus;
  data: {
    name: string;
    type: string;
    city: string;
    region: string;
    primary_phone: string;
    secondary_phone?: string | null;
    lead_source: string;
    notes?: string;
  };
  errors: string[];
}

export interface ValidationSummary {
  total: number;
  valid: number;
  errors: number;
  duplicates: number;
}

/**
 * Saudi phone format validation:
 * Must be a normalized string starting with +966 and 12 digits total.
 */
function isValidSaudiPhone(phone: string): boolean {
  if (!phone) return false;
  try {
    const normalized = normalizeSaudiPhone(phone);
    return /^\+9665\d{8}$/.test(normalized);
  } catch {
    return false;
  }
}

/**
 * Validate an array of parsed facility rows.
 *
 * @param rows           Parsed rows from the spreadsheet
 * @param existingPhones Set of existing primary_phone values already in the DB (for this company)
 */
export function validateFacilityRows(
  rows: ParsedFacilityRow[],
  existingPhones: Set<string>
): { validatedRows: ValidatedRow[]; summary: ValidationSummary } {
  const seenPhonesInFile = new Set<string>();

  const validatedRows: ValidatedRow[] = rows.map((row) => {
    const errors: string[] = [];

    // Required: name
    if (!row.name || row.name.trim() === "") {
      errors.push("اسم المنشأة مطلوب ولا يمكن تركه فارغاً");
    }

    // Required: type
    if (!row.type || row.type.trim() === "") {
      errors.push("نوع المنشأة مطلوب ولا يمكن تركه فارغاً");
    }

    // Required: city
    if (!row.city || row.city.trim() === "") {
      errors.push("المدينة مطلوبة ولا يمكن تركها فارغة");
    }

    // Required: region
    if (!row.region || row.region.trim() === "") {
      errors.push("المنطقة مطلوبة ولا يمكن تركها فارغة");
    }

    // Required: primary phone + format check
    let normalizedPhone = "";
    if (!row.primaryPhone || row.primaryPhone.trim() === "") {
      errors.push("الهاتف الرئيسي مطلوب ولا يمكن تركه فارغاً");
    } else if (!isValidSaudiPhone(row.primaryPhone)) {
      errors.push("رقم الهاتف الرئيسي غير صحيح (يجب أن يكون رقماً سعودياً صالحاً)");
    } else {
      normalizedPhone = normalizeSaudiPhone(row.primaryPhone);
    }

    if (errors.length > 0) {
      return {
        index: row.index,
        status: "error",
        data: {
          name: row.name ?? "",
          type: row.type ?? "",
          city: row.city ?? "",
          region: row.region ?? "",
          primary_phone: row.primaryPhone ?? "",
          secondary_phone: row.secondaryPhone || null,
          lead_source: row.leadSource || "imported",
          notes: row.notes
        },
        errors
      };
    }

    // Duplicate check: already in the database
    if (existingPhones.has(normalizedPhone)) {
      return {
        index: row.index,
        status: "duplicate",
        data: {
          name: row.name,
          type: row.type,
          city: row.city,
          region: row.region,
          primary_phone: normalizedPhone,
          secondary_phone: row.secondaryPhone || null,
          lead_source: row.leadSource || "imported",
          notes: row.notes
        },
        errors: ["رقم الهاتف الرئيسي مستخدم بالفعل في منشأة أخرى للشركة"]
      };
    }

    // Duplicate check: already seen in this file
    if (seenPhonesInFile.has(normalizedPhone)) {
      return {
        index: row.index,
        status: "duplicate",
        data: {
          name: row.name,
          type: row.type,
          city: row.city,
          region: row.region,
          primary_phone: normalizedPhone,
          secondary_phone: row.secondaryPhone || null,
          lead_source: row.leadSource || "imported",
          notes: row.notes
        },
        errors: ["رقم الهاتف الرئيسي مكرر داخل الملف"]
      };
    }

    seenPhonesInFile.add(normalizedPhone);

    return {
      index: row.index,
      status: "valid",
      data: {
        name: row.name,
        type: row.type,
        city: row.city,
        region: row.region,
        primary_phone: normalizedPhone,
        secondary_phone: row.secondaryPhone ? normalizeSaudiPhone(row.secondaryPhone) : null,
        lead_source: row.leadSource || "imported",
        notes: row.notes
      },
      errors: []
    };
  });

  const summary: ValidationSummary = {
    total: validatedRows.length,
    valid: validatedRows.filter((r) => r.status === "valid").length,
    errors: validatedRows.filter((r) => r.status === "error").length,
    duplicates: validatedRows.filter((r) => r.status === "duplicate").length
  };

  return { validatedRows, summary };
}
