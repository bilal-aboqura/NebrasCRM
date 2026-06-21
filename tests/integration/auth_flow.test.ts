import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const single = vi.fn();
const adminFrom = vi.fn((table: string) => {
  if (table === "login_attempts") {
    const query = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), insert };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.gte.mockResolvedValue({ count: 0 });
    return query;
  }
  const query = { select: vi.fn(), eq: vi.fn(), single };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  return query;
});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: adminFrom }) }));
vi.mock("@/lib/auth/audit", () => ({ writeAudit: vi.fn() }));

import { INVALID_LOGIN, loginWithPassword } from "@/lib/auth/login-service";

describe("authentication flow", () => {
  beforeEach(() => { vi.clearAllMocks(); single.mockResolvedValue({ data: { company_id: "tenant-a", role: "company_admin", status: "active", companies: { status: "active" } } }); });

  it("returns a neutral localized error for invalid credentials", async () => {
    const client = { auth: { signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: new Error("bad password") }), signOut: vi.fn() } };
    const result = await loginWithPassword(client as never, "User@example.com", "bad");
    expect(result).toEqual({ success: false, status: 401, error: INVALID_LOGIN });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ email: "user@example.com", successful: false }));
  });

  it("returns the scoped profile after a successful login", async () => {
    const client = { auth: { signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: "user-a", email: "user@example.com" } }, error: null }), signOut: vi.fn() } };
    const result = await loginWithPassword(client as never, "user@example.com", "correct");
    expect(result).toMatchObject({ success: true, user: { company_id: "tenant-a", role: "company_admin" } });
  });
});
