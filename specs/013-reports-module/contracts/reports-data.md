# Interface Contracts: Reports Data Shapes

This document defines the TypeScript interface contracts returned by the Server Actions for each of the 6 reports.

---

## 1. Shared Types

```typescript
export interface ReportFilter {
  startDate: string; // ISO String (Asia/Riyadh boundaries)
  endDate: string;   // ISO String (Asia/Riyadh boundaries)
  ownerId?: string;
  facilityType?: string;
  region?: string;
  city?: string;
}
```

---

## 2. Report 1: Sales Pipeline Report

```typescript
export interface PipelineStageMetric {
  stage: string;       // Arabic status name
  inflow: number;      // Count of facilities that entered during period
  outflow: number;     // Count of facilities that exited during period
  netChange: number;   // inflow - outflow
  avgDuration: number; // Average duration in days
}

export interface PipelineReportData {
  stages: PipelineStageMetric[];
  totalActiveFacilities: number;
}
```

---

## 3. Report 2: Conversion & Loss Report

```typescript
export interface FunnelStage {
  stage: string;       // Arabic status name
  count: number;       // Facilities that reached this stage
  percentage: number;  // Percentage of total new facilities
}

export interface LossReasonMetric {
  reason: string;      // Lost reason label
  count: number;
}

export interface ConversionLossReportData {
  funnel: FunnelStage[];
  lossReasons: LossReasonMetric[];
  winRate: number;     // contracts / (contracts + lost) * 100
}
```

---

## 4. Report 3: Follow-up Performance Report

```typescript
export interface FollowupTypeMetric {
  type: string;        // Task type: call, visit, send_offer, other
  created: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

export interface FollowupReportData {
  summary: {
    totalCreated: number;
    totalCompleted: number;
    totalCancelled: number;
    totalOverdue: number;
    onTimeRate: number;     // Completed on or before due_at / total completed
    avgCompletionTime: number; // Average hours/days to complete
  };
  byType: FollowupTypeMetric[];
}
```

---

## 5. Report 4: Communication Activity Report

```typescript
export interface CommOutcomeMetric {
  outcome: string;     // answered, no_answer, callback, not_interested
  count: number;
}

export interface CommRepRow {
  repName: string;
  repId: string;
  calls: number;
  whatsapp: number;
  inbound: number;
  outbound: number;
}

export interface CommunicationReportData {
  totalCalls: number;
  totalWhatsapp: number;
  inboundCount: number;
  outboundCount: number;
  outcomes: CommOutcomeMetric[];
  repBreakdown?: CommRepRow[]; // Managers only
}
```

---

## 6. Report 5: Offers & Revenue Report

```typescript
export interface OfferStatusMetric {
  status: string;      // sent, accepted, rejected, expired
  count: number;
  totalValue: number;  // SUM in SAR
}

export interface RevenueRepRow {
  repName: string;
  repId: string;
  contractsCount: number;
  totalRevenue: number; // SUM of active contract values
}

export interface OffersRevenueReportData {
  offers: OfferStatusMetric[];
  avgOfferValue: number;      // Average value of accepted offers
  avgDecisionTime: number;    // Average days from sent to decision
  contracts: {
    count: number;
    totalValue: number;
  };
  repRevenue?: RevenueRepRow[]; // Managers only
}
```

---

## 7. Report 6: Team Comparison Report (Managers Only)

```typescript
export interface TeamRepRow {
  repId: string;
  repName: string;
  isActive: boolean;
  facilitiesAssigned: number;
  followupsCompleted: number;
  callsLogged: number;
  offersSent: number;
  contractsWon: number;
  totalRevenue: number;
}

export interface TeamComparisonReportData {
  reps: TeamRepRow[];
}
```
