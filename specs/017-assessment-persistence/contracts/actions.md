# Interface Contracts: Next.js Server Actions

## 1. `saveAssessment`

### Signature
```typescript
export async function saveAssessment(
  facilityId: string,
  facilityTypeAssessed: "general" | "dental",
  answers: Array<{
    item_code: string;
    status: "available" | "partial" | "unavailable" | "not_applicable";
    notes?: string;
  }>
): Promise<{ success: boolean; assessmentId?: string; error?: string }>
```

### Server Rules
1. Resolves active session profile. If not authenticated, rejects with `"Unauthorized"`.
2. Validates `facilityId` matches profile `company_id`.
3. Verifies user role has write permissions (supervisors/admins, or sales_user if they are the owner of the facility).
4. Verifies the facility is not archived.
5. Recomputes overall score and readiness tier.
6. Saves the assessment record.
7. Logs timeline activity to `facility_activity`.

---

## 2. `archiveAssessment`

### Signature
```typescript
export async function archiveAssessment(
  assessmentId: string
): Promise<{ success: boolean; error?: string }>
```

### Server Rules
1. Resolves active session profile.
2. Checks user role: must be `supervisor` or `company_admin` (super_admin allowed for active company).
3. Sets `is_active` to false, records `archived_at` and `archived_by`.
4. Writes timeline activity log `assessment_archived` to `facility_activity`.

---

## 3. `recoverAssessment`

### Signature
```typescript
export async function recoverAssessment(
  assessmentId: string
): Promise<{ success: boolean; error?: string }>
```

### Server Rules
1. Resolves active session profile.
2. Checks user role: must be `supervisor` or `company_admin`.
3. Sets `is_active` to true, `archived_at` = null, `archived_by` = null.
4. Writes timeline activity log `assessment_recovered` to `facility_activity`.
