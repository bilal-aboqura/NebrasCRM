# Interface Contract: Pipeline Server Actions

This contract defines the TypeScript interfaces and Server Action inputs/outputs for the Sales Pipeline Board.

---

## 1. Fetching Pipeline Data (`getPipelineAction`)

Used to fetch facilities on the board, partitioned by column stage, and scoped by active tenant, role permissions, and custom search filters.

### Types and Interfaces

```typescript
export interface GetPipelineFilters {
  assignedOwnerId?: string; // Optional UUID (for Admins/Supervisors; ignored/overridden for Sales Users)
  city?: string;            // Filter by city name
  type?: string;            // Filter by facility type enum
}

export interface PipelineCardData {
  id: string;
  nameAr: string;
  type: 'medical_complex' | 'dental_complex' | 'lab' | 'radiology' | 'hospital';
  city: string;
  assignedOwnerId: string | null;
  assignedOwnerName: string | null; // Resolved join
  primaryPhone: string;
  statusChangedAt: string;
}

export interface ColumnPayload {
  stage: 'new' | 'contacted' | 'interested' | 'offer' | 'negotiation' | 'contract' | 'lost';
  cards: PipelineCardData[];
  totalCount: number;  // The live count of all in-scope cards in this stage
  hasMore: boolean;     // True if additional cards can be fetched (totalCount > loaded cards count)
}

export interface GetPipelineResponse {
  success: boolean;
  error?: string; // Localized Arabic error message
  data?: {
    columns: Record<string, ColumnPayload>;
  };
}
```

### Signature
```typescript
/**
 * Retrieves facilities for each pipeline column.
 * Enforces company isolation and role-based visibility rules server-side.
 */
export async function getPipelineAction(
  filters: GetPipelineFilters,
  pagination: { [key in ColumnPayload['stage']]?: { page: number } }
): Promise<GetPipelineResponse>;
```

---

## 2. Moving / Updating Facilities (`updateFacilityStatusAction`)

Used when a card is dropped or moved via the Tap Menu to update its lifecycle stage and log the activity.

### Types and Interfaces

```typescript
export interface UpdateFacilityStatusParams {
  facilityId: string; // UUID of target facility
  newStatus: 'new' | 'contacted' | 'interested' | 'offer' | 'negotiation' | 'contract' | 'lost';
  lostReason?: 'price' | 'competitor' | 'no_response' | 'not_interested' | 'other'; // Required if newStatus is 'lost'
  lostReasonNotes?: string; // Optional custom text if lostReason is 'other'
}

export interface UpdateFacilityStatusResponse {
  success: boolean;
  error?: string; // Localized Arabic error message
}
```

### Signature
```typescript
/**
 * Updates a facility's stage, logs the transition in FacilityActivity,
 * and enforces server-side tenant-scoping and authorization.
 */
export async function updateFacilityStatusAction(
  params: UpdateFacilityStatusParams
): Promise<UpdateFacilityStatusResponse>;
```

---

## 3. Server-Side Security Checks

The Server Actions must execute these validations in sequence:
1. **Authentication**: Verify session and retrieve the active `user_id`, `company_id`, and `role`.
2. **Tenant Check**: Query the facility using `company_id` to verify it belongs to the user's tenant (Company B users cannot access Company A's facilities).
3. **Role Check**:
   - If user is `Sales User`, verify `assigned_owner_id` equals active `user_id`. If they do not match, return a `403 Forbidden` error.
   - If user is `Supervisor` or `Company Admin`, allow the operation on any facility in their company.
4. **Validation**: Validate parameters. If `newStatus` is `'lost'`, require a valid `lostReason`.
5. **Database Transaction**:
   - Update facility lifecycle status, `lost_reason`, and update the `status_changed_at` timestamp.
   - Insert a row into `FacilityActivity` with event type `status_change` containing old and new statuses.
