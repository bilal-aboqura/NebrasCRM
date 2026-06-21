import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ context: { userId: "sales-a", companyId: "company-a", activeCompanyId: "company-a", role: "sales_user" }, calls: [] as Array<[string, unknown]> }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/secure-storage", () => ({ uploadPrivateContractFile: vi.fn(), createContractSignedUrl: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => {
  const chain: any = { select: vi.fn(() => chain), eq: vi.fn((field: string, value: unknown) => { state.calls.push([field, value]); return chain; }), order: vi.fn(async () => ({ data: [], error: null })) };
  return { from: vi.fn(() => chain) };
} }));

import { getContractsDirectory } from "@/lib/actions/contracts";

describe("scoped contracts directory", () => {
  it("always scopes by active tenant and assigned facility for sales users", async () => {
    state.calls.length = 0;
    const result = await getContractsDirectory();
    expect(result.success).toBe(true);
    expect(state.calls).toContainEqual(["company_id", "company-a"]);
    expect(state.calls).toContainEqual(["facilities.assigned_to", "sales-a"]);
    expect(state.calls).toContainEqual(["facilities.is_active", true]);
  });
});
