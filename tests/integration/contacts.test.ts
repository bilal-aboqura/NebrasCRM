import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/utils/phone";

type Response = { data?: unknown; error?: unknown };
const responses = new Map<string, Response[]>();
const calls: Array<{ target: string; method: string; args: unknown[] }> = [];
let authContext = {
  userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", email: "sales@example.com", fullName: "مندوب مبيعات",
  role: "sales_user", companyId: "11111111-1111-4111-8111-111111111111",
  activeCompanyId: "11111111-1111-4111-8111-111111111111", companyName: "شركة أ", status: "active",
};

function nextResponse(key: string): Response { return responses.get(key)?.shift() ?? { data: null, error: null }; }
function builder(table: string): object {
  return new Proxy({}, {
    get(_object, property) {
      if (property === "then") return (resolve: (value: Response) => void) => resolve(nextResponse(table));
      if (property === "single" || property === "maybeSingle") return () => Promise.resolve(nextResponse(table));
      return (...args: unknown[]) => { calls.push({ target: table, method: String(property), args }); return builder(table); };
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => authContext }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({
  from: (table: string) => builder(table),
  rpc: async (name: string, args: unknown) => { calls.push({ target: name, method: "rpc", args: [args] }); return nextResponse(`rpc:${name}`); },
}) }));

import { archiveContact, createContact, getFacilityContacts, recoverContact, updateContact } from "@/lib/actions/contacts";

const facility = { id: "facility-a", company_id: authContext.companyId, assigned_to: authContext.userId, is_active: true };
const contact = { id: "contact-a", facility_id: facility.id, company_id: authContext.companyId, is_archived: false };
const input = { name_ar: "أحمد الغامدي", job_title: "مدير المشتريات", primary_phone: "0501234567", is_primary: true };

describe("contact server actions", () => {
  beforeEach(() => {
    calls.length = 0; responses.clear();
    authContext = { ...authContext, role: "sales_user", userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", activeCompanyId: "11111111-1111-4111-8111-111111111111" };
  });

  it("creates a tenant-scoped contact through the atomic RPC", async () => {
    responses.set("facilities", [{ data: facility, error: null }]);
    responses.set("rpc:create_contact_atomic", [{ data: { ...contact, ...input }, error: null }]);
    expect((await createContact(facility.id, input)).success).toBe(true);
    expect(calls).toContainEqual(expect.objectContaining({
      target: "create_contact_atomic", method: "rpc",
      args: [expect.objectContaining({ p_company_id: authContext.companyId, p_facility_id: facility.id, p_actor_id: authContext.userId, p_input: expect.objectContaining({ is_primary: true }) })],
    }));
  });

  it("does not disclose or mutate cross-tenant facilities", async () => {
    responses.set("facilities", [{ data: null, error: null }]);
    const result = await createContact("company-b-facility", input);
    expect(result.success).toBe(false);
    expect(calls.some((call) => call.method === "rpc")).toBe(false);
  });

  it("rejects invalid Saudi phone numbers before database access", async () => {
    const result = await createContact(facility.id, { ...input, primary_phone: "123" });
    expect(result.success).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("uses the atomic update RPC for primary swaps and edit logging", async () => {
    responses.set("contacts", [{ data: contact, error: null }]);
    responses.set("facilities", [{ data: facility, error: null }]);
    responses.set("rpc:update_contact_atomic", [{ data: { ...contact, ...input, job_title: "مدير الجودة" }, error: null }]);
    expect((await updateContact(contact.id, { job_title: "مدير الجودة", is_primary: true })).success).toBe(true);
    expect(calls).toContainEqual(expect.objectContaining({ target: "update_contact_atomic", method: "rpc" }));
  });

  it("archives a primary contact through one transaction", async () => {
    responses.set("contacts", [{ data: contact, error: null }]);
    responses.set("facilities", [{ data: facility, error: null }]);
    responses.set("rpc:archive_contact_atomic", [{ data: { ...contact, is_archived: true, is_primary: false }, error: null }]);
    expect((await archiveContact(contact.id)).success).toBe(true);
    expect(calls).toContainEqual(expect.objectContaining({ target: "archive_contact_atomic", method: "rpc" }));
  });

  it("allows only management roles to recover archived contacts", async () => {
    expect((await recoverContact(contact.id)).success).toBe(false);
    expect(calls).toHaveLength(0);
    authContext = { ...authContext, role: "supervisor" };
    responses.set("contacts", [{ data: { ...contact, is_archived: true }, error: null }]);
    responses.set("facilities", [{ data: facility, error: null }]);
    responses.set("rpc:recover_contact_atomic", [{ data: { ...contact, is_archived: false, is_primary: false }, error: null }]);
    expect((await recoverContact(contact.id)).success).toBe(true);
  });

  it("sorts active contacts with the primary first", async () => {
    responses.set("facilities", [{ data: facility, error: null }]);
    responses.set("contacts", [{ data: [], error: null }]);
    expect((await getFacilityContacts(facility.id)).success).toBe(true);
    expect(calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: "contacts", method: "eq", args: ["is_archived", false] }),
      expect.objectContaining({ target: "contacts", method: "order", args: ["is_primary", { ascending: false }] }),
    ]));
  });
});

describe("contact communication links", () => {
  it("normalizes Saudi phones and resolves the company template", () => {
    expect(normalizePhone("050 123 4567")).toBe("966501234567");
    const url = buildWhatsAppUrl("050 123 4567", "نبراس الجودة", "مرحباً من [اسم الشركة]");
    expect(url).toBe(`https://wa.me/966501234567?text=${encodeURIComponent("مرحباً من نبراس الجودة")}`);
  });
});
