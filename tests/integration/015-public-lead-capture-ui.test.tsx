// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { submitLeadAction, push } = vi.hoisted(() => ({
  submitLeadAction: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/lib/actions/lead-capture", () => ({ submitLeadAction }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { LeadCaptureForm } from "@/components/public/LeadCaptureForm";

function completeForm() {
  fireEvent.change(screen.getByLabelText("اسم المنشأة"), { target: { value: "مجمع الشفاء" } });
  fireEvent.change(screen.getByLabelText("رقم الجوال"), { target: { value: "0501112233" } });
  fireEvent.change(screen.getByLabelText("المدينة"), { target: { value: "الرياض" } });
}

describe("public lead capture form", () => {
  beforeEach(() => {
    submitLeadAction.mockReset();
    push.mockReset();
    window.dataLayer = [];
  });

  it("renders Arabic fields and reports inline validation errors", () => {
    render(<LeadCaptureForm />);

    expect(screen.getByLabelText("اسم المنشأة")).toBeInTheDocument();
    expect(screen.getByLabelText("نوع المنشأة")).toBeInTheDocument();
    expect(screen.getByLabelText("رقم الجوال")).toBeInTheDocument();
    expect(screen.getByLabelText("المدينة")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "احجز تقييمك المجاني" }));

    expect(screen.getByText("يرجى إدخال اسم المنشأة")).toBeInTheDocument();
    expect(screen.getByText("يرجى إدخال رقم جوال سعودي صحيح")).toBeInTheDocument();
    expect(screen.getByText("يرجى إدخال المدينة")).toBeInTheDocument();
    expect(submitLeadAction).not.toHaveBeenCalled();
  });

  it("replaces the form with success, emits the GTM event, and redirects to the assessment", async () => {
    submitLeadAction.mockResolvedValue({
      success: true,
      duplicate: false,
      facilityId: "facility-new",
      message: "تم استلام طلبك بنجاح",
    });

    render(<LeadCaptureForm />);
    completeForm();

    fireEvent.click(screen.getByRole("button", { name: "احجز تقييمك المجاني" }));

    expect(await screen.findByText("تم استلام بيانات المنشأة")).toBeInTheDocument();
    expect(screen.queryByLabelText("اسم المنشأة")).not.toBeInTheDocument();
    expect(window.dataLayer).toContainEqual(expect.objectContaining({
      event: "lead_form_submitted",
      facilityType: "medical_complex",
    }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(expect.stringContaining("/assessment?"));
      expect(push).toHaveBeenCalledWith(expect.stringContaining("facility_id=facility-new"));
      expect(push).toHaveBeenCalledWith(expect.stringContaining("from=lead"));
    });
  });

  it("shows the duplicate warning without emitting a GTM event", async () => {
    submitLeadAction.mockResolvedValue({ success: true, duplicate: true, message: "تم تسجيل طلبك مسبقاً" });
    render(<LeadCaptureForm />);
    completeForm();

    fireEvent.click(screen.getByRole("button", { name: "احجز تقييمك المجاني" }));

    await waitFor(() => expect(screen.getByText("طلبك مسجل لدينا")).toBeInTheDocument());
    expect(window.dataLayer).toEqual([]);
    expect(push).not.toHaveBeenCalled();
  });
});
