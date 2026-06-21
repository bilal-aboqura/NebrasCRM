import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ rpc: vi.fn(), fetch: vi.fn(), context: { userId: "sales-a", companyId: "company-a", activeCompanyId: "company-a", role: "sales_user" as string } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: state.rpc, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: state.fetch }) }) }) }) }) }));
vi.mock("@/lib/secure-storage", () => ({ uploadPrivateContractFile: vi.fn(), createContractSignedUrl: vi.fn() }));

import { completeContract, terminateContract } from "@/lib/actions/contracts";

const row = { id: "contract-a", company_id: "company-a", facility_id: "facility-a", created_by: "manager-a", reference_number: "CON-2026-0001", title: "عقد", value: 100, start_date: "2026-01-01", end_date: "2027-01-01", status: "completed", version: 1, is_active: true, created_at: "x", updated_at: "x" };

describe("management-only contract transitions", () => {
  beforeEach(() => { state.rpc.mockReset(); state.fetch.mockReset(); state.context.role = "sales_user"; });
  it("rejects sales users before calling the database", async () => {
    expect((await completeContract(row.id)).success).toBe(false);
    expect((await terminateContract(row.id, { terminatedAt: "2026-08-01", terminatedReason: "طلب العميل" })).success).toBe(false);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("allows supervisors to invoke the protected transition", async () => {
    state.context.role = "supervisor"; state.rpc.mockResolvedValue({ data: { id: row.id }, error: null }); state.fetch.mockResolvedValue({ data: row, error: null });
    const result = await completeContract(row.id);
    expect(result.success).toBe(true);
    expect(state.rpc).toHaveBeenCalledWith("transition_contract_atomic", expect.objectContaining({ p_transition: "completed" }));
  });
});

