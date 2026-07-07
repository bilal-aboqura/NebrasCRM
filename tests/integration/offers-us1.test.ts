import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ rpc: vi.fn(), fetch: vi.fn(), context: { userId: "sales-a", companyId: "company-a", activeCompanyId: "company-a", role: "sales_user" } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: state.rpc, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: state.fetch }) }) }) }) }) }));

import { createOffer } from "@/lib/actions/offers";

const valid = { facilityId: "facility-a", title: "عرض الاعتماد", validUntil: "2026-12-01", discountType: "fixed" as const, discountValue: 100, taxRate: 15, lineItems: [{ description: "خدمة التأهيل", amount: 1000, ordering: 0 }] };
const row = { id: "offer-a", company_id: "company-a", facility_id: "facility-a", contact_id: null, created_by: "sales-a", root_offer_id: null, parent_offer_id: null, title: valid.title, status: "draft", subtotal: 1000, discount_type: "fixed", discount_value: 100, discount_amount: 100, tax_rate: 15, tax_amount: 135, grand_total: 1035, valid_until: valid.validUntil, version: 1, is_superseded: false, is_active: true, created_at: "2026-06-21", updated_at: "2026-06-21", offer_line_items: [] };

describe("offer drafts", () => {
  beforeEach(() => { state.rpc.mockReset(); state.fetch.mockReset(); state.rpc.mockResolvedValue({ data: { id: "offer-a" }, error: null }); state.fetch.mockResolvedValue({ data: row, error: null }); });
  it("sends only raw inputs to the atomic server calculation", async () => { const result = await createOffer(valid); expect(result.success).toBe(true); expect(state.rpc).toHaveBeenCalledWith("create_offer_atomic", expect.objectContaining({ p_company_id: "company-a", p_input: expect.not.objectContaining({ grand_total: expect.anything() }) })); });
  it("allows saving a draft even when line items and title are still blank", async () => {
    const result = await createOffer({ ...valid, title: "", validUntil: "", discountValue: 0, lineItems: [{ description: "", amount: 0, ordering: 0 }] });
    expect(result.success).toBe(true);
    expect(state.rpc).toHaveBeenCalledWith("create_offer_atomic", expect.objectContaining({
      p_input: expect.objectContaining({
        title: "مسودة عرض سعر",
        line_items: [],
      }),
    }));
  });
  it("rejects a fixed discount above subtotal before persistence", async () => { const result = await createOffer({ ...valid, discountValue: 1001 }); expect(result.success).toBe(false); expect(state.rpc).not.toHaveBeenCalled(); });
});
