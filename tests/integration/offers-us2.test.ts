import { describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ rpc: vi.fn(), fetch: vi.fn(), context: { userId: "sales-a", companyId: "company-a", activeCompanyId: "company-a", role: "sales_user" } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: state.rpc, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: state.fetch }) }) }) }) }) }));
import { sendOffer } from "@/lib/actions/offers";
describe("send offer", () => { it("uses the atomic send transition", async () => { state.rpc.mockResolvedValueOnce({ data: { id: "offer-a" }, error: null }); state.fetch.mockResolvedValueOnce({ data: { id: "offer-a", company_id: "company-a", facility_id: "facility-a", created_by: "sales-a", title: "عرض", status: "sent", subtotal: 100, discount_type: "fixed", discount_value: 0, discount_amount: 0, tax_rate: 15, tax_amount: 15, grand_total: 115, valid_until: "2026-12-01", version: 1, is_active: true, created_at: "x", updated_at: "x" }, error: null }); const result = await sendOffer("offer-a"); expect(result.success).toBe(true); expect(state.rpc).toHaveBeenCalledWith("send_offer_atomic", expect.objectContaining({ p_offer_id: "offer-a" })); }); });
