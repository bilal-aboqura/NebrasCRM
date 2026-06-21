import { beforeEach, describe, expect, test, vi } from "vitest";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  isRateLimited: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () => ({ get: () => "127.0.0.1" }),
}));
vi.mock("@/lib/rate-limit/memory", () => ({
  isRateLimited: mocks.isRateLimited,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ insert: mocks.insert }),
  }),
}));

import { submitSharedAssessmentLead } from "@/lib/actions/shared-assessment-leads";

describe("shared assessment lead submission", () => {
  beforeEach(() => {
    mocks.isRateLimited.mockReset().mockReturnValue(false);
    mocks.insert.mockReset().mockImplementation((payload) => ({
      select: () => ({
        single: async () => ({ data: { id: "lead-1" }, error: null }),
      }),
      payload,
    }));
  });

  test("recalculates the score and stores one shared lead", async () => {
    const codes = CBAHI_DATA.general.chapters.flatMap((chapter) => chapter.items.map((item) => item.code));
    const answers = codes.map((itemCode) => ({ itemCode, value: "1" as const }));
    answers[0] = { itemCode: codes[0], value: "0.5" };
    answers[1] = { itemCode: codes[1], value: "na" };

    const result = await submitSharedAssessmentLead({
      facilityName: "مجمع الاختبار الطبي",
      contactName: "أحمد محمد",
      city: "الرياض",
      phone: "0501234567",
      email: "owner@example.com",
      facilityType: "general",
      answers,
    });

    expect(result).toEqual({ success: true, leadId: "lead-1", score: 98 });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.insert.mock.calls[0][0]).toMatchObject({
      facility_name: "مجمع الاختبار الطبي",
      overall_score: 98,
      readiness_tier: "high",
      answered_count: 33,
      counts: { available: 31, partial: 1, unavailable: 0, not_applicable: 1, unanswered: 0 },
    });
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
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
