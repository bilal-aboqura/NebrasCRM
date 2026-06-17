import { describe, expect, it } from "vitest";
import { completeFollowUp, createFollowUp, getFollowUps } from "@/lib/actions/followups";

describe("follow-up management", () => {
  it("creates and completes follow-ups", async () => {
    const followUp = await createFollowUp({ facilityId: "fac-1", contactId: "con-1", type: "call", dueAt: "2099-01-01T09:00:00.000Z", notes: "Test" });
    expect(followUp.status).toBe("pending");
    const completed = await completeFollowUp(followUp.id, "answered");
    expect(completed.status).toBe("done");
    const rows = await getFollowUps({ status: "pending" });
    expect(rows.some((item) => item.id === followUp.id)).toBe(false);
  });
});
