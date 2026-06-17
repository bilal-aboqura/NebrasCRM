import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import SidebarNav from "@/components/SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/facilities"
}));

describe("role-aware navigation", () => {
  it("hides company admin links for sales users", () => {
    render(React.createElement(SidebarNav, { role: "sales_user" }));
    expect(screen.queryByText("الشركات")).toBeNull();
    expect(screen.getByText("المنشآت")).toBeTruthy();
  });
});
