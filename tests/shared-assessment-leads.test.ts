import { beforeEach, describe, expect, test, vi } from "vitest";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";

const state = vi.hoisted(() => ({
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
  responses: new Map<string, Array<{ data: unknown; error: unknown }>>(),
  isRateLimited: vi.fn(),
}));

function nextResponse(table: string) {
  return state.responses.get(table)?.shift() ?? { data: null, error: null };
}

function builder(table: string): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") return (resolve: (value: unknown) => void) => resolve(nextResponse(table));
      if (property === "single" || property === "maybeSingle") return () => Promise.resolve(nextResponse(table));
      return (...args: unknown[]) => {
        state.calls.push({ table, method: String(property), args });
        return builder(table);
      };
    },
  });
}

vi.mock("next/headers", () => ({
  headers: () => ({ get: () => "127.0.0.1" }),
}));
vi.mock("@/lib/rate-limit/memory", () => ({
  isRateLimited: state.isRateLimited,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => builder(table),
  }),
}));

import { submitSharedAssessmentLead } from "@/lib/actions/shared-assessment-leads";

describe("shared assessment lead submission", () => {
  beforeEach(() => {
    state.calls.length = 0;
    state.responses.clear();
    state.isRateLimited.mockReset().mockReturnValue(false);
  });

  test("recalculates the score, stores the shared lead, and creates a CRM facility follow-up", async () => {
    const codes = CBAHI_DATA.general.chapters.flatMap((chapter) => chapter.items.map((item) => item.code));
    const answers: Array<{ itemCode: string; value: "1" | "0.5" | "0" | "na" }> =
      codes.map((itemCode) => ({ itemCode, value: "1" as const }));
    answers[0] = { itemCode: codes[0], value: "0.5" };
    answers[1] = { itemCode: codes[1], value: "na" };

    state.responses.set("shared_assessment_leads", [{ data: { id: "lead-1" }, error: null }]);
    state.responses.set("companies", [{ data: { id: "company-a" }, error: null }]);
    state.responses.set("facilities", [
      { data: null, error: null },
      { data: { id: "facility-1" }, error: null },
    ]);
    state.responses.set("facility_activity", [{ data: null, error: null }]);

    const result = await submitSharedAssessmentLead({
      facilityName: "مجمع الاختبار الطبي",
      contactName: "أحمد محمد",
      city: "الرياض",
      phone: "0501234567",
      email: "owner@example.com",
      facilityType: "general",
      answers,
    });

    const applicableItems = codes.length - 1;
    const expectedScore = Math.round((codes.length - 1.5) / applicableItems * 100);

    expect(result).toEqual({ success: true, leadId: "lead-1", score: expectedScore });

    const sharedInsert = state.calls.find((call) => call.table === "shared_assessment_leads" && call.method === "insert");
    expect(sharedInsert?.args[0]).toMatchObject({
      facility_name: "مجمع الاختبار الطبي",
      overall_score: expectedScore,
      readiness_tier: "high",
      answered_count: codes.length,
      counts: {
        available: applicableItems - 1,
        partial: 1,
        unavailable: 0,
        not_applicable: 1,
        unanswered: 0,
      },
    });

    const facilityInsert = state.calls.find((call) => call.table === "facilities" && call.method === "insert");
    expect(facilityInsert?.args[0]).toMatchObject({
      company_id: "company-a",
      name_ar: "مجمع الاختبار الطبي",
      type: "medical_complex",
      city_custom: "الرياض",
      primary_phone: "0501234567",
      lead_source: "website_form",
      status: "new",
    });
    expect(String((facilityInsert?.args[0] as Record<string, unknown>).notes)).toContain("اسم مسؤول التواصل: أحمد محمد");
    expect(String((facilityInsert?.args[0] as Record<string, unknown>).notes)).toContain(`درجة الجاهزية: ${expectedScore}%`);
  });

  test("rejects invalid contact data before writing", async () => {
    const result = await submitSharedAssessmentLead({
      facilityName: "",
      contactName: "",
      city: "",
      phone: "123",
      facilityType: "dental",
      answers: [],
    });

    expect(result.success).toBe(false);
    expect(state.calls).toHaveLength(0);
  });
});
