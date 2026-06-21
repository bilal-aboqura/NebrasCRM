// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarNav } from "@/components/SidebarNav";

const { pathname } = vi.hoisted(() => ({ pathname: { value: "/dashboard/facilities" } }));

vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

describe("role-aware sidebar navigation", () => {
  beforeEach(() => { pathname.value = "/dashboard/facilities"; });

  it("hides administration links from sales users", () => {
    render(<SidebarNav role="sales_user" />);
    expect(screen.getByRole("link", { name: "المنشآت" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "الفريق" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "الشركات" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الملف الشخصي" })).toBeInTheDocument();
  });

  it.each(["company_admin", "supervisor"] as const)("shows team but not companies to %s", (role) => {
    render(<SidebarNav role={role} />);
    expect(screen.getByRole("link", { name: "الفريق" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الفريق" })).toHaveAttribute("href", "/admin/users");
    expect(screen.queryByRole("link", { name: "الشركات" })).not.toBeInTheDocument();
  });

  it("shows every administration link to super admins", () => {
    render(<SidebarNav role="super_admin" />);
    expect(screen.getByRole("link", { name: "الفريق" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الشركات" })).toBeInTheDocument();
  });

  it("keeps a section active on nested routes", () => {
    pathname.value = "/dashboard/facilities/facility-a";
    render(<SidebarNav role="sales_user" />);
    expect(screen.getByRole("link", { name: "المنشآت" })).toHaveAttribute("aria-current", "page");
  });
});
