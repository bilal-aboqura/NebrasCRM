import { beforeEach, describe, expect, it, vi } from "vitest";

type Response = { data?: unknown; error?: unknown };

const responses = new Map<string, Response[]>();
const calls: Array<{ table: string; method: string; args: unknown[] }> = [];
let clientIp = "203.0.113.10";

function nextResponse(table: string): Response {
  return responses.get(table)?.shift() ?? { data: null, error: null };
}

function builder(table: string): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") {
        return (resolve: (value: Response) => void) => resolve(nextResponse(table));
      }
      if (property === "single" || property === "maybeSingle") {
        return () => Promise.resolve(nextResponse(table));
      }
      return (...args: unknown[]) => {
        calls.push({ table, method: String(property), args });
        return builder(table);
      };
    },
  });
}

vi.mock("next/headers", () => ({
  headers: () => ({ get: (name: string) => name === "x-forwarded-for" ? clientIp : null }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => builder(table) }),
}));

import { submitLeadAction } from "@/lib/actions/lead-capture";
import { resetRateLimitStore } from "@/lib/rate-limit/memory";

const validPayload = {
  facilityName: "مجمع الشفاء الطبي",
  facilityType: "medical_complex" as const,
  city: "الرياض",
  phone: "050 111 2233",
};

describe("public lead capture", () => {
  beforeEach(() => {
    calls.length = 0;
    responses.clear();
    clientIp = "203.0.113.10";
    process.env.DEFAULT_LEAD_COMPANY_ID = "company-a";
    resetRateLimitStore();
  });

  it("creates a sanitized, unassigned website lead without authentication", async () => {
    responses.set("companies", [{ data: { id: "company-a" }, error: null }]);
    responses.set("facilities", [
      { data: null, error: null },
      { data: { id: "facility-new", name_ar: "مجمع الشفاء الطبي" }, error: null },
    ]);
    responses.set("facility_activity", [{ error: null }]);

    const result = await submitLeadAction({
      ...validPayload,
      facilityName: "  <b>مجمع الشفاء الطبي</b>  ",
      city: "<script>alert(1)</script>الرياض",
      phone: "+966 50 111 2233",
    });

    expect(result).toMatchObject({ success: true, duplicate: false });
    const insert = calls.find((call) => call.table === "facilities" && call.method === "insert");
    expect(insert?.args[0]).toMatchObject({
      company_id: "company-a",
      name_ar: "مجمع الشفاء الطبي",
      type: "medical_complex",
      primary_phone_normalized: "966501112233",
      status: "new",
      lead_source: "website_form",
      assigned_to: null,
      is_active: true,
      notes: "المدينة المدخلة: الرياض",
    });
    expect(calls).toContainEqual(expect.objectContaining({
      table: "facility_activity",
      method: "insert",
      args: [expect.objectContaining({ event_type: "created", facility_id: "facility-new" })],
    }));
  });

  it("returns field errors without writing invalid input", async () => {
    const result = await submitLeadAction({ ...validPayload, facilityName: "", phone: "12345" });

    expect(result).toMatchObject({
      success: false,
      errors: { facilityName: expect.any(Array), phone: expect.any(Array) },
    });
    expect(calls).toHaveLength(0);
  });

  it("blocks an active duplicate across all companies without exposing its id", async () => {
    responses.set("companies", [{ data: { id: "company-a" }, error: null }]);
    responses.set("facilities", [{ data: { id: "secret-id", is_active: true }, error: null }]);

    const result = await submitLeadAction(validPayload);

    expect(result).toMatchObject({ success: true, duplicate: true });
    expect(JSON.stringify(result)).not.toContain("secret-id");
    expect(calls.filter((call) => call.table === "facilities" && call.method === "insert")).toHaveLength(0);
    expect(calls).not.toContainEqual(expect.objectContaining({
      table: "facilities",
      method: "eq",
      args: ["company_id", expect.anything()],
    }));
  });

  it("reactivates an archived duplicate in the configured company and logs recovery", async () => {
    responses.set("companies", [{ data: { id: "company-a" }, error: null }]);
    responses.set("facilities", [
      { data: { id: "facility-old", is_active: false, notes: "ملاحظة سابقة" }, error: null },
      { data: { id: "facility-old" }, error: null },
    ]);
    responses.set("facility_activity", [{ error: null }]);

    const result = await submitLeadAction(validPayload);

    expect(result).toMatchObject({ success: true, duplicate: false, recovered: true });
    expect(calls).toContainEqual(expect.objectContaining({
      table: "facilities",
      method: "update",
      args: [expect.objectContaining({
        company_id: "company-a",
        name_ar: validPayload.facilityName,
        type: validPayload.facilityType,
        status: "new",
        assigned_to: null,
        is_active: true,
        archived_at: null,
        archived_by: null,
        notes: "ملاحظة سابقة\nالمدينة المدخلة: الرياض",
      })],
    }));
    expect(calls).toContainEqual(expect.objectContaining({
      table: "facility_activity",
      method: "insert",
      args: [expect.objectContaining({ event_type: "recovered", facility_id: "facility-old" })],
    }));
  });

  it("rate limits the sixth submission from one IP within an hour", async () => {
    responses.set("companies", Array.from({ length: 5 }, () => ({ data: { id: "company-a" }, error: null })));
    responses.set("facilities", Array.from({ length: 5 }, () => ({ data: { id: "active", is_active: true }, error: null })));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(await submitLeadAction(validPayload)).toMatchObject({ success: true, duplicate: true });
    }
    const result = await submitLeadAction(validPayload);

    expect(result).toMatchObject({ success: false, rateLimited: true });
    expect(calls.filter((call) => call.table === "facilities" && call.method === "select")).toHaveLength(5);
  });
});
