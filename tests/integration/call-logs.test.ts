import { describe, expect, it } from "vitest";
import { createCallLog, getCallLogs } from "@/lib/actions/call-logs";

describe("call logging", () => {
  it("validates facility contact ownership and stores logs", async () => {
    await expect(createCallLog({ facilityId: "fac-1", contactId: "con-3", channel: "phone", direction: "outbound", outcome: "answered" })).rejects.toThrow();
    const log = await createCallLog({ facilityId: "fac-1", contactId: "con-1", channel: "phone", direction: "outbound", outcome: "answered" });
    const logs = await getCallLogs("fac-1");
    expect(logs.some((item) => item.id === log.id)).toBe(true);
  });
});
