import { beforeEach, describe, expect, it, vi } from "vitest";

const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));
const signInWithPassword = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => ({ userId: "user-a", email: "user@example.com" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => ({ from: () => ({ update }), auth: { signInWithPassword, updateUser, signOut } }) }));
vi.mock("@/lib/auth/password-security", () => ({ validatePassword: vi.fn().mockResolvedValue(undefined) }));

import { changePassword, updateProfileName } from "@/lib/actions/profile";

describe("self-service profile", () => {
  beforeEach(() => { vi.clearAllMocks(); updateEq.mockResolvedValue({ error: null }); });
  it("updates only the authenticated profile display name", async () => {
    expect(await updateProfileName("  أحمد سالم  ")).toEqual({ success: true });
    expect(update).toHaveBeenCalledWith({ display_name: "أحمد سالم" });
    expect(updateEq).toHaveBeenCalledWith("id", "user-a");
  });
  it("rejects invalid display names", async () => expect(await updateProfileName("x")).toMatchObject({ success: false }));
  it("requires the current password before changing it", async () => {
    signInWithPassword.mockResolvedValue({ error: new Error("invalid") });
    const result = await changePassword("wrong", "Unique-Strong-Password-2026");
    expect(result).toMatchObject({ success: false });
    expect(updateUser).not.toHaveBeenCalled();
  });
  it("updates the password and globally signs out", async () => {
    signInWithPassword.mockResolvedValue({ error: null }); updateUser.mockResolvedValue({ error: null }); signOut.mockResolvedValue({ error: null });
    expect(await changePassword("current-password", "Unique-Strong-Password-2026")).toEqual({ success: true });
    expect(signOut).toHaveBeenCalledWith({ scope: "global" });
  });
});
