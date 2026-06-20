"use server";

import { headers } from "next/headers";
import { isRateLimited } from "@/lib/rate-limit/memory";
import { db } from "@/lib/data/store";
import { normalizeSaudiPhone } from "@/lib/utils/phone";
import crypto from "crypto";
import type { Facility, Activity } from "@/lib/types/domain";

export interface LeadSubmissionPayload {
  facilityName: string;
  city: string;
  phone: string;
  facilityType: string;
}

export interface LeadSubmissionResponse {
  success: boolean;
  duplicate?: boolean;
  rateLimited?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

function sanitizeString(input: string, maxLength: number): string {
  if (!input) return "";
  const clean = input.trim().replace(/<[^>]*>?/gm, "");
  return clean.slice(0, maxLength);
}

export async function submitLeadAction(payload: LeadSubmissionPayload): Promise<LeadSubmissionResponse> {
  try {
    // 1. Rate Limiting
    const headersList = headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "127.0.0.1";
    
    if (isRateLimited(ip)) {
      return {
        success: false,
        rateLimited: true,
        message: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً"
      };
    }

    // 2. Validation & Sanitization
    const errors: Record<string, string[]> = {};
    const cleanName = sanitizeString(payload.facilityName, 200);
    const cleanCity = sanitizeString(payload.city, 100);
    const cleanType = sanitizeString(payload.facilityType, 50);
    const cleanPhone = payload.phone?.trim() || "";

    if (!cleanName) errors.facilityName = ["اسم المنشأة مطلوب ولا يمكن تركه فارغاً"];
    if (!cleanCity) errors.city = ["المدينة مطلوبة"];
    
    const validTypes = ["مجمع طبي", "مجمع لطب الأسنان", "مختبر", "مركز أشعة", "مستشفى"];
    if (!cleanType || !validTypes.includes(cleanType)) {
      errors.facilityType = ["الرجاء اختيار نوع صحيح للمنشأة"];
    }

    let normalizedPhone = "";
    try {
      if (!cleanPhone) throw new Error("Empty phone");
      normalizedPhone = normalizeSaudiPhone(cleanPhone);
    } catch {
      errors.phone = ["رقم الجوال المدخل غير صحيح. يجب أن يكون رقماً سعودياً صالحاً"];
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const companyId = process.env.DEFAULT_LEAD_COMPANY_ID || "company-a";

    // 3. Duplicate Check
    const existingFacility = db.facilities.find(f => f.primaryPhone === normalizedPhone);

    if (existingFacility) {
      if (!existingFacility.isArchived) {
        // Duplicate Active
        return {
          success: true,
          duplicate: true,
          message: "تم تسجيل طلبك مسبقاً، سيتواصل معك فريقنا قريباً"
        };
      } else {
        // Reactivate Archived
        const oldNotes = existingFacility.notes || "";
        const cityNote = `المدينة المدخلة: ${cleanCity}`;
        existingFacility.isArchived = false;
        existingFacility.name = cleanName;
        existingFacility.type = cleanType;
        existingFacility.status = "new";
        existingFacility.ownerId = null;
        existingFacility.notes = oldNotes ? `${cityNote}\n${oldNotes}` : cityNote;
        existingFacility.updatedAt = new Date().toISOString();

        const activity: Activity = {
          id: `act-${crypto.randomUUID()}`,
          companyId: existingFacility.companyId,
          facilityId: existingFacility.id,
          kind: "facility_reactivated",
          eventType: "recovered",
          message: "تم إعادة تفعيل المنشأة وتحديث البيانات عبر نموذج الموقع",
          createdAt: new Date().toISOString(),
        };
        db.activities.push(activity);

        return {
          success: true,
          message: "تم استلام طلبك بنجاح، سيتواصل معك فريق نبراس الجودة قريباً"
        };
      }
    }

    // 4. Create New Lead
    const newFacility: Facility = {
      id: `fac-${crypto.randomUUID()}`,
      companyId,
      name: cleanName,
      type: cleanType,
      city: "Unspecified",
      region: "Unspecified",
      primaryPhone: normalizedPhone,
      ownerId: null,
      status: "new",
      isArchived: false,
      lead_source: "website_form",
      notes: `المدينة المدخلة: ${cleanCity}`,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.facilities.push(newFacility);

    const activity: Activity = {
      id: `act-${crypto.randomUUID()}`,
      companyId,
      facilityId: newFacility.id,
      kind: "facility_created",
      eventType: "created",
      message: "تم إنشاء المنشأة عبر نموذج الموقع",
      createdAt: new Date().toISOString(),
    };
    db.activities.push(activity);

    return {
      success: true,
      message: "تم استلام طلبك بنجاح، سيتواصل معك فريق نبراس الجودة قريباً"
    };

  } catch (error) {
    console.error("Lead submission error:", error);
    return {
      success: false,
      message: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً."
    };
  }
}
