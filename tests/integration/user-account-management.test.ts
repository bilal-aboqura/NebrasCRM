import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const state = vi.hoisted(() => ({
  context: { userId: "admin-a", role: "company_admin", companyId: "company-a", status: "active" },
  responses: new Map<string, any[]>(), calls: [] as Array<{ table: string; method: string; args: any[] }>,
  rpc: vi.fn(), updateUser: vi.fn(), validatePassword: vi.fn(), audit: vi.fn(),
}));
function query(table: string): any {
  return new Proxy({}, { get(_, method) {
    if (method === "then") return (resolve: (value: unknown) => void) => resolve(state.responses.get(table)?.shift() ?? { data: null, error: null });
    return (...args: any[]) => { state.calls.push({ table, method: String(method), args }); return query(table); };
  } });
}
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/auth/audit", () => ({ writeAudit: state.audit }));
vi.mock("@/lib/auth/password-security", () => ({ validatePassword: state.validatePassword }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: query, rpc: state.rpc, auth: { admin: { updateUserById: state.updateUser } } }) }));

import { createUserAccessLink, deleteUser, toggleUserStatus } from "@/lib/actions/admin";
import { completePasswordReset, completePasswordResetAction } from "@/lib/actions/password-reset";

const target = { id: "sales-a", company_id: "company-a", role: "sales_user", status: "active", deleted_at: null, companies: { status: "active" } };
const token = "a".repeat(43);

describe("user account administration and recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks(); state.responses.clear(); state.calls.length = 0;
    state.context = { userId: "admin-a", role: "company_admin", companyId: "company-a", status: "active" };
    state.rpc.mockResolvedValue({ error: null }); state.updateUser.mockResolvedValue({ error: null });
    state.validatePassword.mockResolvedValue(undefined);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://crm.example.com/");
  });
  it("uses the authenticated actor and an atomic removal operation", async () => {
    expect(await deleteUser("sales-a")).toEqual({ success: true });
    expect(state.rpc).toHaveBeenCalledWith("manage_user_account", { p_actor_id: "admin-a", p_target_id: "sales-a", p_operation: "delete" });
  });
  it.each(["sales_user", "supervisor"])("denies %s administration", async (role) => {
    state.context.role = role;
    expect(await deleteUser("sales-a")).toMatchObject({ success: false });
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("denies inactive administrators", async () => {
    state.context.status = "inactive";
    expect(await toggleUserStatus("sales-a", "active")).toMatchObject({ success: false });
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("shows database protection errors rather than silently succeeding", async () => {
    state.rpc.mockResolvedValue({ error: { message: "last administrator protected" } });
    expect(await deleteUser("admin-b")).toEqual({ success: false, error: "last administrator protected" });
  });
  it("creates a reset link with only its hash passed to storage", async () => {
    state.responses.set("profiles", [{ data: target }]);
    const result = await createUserAccessLink(target.id);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const raw = new URL(result.url).searchParams.get("token")!;
    expect(result.url).toMatch(/^https:\/\/crm.example.com\/reset\?token=/);
    expect(state.rpc).toHaveBeenCalledWith("issue_user_access_link", expect.objectContaining({
      p_purpose: "password_reset", p_token_hash: createHash("sha256").update(raw).digest("hex"),
    }));
    expect(JSON.stringify(state.rpc.mock.calls)).not.toContain(raw);
  });
  it("renews invitations for pending accounts", async () => {
    state.responses.set("profiles", [{ data: { ...target, status: "pending" } }]);
    expect(await createUserAccessLink(target.id)).toMatchObject({ success: true, url: expect.stringContaining("/invite?token=") });
    expect(state.rpc).toHaveBeenCalledWith("issue_user_access_link", expect.objectContaining({ p_purpose: "invitation" }));
  });
  it.each([
    { ...target, company_id: "company-b" }, { ...target, id: "admin-a" },
    { ...target, status: "inactive" }, { ...target, deleted_at: "2026-10-27" },
    { ...target, role: "super_admin" },
  ])("denies links to disallowed targets %#", async (profile) => {
    state.responses.set("profiles", [{ data: profile }]);
    expect(await createUserAccessLink(profile.id)).toMatchObject({ success: false });
    expect(state.rpc).not.toHaveBeenCalled();
  });
  function validReset() {
    state.responses.set("user_password_resets", [{ data: { user_id: target.id } }, { data: { user_id: target.id } }]);
    state.responses.set("profiles", [{ data: target }]);
  }
  it("claims a one-use token, changes the password, and revokes sessions", async () => {
    validReset();
    expect(await completePasswordReset(token, "UniquePassword-2026")).toEqual({ success: true });
    expect(state.updateUser).toHaveBeenCalledWith(target.id, { password: "UniquePassword-2026" });
    expect(state.rpc).toHaveBeenCalledWith("revoke_user_sessions", { target_user_id: target.id });
    expect(state.rpc).toHaveBeenCalledTimes(2);
    expect(state.calls).toContainEqual({ table: "user_password_resets", method: "is", args: ["used_at", null] });
    expect(JSON.stringify(state.audit.mock.calls)).not.toContain("UniquePassword-2026");
    expect(JSON.stringify(state.audit.mock.calls)).not.toContain(token);
  });
  it("rejects an expired or reused link before checking a password", async () => {
    expect(await completePasswordReset(token, "UniquePassword-2026")).toMatchObject({ success: false });
    expect(state.validatePassword).not.toHaveBeenCalled(); expect(state.updateUser).not.toHaveBeenCalled();
  });
  it("rejects a token claimed concurrently", async () => {
    validReset(); state.responses.set("user_password_resets", [{ data: { user_id: target.id } }, { data: null }]);
    expect(await completePasswordReset(token, "UniquePassword-2026")).toMatchObject({ success: false });
    expect(state.updateUser).not.toHaveBeenCalled();
  });
  it("does not change a password when session revocation fails", async () => {
    validReset(); state.rpc.mockResolvedValue({ error: { message: "offline" } });
    expect(await completePasswordReset(token, "UniquePassword-2026")).toMatchObject({ success: false });
    expect(state.updateUser).not.toHaveBeenCalled();
    expect(state.calls).toContainEqual({ table: "user_password_resets", method: "update", args: [{ used_at: null }] });
  });
  it("releases the claim if Auth rejects the password update", async () => {
    validReset(); state.updateUser.mockResolvedValue({ error: { message: "offline" } });
    expect(await completePasswordReset(token, "UniquePassword-2026")).toMatchObject({ success: false });
    expect(state.calls).toContainEqual({ table: "user_password_resets", method: "update", args: [{ used_at: null }] });
  });
  it("rejects password confirmation mismatches", async () => {
    const form = new FormData(); form.set("password", "UniquePassword-2026"); form.set("confirm_password", "different");
    expect(await completePasswordResetAction(undefined, form)).toMatchObject({ success: false });
    expect(state.updateUser).not.toHaveBeenCalled();
  });
});
