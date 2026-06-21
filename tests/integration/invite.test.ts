import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { resolveInvitationScope } from "@/lib/auth/admin-policy";
import { PASSWORD_ERROR, validatePassword } from "@/lib/auth/password-security";

describe("secure invitation rules", () => {
  it("rejects passwords shorter than 12 characters without making a breach request", async () => {
    const fetcher = vi.fn();
    await expect(validatePassword("too-short", fetcher as never)).rejects.toThrow(PASSWORD_ERROR);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses k-anonymity and rejects a breached password", async () => {
    const password = "known-breached-password";
    const digest = createHash("sha1").update(password).digest("hex").toUpperCase();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, text: async () => `${digest.slice(5)}:42` });
    await expect(validatePassword(password, fetcher as never)).rejects.toThrow(PASSWORD_ERROR);
    expect(fetcher.mock.calls[0][0]).toContain(digest.slice(0, 5));
    expect(fetcher.mock.calls[0][0]).not.toContain(digest.slice(5));
  });
  it("accepts a strong password absent from the breach response", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, text: async () => "ABC:1" });
    await expect(validatePassword("Unique-Strong-Password-2026", fetcher as never)).resolves.toBeUndefined();
  });
  it("locks company-admin invitations to their tenant and allowed roles", () => {
    const admin = { role: "company_admin" as const, companyId: "tenant-a" };
    expect(resolveInvitationScope(admin, "tenant-b", "supervisor")).toBe("tenant-a");
    expect(() => resolveInvitationScope(admin, "tenant-a", "super_admin")).toThrow();
  });
});

