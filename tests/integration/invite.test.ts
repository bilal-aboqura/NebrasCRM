import { describe, expect, it } from "vitest";
import { completeInvitation, inviteUser } from "@/lib/actions/admin";

describe("invitation flow", () => {
  it("creates an invitation and activates it with a password", async () => {
    const invitation = await inviteUser({ email: "new-user@example.com", displayName: "New User", role: "sales_user", companyId: "company-a" });
    const activated = await completeInvitation(invitation.invitationToken, "password123");
    expect(activated.status).toBe("active");
  });
});
