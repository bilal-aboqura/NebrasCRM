// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DashboardData } from "@/lib/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

function dashboard(role: DashboardData["role"]): DashboardData {
  return {
    role,
    kpis: {
      totalFacilities: 0,
      stageCounts: { new: 0, contacted: 0, interested: 0, offer: 0, negotiation: 0, contract: 0, lost: 0 },
      overdueFollowUps: 0,
      pendingOffersCount: 0,
      pendingOffersValue: 0,
      activeContractsCount: 0,
      activeContractsValue: 0,
      conversionRate: 0,
    },
    funnelData: [
      { status: "new", name: "جديد", count: 0, color: "#3b82f6" },
      { status: "contract", name: "عقد", count: 0, color: "#10b981" },
    ],
    alerts: [],
    activityFeed: [],
  };
}

describe("dashboard role-aware rendering", () => {
  it("does not expose team performance to a sales user", () => {
    render(<DashboardClient data={dashboard("sales_user")} />);
    expect(screen.queryByRole("heading", { name: "أداء الفريق" })).not.toBeInTheDocument();
  });

  it.each(["super_admin", "company_admin", "supervisor"] as const)("shows team performance to %s", (role) => {
    render(<DashboardClient data={dashboard(role)} onPeriodChange={async () => []} />);
    expect(screen.getByRole("heading", { name: "أداء الفريق" })).toBeInTheDocument();
  });
});
