import { describe, expect, it } from "vitest";
import { defaultCompleteFollowUp } from "@/lib/types/call-logs";

describe("outcome-aware follow-up linkage", () => {
  it("defaults successful outcomes to completed", () => {
    expect(defaultCompleteFollowUp("answered")).toBe(true);
    expect(defaultCompleteFollowUp("callback_requested")).toBe(true);
  });
  it("keeps unsuccessful outcomes pending by default", () => {
    expect(defaultCompleteFollowUp("no_answer")).toBe(false);
    expect(defaultCompleteFollowUp("busy")).toBe(false);
  });
});
