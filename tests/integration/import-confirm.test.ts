import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_CONTEXT } from "./import-export-test-utils";

const state = vi.hoisted(() => ({
  context: { userId: "supervisor-a", role: "supervisor", companyId: "company-a", activeCompanyId: "company-a" } as Record<string, unknown>,
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: state.rpc, from: state.from }) }));

import { POST } from "@/app/api/facilities/import/confirm/route";

function request(batchId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa") {
  return new Request("http://localhost/api/facilities/import/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchId }),
  });
}

describe("facility import confirmation", () => {
  beforeEach(() => {
    state.context = { ...TEST_CONTEXT };
    state.rpc.mockReset(); state.from.mockReset();
    state.rpc.mockResolvedValue({ data: { success: true, importedCount: 3, skippedCount: 2 }, error: null });
  });

  it("delegates the tenant-scoped import and activity logging to one atomic database function", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, importedCount: 3, skippedCount: 2 });
    expect(state.rpc).toHaveBeenCalledWith("confirm_bulk_facility_import", {
      p_batch_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      p_company_id: TEST_CONTEXT.companyId,
      p_actor_id: TEST_CONTEXT.userId,
    });
    expect(state.from).not.toHaveBeenCalled();
  });

  it("denies Sales Users without invoking the transaction", async () => {
    state.context = { ...TEST_CONTEXT, role: "sales_user" };
    expect((await POST(request())).status).toBe(403);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("rejects a missing batch id", async () => {
    expect((await POST(request(""))).status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });
});

