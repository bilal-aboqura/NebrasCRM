import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ rpc: vi.fn(), fetch: vi.fn(), signed: vi.fn(), context: { userId: "sales-a", companyId: "company-a", activeCompanyId: "company-a", role: "sales_user" } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: state.rpc, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: state.fetch }) }) }) }) }) }));
vi.mock("@/lib/secure-storage", () => ({ uploadPrivateContractFile: vi.fn(), createContractSignedUrl: state.signed }));

import { activateContract, updateDraftContract } from "@/lib/actions/contracts";
import { CONTRACT_SIGNED_URL_TTL_SECONDS } from "@/config/storage";

const activeRow = { id: "contract-a", company_id: "company-a", facility_id: "facility-a", created_by: "sales-a", reference_number: "CON-2026-0001", title: "عقد", value: 100, start_date: "2026-07-01", end_date: "2027-07-01", status: "active", document_path: "company_company-a/contracts/contract-a/signed.pdf", version: 1, is_active: true, created_at: "x", updated_at: "x" };

describe("contract activation", () => {
  beforeEach(() => { state.rpc.mockReset(); state.fetch.mockReset(); state.rpc.mockResolvedValue({ data: { id: activeRow.id }, error: null }); state.fetch.mockResolvedValue({ data: activeRow, error: null }); });
  it("uses the guarded draft-to-active transition", async () => {
    const result = await activateContract(activeRow.id);
    expect(result.success).toBe(true);
    expect(state.rpc).toHaveBeenCalledWith("transition_contract_atomic", expect.objectContaining({ p_transition: "active" }));
  });
  it("requires valid date boundaries before updating a draft", async () => {
    const result = await updateDraftContract(activeRow.id, { title: "عقد", value: 100, startDate: "2027-07-01", endDate: "2026-07-01" });
    expect(result.success).toBe(false);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("surfaces database immutability and missing-document violations", async () => {
    state.rpc.mockResolvedValueOnce({ data: null, error: { code: "23514", message: "active contract core fields are immutable" } });
    const edited = await updateDraftContract(activeRow.id, { title: "عقد معدل", value: 999, startDate: "2026-07-01", endDate: "2027-07-01" });
    expect(edited.success).toBe(false);
    state.rpc.mockResolvedValueOnce({ data: null, error: { code: "23514", message: "signed document required" } });
    const activated = await activateContract(activeRow.id);
    expect(activated.success).toBe(false);
  });
  it("uses fifteen-minute document links", () => { expect(CONTRACT_SIGNED_URL_TTL_SECONDS).toBe(900); });
});
