// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ColumnPayload, PipelineStage } from "@/lib/actions/pipeline";
import { PIPELINE_STAGES } from "@/lib/utils/pipeline";

const { updateFacilityStatusAction, push } = vi.hoisted(() => ({ updateFacilityStatusAction: vi.fn(), push: vi.fn() }));
vi.mock("@/lib/actions/pipeline", () => ({ getPipelineAction: vi.fn(), updateFacilityStatusAction }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { KanbanBoard } from "@/components/pipeline/KanbanBoard";

function columns(): Record<PipelineStage, ColumnPayload> {
  return Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage, {
    stage,
    cards: stage === "new" ? [{
      id: "facility-a",
      nameAr: "مجمع الشفاء",
      type: "medical_complex",
      city: "الرياض",
      assignedOwnerId: "sales-a",
      assignedOwnerName: "مندوب أ",
      primaryPhone: "0501000001",
      statusChangedAt: "2026-06-21T00:00:00Z",
    }] : [],
    totalCount: stage === "new" ? 1 : 0,
    hasMore: false,
    page: 1,
  }])) as Record<PipelineStage, ColumnPayload>;
}

function setViewport(desktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: desktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

function renderBoard() {
  return render(createElement(KanbanBoard, {
    initialColumns: columns(),
    companyName: "شركة نبراس",
    cities: [{ id: "city-a", name_ar: "الرياض" }],
    owners: [{ id: "sales-a", display_name: "مندوب أ", status: "active" }],
    canAssign: false,
    currentUserId: "sales-a",
  }));
}

describe("pipeline board accessibility", () => {
  beforeEach(() => {
    updateFacilityStatusAction.mockReset();
    updateFacilityStatusAction.mockResolvedValue({ success: true });
    push.mockReset();
  });

  it("disables card dragging in the mobile column and labels communication actions", () => {
    setViewport(false);
    const { container } = renderBoard();
    const mobile = Array.from(container.querySelectorAll(".min-\\[700px\\]\\:hidden"))
      .find((element) => element.querySelector("[role='listitem']"));
    expect(mobile).not.toBeNull();
    expect(within(mobile as HTMLElement).getByRole("listitem")).toHaveAttribute("draggable", "false");
    expect(within(mobile as HTMLElement).getByLabelText("اتصال بـ مجمع الشفاء")).toHaveAttribute("href", "tel:0501000001");
    expect(within(mobile as HTMLElement).getByLabelText("واتساب مجمع الشفاء")).toHaveAttribute("href", expect.stringContaining("wa.me/966501000001"));
  });

  it("enables native dragging on desktop while retaining the tap/keyboard menu", async () => {
    setViewport(true);
    const { container } = renderBoard();
    await waitFor(() => {
      const desktop = container.querySelector("[aria-label='لوحة مسار المبيعات']");
      expect(within(desktop as HTMLElement).getByRole("listitem")).toHaveAttribute("draggable", "true");
    });
    expect(screen.getAllByLabelText("تغيير مرحلة مجمع الشفاء").length).toBeGreaterThan(0);
  });

  it("requires confirmation before a terminal move from the action menu", () => {
    setViewport(false);
    renderBoard();
    fireEvent.click(screen.getAllByRole("menuitem", { name: "تعاقد" })[0]);
    expect(screen.getByRole("dialog", { name: "تأكيد نقل المنشأة" })).toBeInTheDocument();
    expect(updateFacilityStatusAction).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the facility when the card surface is clicked", () => {
    setViewport(false);
    renderBoard();
    fireEvent.click(screen.getAllByRole("listitem")[0]);
    expect(push).toHaveBeenCalledWith("/dashboard/facilities/facility-a");
  });
});
