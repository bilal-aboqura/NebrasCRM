import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ rpc: vi.fn(), fetch: vi.fn(), context: { userId: "sales-a", companyId: "company-a", activeCompanyId: "company-a", role: "sales_user" } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: state.rpc, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: state.fetch }) }) }) }) }) }));
vi.mock("@/lib/secure-storage", () => ({ uploadPrivateContractFile: vi.fn(), createContractSignedUrl: vi.fn() }));

import { createContract } from "@/lib/actions/contracts";

const input = { facilityId: "facility-a", offerId: "offer-a", title: "عقد اعتماد", value: 120000, startDate: "2026-07-01", endDate: "2027-06-30" };
const row = { id: "contract-a", company_id: "company-a", facility_id: "facility-a", contact_id: "contact-a", offer_id: "offer-a", created_by: "sales-a", reference_number: "CON-2026-0001", title: input.title, value: input.value, start_date: input.startDate, end_date: input.endDate, status: "draft", version: 1, is_superseded: false, is_active: true, created_at: "2026-06-21", updated_at: "2026-06-21" };

describe("contract draft creation", () => {
  beforeEach(() => { state.rpc.mockReset(); state.fetch.mockReset(); state.rpc.mockResolvedValue({ data: { id: row.id }, error: null }); state.fetch.mockResolvedValue({ data: row, error: null }); });
  it("delegates accepted-offer prefilling and reference generation to the atomic database function", async () => {
    const result = await createContract(input);
    expect(result.success).toBe(true);
    expect(result.success && result.data.referenceNumber).toBe("CON-2026-0001");
    expect(state.rpc).toHaveBeenCalledWith("create_contract_atomic", expect.objectContaining({ p_company_id: "company-a", p_input: expect.objectContaining({ offer_id: "offer-a" }) }));
  });
  it("surfaces the one-contract-per-offer constraint", async () => {
    state.rpc.mockResolvedValueOnce({ data: null, error: { code: "23505", message: "duplicate offer" } });
    const result = await createContract(input);
    expect(result.success).toBe(false);
    expect(!result.success && result.error.code).toBe("23505");
  });
});

