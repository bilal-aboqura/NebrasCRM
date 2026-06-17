import { describe, expect, it } from "vitest";
import { changePassword } from "@/lib/actions/profile";

describe("profile actions", () => {
  it("rejects weak password changes", async () => {
    await expect(changePassword("old-password", "short")).rejects.toThrow(/8/);
  });
});
