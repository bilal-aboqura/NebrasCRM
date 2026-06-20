# Interface Contracts: Dashboard Server Actions

These are the contracts for the new server action methods to fetch scoped dashboard metrics.

## getDashboardData Action
Fetches aggregates, alerts, activity feeds, and initial chart data for the current authenticated user context.

* **Interface**:
  ```typescript
  export interface DashboardData {
    kpis: {
      totalFacilities: number;
      stageCounts: Record<FacilityStatus, number>;
      overdueFollowUps: number;
      pendingOffersCount: number;
      pendingOffersValue: number;
      activeContractsCount: number;
      activeContractsValue: number;
      conversionRate: number;
    };
    funnelData: Array<{
      status: FacilityStatus;
      name: string; // Arabic name
      count: number;
      color: string;
    }>;
    alerts: Array<{
      id: string;
      facilityId: string;
      facilityName: string;
      type: "call" | "visit" | "email" | "whatsapp";
      dueAt: string;
      status: string;
    }>;
    activityFeed: Array<{
      id: string;
      facilityId: string;
      facilityName: string;
      kind: string;
      message: string;
      createdAt: string;
    }>;
    role: Role;
  }

  export async function getDashboardData(): Promise<DashboardData>;
  ```

## getTeamPerformanceData Action
Fetches representative activity breakdown filtered by a period. Accessible ONLY by management roles.

* **Interface**:
  ```typescript
  export interface RepPerformance {
    repId: string;
    displayName: string;
    facilitiesAssigned: number;
    followUpsCompleted: number;
    callsLogged: number;
    offersSent: number;
    contractsWon: number;
  }

  export type PerformancePeriod = "week" | "month" | "quarter";

  export async function getTeamPerformanceAction(period: PerformancePeriod): Promise<RepPerformance[]>;
  ```
