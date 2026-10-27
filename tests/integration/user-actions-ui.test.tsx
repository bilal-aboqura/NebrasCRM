// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const actions = vi.hoisted(() => ({ delete: vi.fn(), toggle: vi.fn(), link: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/actions/admin", () => ({ deleteUser: actions.delete, toggleUserStatus: actions.toggle, createUserAccessLink: actions.link }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: actions.refresh }) }));
import { UserActions } from "@/components/admin/UserActions";
const user = { id: "sales-a", display_name: "أحمد", status: "active", deleted_at: null };

describe("user administration controls", () => {
  beforeEach(() => { cleanup(); vi.resetAllMocks(); });
  it("requires confirmation before removing an account", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<UserActions user={user} />);
    fireEvent.click(screen.getByRole("button", { name: "حذف المستخدم" }));
    expect(actions.delete).not.toHaveBeenCalled();
  });
  it("displays permission errors", async () => {
    actions.toggle.mockResolvedValue({ success: false, error: "غير مصرح لك" });
    render(<UserActions user={{ ...user, status: "inactive" }} />);
    fireEvent.click(screen.getByRole("button", { name: "إعادة التفعيل" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("غير مصرح لك");
    expect(actions.refresh).not.toHaveBeenCalled();
  });
  it("keeps controls disabled while a server request is pending", async () => {
    let resolve!: (value: object) => void;
    actions.link.mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<UserActions user={user} />);
    fireEvent.click(screen.getByRole("button", { name: "استعادة كلمة المرور" }));
    expect(screen.getByRole("button", { name: "حذف المستخدم" })).toBeDisabled();
    resolve({ success: true, url: "https://example.com/reset?token=sample", message: "رابط صالح لساعة" });
    await waitFor(() => expect(screen.getByLabelText("رابط الحساب")).toHaveValue("https://example.com/reset?token=sample"));
    expect(screen.getByRole("button", { name: "حذف المستخدم" })).toBeEnabled();
  });
  it("offers restoration for deleted users", async () => {
    actions.toggle.mockResolvedValue({ success: true });
    render(<UserActions user={{ ...user, status: "inactive", deleted_at: "2026-10-27" }} />);
    expect(screen.queryByRole("button", { name: "حذف المستخدم" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "استعادة المستخدم" }));
    await waitFor(() => expect(actions.toggle).toHaveBeenCalledWith(user.id, "active"));
  });
  it("renews pending invitations without activating accounts directly", () => {
    render(<UserActions user={{ ...user, status: "pending" }} />);
    expect(screen.getByRole("button", { name: "تجديد رابط التفعيل" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "إعادة التفعيل" })).not.toBeInTheDocument();
  });
});
