"use client";

import React, { useState } from "react";
import { submitLeadAction, type LeadSubmissionPayload, type LeadSubmissionResponse } from "@/lib/actions/lead-capture";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function LeadCaptureForm() {
  const [formData, setFormData] = useState<LeadSubmissionPayload>({
    facilityName: "",
    city: "",
    phone: "",
    facilityType: "مجمع طبي",
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate">("idle");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalMessage, setGlobalMessage] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: [] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrors({});
    setGlobalMessage("");

    try {
      const response = await submitLeadAction(formData);

      if (!response.success) {
        setStatus("idle");
        if (response.rateLimited) {
          setGlobalMessage(response.message || "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً");
        } else if (response.errors) {
          setErrors(response.errors);
        } else {
          setGlobalMessage(response.message || "حدث خطأ غير متوقع.");
        }
        return;
      }

      if (response.duplicate) {
        setStatus("duplicate");
        setGlobalMessage(response.message || "تم تسجيل طلبك مسبقاً، سيتواصل معك فريقنا قريباً");
      } else {
        setStatus("success");
        setGlobalMessage(response.message || "تم استلام طلبك بنجاح، سيتواصل معك فريق نبراس الجودة قريباً");
        
        // Trigger GTM Event
        if (typeof window !== "undefined" && (window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: "lead_form_submitted",
            facilityType: formData.facilityType,
            submissionTimestamp: new Date().toISOString(),
          });
        }

        // Reset to idle after 8 seconds
        setTimeout(() => {
          setStatus("idle");
          setFormData({ facilityName: "", city: "", phone: "", facilityType: "مجمع طبي" });
          setGlobalMessage("");
        }, 8000);
      }
    } catch (error) {
      console.error(error);
      setStatus("idle");
      setGlobalMessage("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg border border-green-100 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-nebras-green">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-nebras-green">شكراً لثقتكم بنا</h3>
        <p className="text-gray-600">{globalMessage}</p>
      </div>
    );
  }

  if (status === "duplicate") {
    return (
      <div className="rounded-2xl bg-amber-50 p-8 text-center shadow-lg border border-amber-200 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertCircle size={32} />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-amber-800">طلب مسجل مسبقاً</h3>
        <p className="text-amber-700">{globalMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 text-right shadow-lg">
      {globalMessage && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-sm font-medium text-red-800">{globalMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="facilityName" className="mb-2 block text-sm font-medium text-gray-700">
            اسم المنشأة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="facilityName"
            name="facilityName"
            value={formData.facilityName}
            onChange={handleChange}
            disabled={status === "loading"}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-nebras-green focus:outline-none focus:ring-1 focus:ring-nebras-green disabled:bg-gray-100"
            placeholder="مجمع الصحة المتميز"
          />
          {errors.facilityName && <p className="mt-1 text-xs text-red-500">{errors.facilityName[0]}</p>}
        </div>

        <div>
          <label htmlFor="facilityType" className="mb-2 block text-sm font-medium text-gray-700">
            نوع المنشأة <span className="text-red-500">*</span>
          </label>
          <select
            id="facilityType"
            name="facilityType"
            value={formData.facilityType}
            onChange={handleChange}
            disabled={status === "loading"}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-nebras-green focus:outline-none focus:ring-1 focus:ring-nebras-green disabled:bg-gray-100"
          >
            <option value="مجمع طبي">مجمع طبي</option>
            <option value="مجمع لطب الأسنان">مجمع لطب الأسنان</option>
            <option value="مختبر">مختبر</option>
            <option value="مركز أشعة">مركز أشعة</option>
            <option value="مستشفى">مستشفى</option>
          </select>
          {errors.facilityType && <p className="mt-1 text-xs text-red-500">{errors.facilityType[0]}</p>}
        </div>

        <div>
          <label htmlFor="city" className="mb-2 block text-sm font-medium text-gray-700">
            المدينة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={status === "loading"}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-nebras-green focus:outline-none focus:ring-1 focus:ring-nebras-green disabled:bg-gray-100"
            placeholder="الرياض"
          />
          {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city[0]}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
            رقم الجوال <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={status === "loading"}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-nebras-green focus:outline-none focus:ring-1 focus:ring-nebras-green disabled:bg-gray-100"
            placeholder="05XXXXXXXX"
            dir="ltr"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500 text-right">{errors.phone[0]}</p>}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md bg-nebras-gold px-4 py-3 font-bold text-white transition-colors hover:bg-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "جاري الإرسال..." : "إرسال الطلب"}
        </button>
      </form>
    </div>
  );
}
