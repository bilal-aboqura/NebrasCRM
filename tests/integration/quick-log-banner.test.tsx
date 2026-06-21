// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
vi.mock("@/lib/actions/call-logs", () => ({ createCallLog: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { QUICK_LOG_EVENT, QUICK_LOG_KEY, QuickLogBanner, readPendingCommunication, rememberPendingCommunication } from "@/components/facilities/QuickLogBanner";

describe("quick-log interaction context", () => {
  beforeEach(() => localStorage.clear());

  it("stores click-to-call context and notifies mounted banners", () => {
    const listener = vi.fn();
    window.addEventListener(QUICK_LOG_EVENT, listener);
    rememberPendingCommunication({ facilityId: "facility-a", contactId: "contact-a", contactName: "أحمد", channel: "call" });
    expect(readPendingCommunication()).toMatchObject({ facilityId: "facility-a", contactId: "contact-a", channel: "call" });
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(QUICK_LOG_EVENT, listener);
  });

  it("expires stale prompts after five minutes", () => {
    localStorage.setItem(QUICK_LOG_KEY, JSON.stringify({ facilityId: "facility-a", channel: "whatsapp", clickedAt: 1000 }));
    expect(readPendingCommunication(302_000)).toBeNull();
    expect(localStorage.getItem(QUICK_LOG_KEY)).toBeNull();
  });

  it("reveals the banner when the CRM window regains focus", () => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    localStorage.setItem(QUICK_LOG_KEY, JSON.stringify({ facilityId: "facility-a", contactName: "أحمد", channel: "call", clickedAt: Date.now() }));
    render(<QuickLogBanner facilityId="facility-a" />);
    fireEvent.focus(window);
    expect(screen.getByText(/هل تم التواصل مع أحمد/)).toBeInTheDocument();
  });
});
