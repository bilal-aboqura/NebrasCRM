import { describe, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => [] as Array<[string, unknown]>);
const context = vi.hoisted(() => ({ userId: "sales-a", companyId: "company-a", activeCompanyId: "company-a", role: "sales_user" }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() })); vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => context }));
vi.mock("@/lib/supabase/admin", () => {
  const builder = (): any => new Proxy({}, { get: (_target, property) => {
    if (property === "then") return (resolve: Function) => resolve({ data: [], error: null });
    return (...args: unknown[]) => { if (property === "eq") calls.push([String(args[0]), args[1]]); return builder(); };
  } });
  return { createAdminClient: () => ({ from: builder }) };
});
import { getOffersDirectory } from "@/lib/actions/offers";
import { deriveOfferStatus } from "@/lib/utils/offers";
describe("scoped offer directory", () => { it("locks sales users to the active company and assigned facilities", async () => { calls.length = 0; await getOffersDirectory(); expect(calls).toContainEqual(["company_id", "company-a"]); expect(calls).toContainEqual(["facilities.assigned_to", "sales-a"]); }); it("derives expiry against the Riyadh date", () => { expect(deriveOfferStatus("sent", "2026-06-20", "2026-06-21")).toBe("expired"); expect(deriveOfferStatus("accepted", "2026-06-20", "2026-06-21")).toBe("accepted"); }); });
