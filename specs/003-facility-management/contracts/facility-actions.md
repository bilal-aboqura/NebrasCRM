# Server Actions Contract: Facility Management

This document defines the TypeScript interface contracts for Next.js Server Actions used in Facility Management. All actions enforce tenant isolation and role-based permissions server-side.

---

## 1. Create Facility

Creates a new facility lead scoped to the active user's tenant.

- **Action Name**: `createFacility`
- **File Location**: `@/lib/actions/facilities.ts`
- **Parameters**: `data: CreateFacilityInput`
  ```typescript
  interface CreateFacilityInput {
    name_ar: string;
    type: 'medical_complex' | 'dental_complex' | 'lab' | 'radiology' | 'hospital';
    region_id: string;
    city_id: string;
    city_custom?: string; // Captured if city_id is the "Other" option
    primary_phone: string;
    secondary_phone?: string;
    lead_source: 'manual' | 'website_form' | 'imported';
    assigned_to?: string; // Optional at creation
    notes?: string;
  }
  ```

### 1.1 Response (Success)
```typescript
{
  success: true,
  data: {
    id: "f3c87e45-1234-48f8-b78a-bde9e64ad956",
    name_ar: "مجمع الطبيب الاستشاري",
    ...
  }
}
```

### 1.2 Response (Validation Error / Duplicate Phone)
If the normalized phone number conflicts with an existing active facility in the same company:
```typescript
{
  success: false,
  error: "رقم الهاتف الرئيسي مسجل بالفعل لمنشأة أخرى في الشركة. يرجى التواصل مع المشرف الخاص بك للمساعدة."
}
```

---

## 2. Update Facility

Updates an existing facility lead's details or lifecycle status.

- **Action Name**: `updateFacility`
- **File Location**: `@/lib/actions/facilities.ts`
- **Parameters**: `id: string, data: UpdateFacilityInput`
  ```typescript
  interface UpdateFacilityInput {
    name_ar?: string;
    type?: 'medical_complex' | 'dental_complex' | 'lab' | 'radiology' | 'hospital';
    region_id?: string;
    city_id?: string;
    city_custom?: string;
    primary_phone?: string;
    secondary_phone?: string;
    assigned_to?: string; // Assign/Reassign (Management roles only)
    status?: 'new' | 'contacted' | 'interested' | 'offer' | 'negotiation' | 'contract' | 'lost';
    notes?: string;
  }
  ```

### 2.1 Response (Success)
Saves modifications, records activity logs for status or assignment changes, and returns the updated record.
```typescript
{
  success: true,
  data: { ... }
}
```

### 2.2 Response (Unauthorized)
Returned if a Sales User attempts to modify `assigned_to` or accesses a record not assigned to them:
```typescript
{
  success: false,
  error: "غير مصرح لك بإجراء هذا التعديل."
}
```

---

## 3. Archive / Recover Facility

Management-only actions to archive or restore facility records.

- **Action Names**: `archiveFacility` / `recoverFacility`
- **File Location**: `@/lib/actions/facilities.ts`
- **Parameters**: `id: string`

### 3.1 Response (Success)
Toggles the active status, logs the action in the activity stream, and returns the updated state.
```typescript
{
  success: true,
  is_active: false // or true on recover
}
```

### 3.2 Response (Unauthorized)
Returned if a `Sales User` invokes either action:
```typescript
{
  success: false,
  error: "صلاحية الأرشفة والاستعادة مخصصة للمشرفين والمدراء فقط."
}
```

---

## 4. Get Facilities List

Fetches a paginated, filtered list of facilities scoped by company and role boundaries.

- **Action Name**: `getFacilitiesList`
- **File Location**: `@/lib/actions/facilities.ts`
- **Parameters**: `params: GetFacilitiesInput`
  ```typescript
  interface GetFacilitiesInput {
    page?: number;        // Default: 1
    limit?: number;       // Default: 15
    search?: string;      // Search by name or phone
    status?: string;      // Filter by lifecycle status
    region_id?: string;   // Filter by region
    city_id?: string;     // Filter by city
    assigned_to?: string; // Filter by owner (Admin/Supervisor only)
    show_archived?: boolean; // Default: false (Management only)
  }
  ```

### 4.1 Response (Success)
```typescript
{
  success: true,
  data: {
    records: FacilityRecord[],
    meta: {
      total: number,
      page: number,
      pages: number
    }
  }
}
```
*Note: Sales Users will only receive records assigned to them, with `show_archived` forced to `false`.*
