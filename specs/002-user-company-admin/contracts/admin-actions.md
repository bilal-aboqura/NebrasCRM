# API & Server Actions Contract: User and Company Administration

This document details the interface contracts (Server Actions or API endpoints) for administrative and self-service operations.

---

## 1. Company Management Actions (Super Admin Only)

### 1.1 Create Company
- **Action/Endpoint**: `createCompany` (Server Action)
- **Authorization**: Super Admin role only
- **Input Parameters**:
  ```json
  {
    "name_ar": "نبراس الجودة الطبية",
    "contact_email": "info@nebras.com",
    "contact_phone": "+966500000000",
    "status": "active"
  }
  ```
- **Response**:
  - Success: `{ "success": true, "company_id": "uuid" }`
  - Error (Validation/Conflict): `{ "success": false, "error": "اسم الشركة مسجل بالفعل في النظام." }`

### 1.2 Update Company Details & Status
- **Action/Endpoint**: `updateCompany` (Server Action)
- **Authorization**: Super Admin role only
- **Input Parameters**:
  ```json
  {
    "id": "uuid",
    "name_ar": "نبراس الجودة الطبية المحدث",
    "contact_email": "contact@nebras.com",
    "contact_phone": "+966500000000",
    "status": "inactive"
  }
  ```
- **Response**:
  - Success: `{ "success": true }`
  - Error (Lockout Violation / Trying to deactivate company containing sole active Super Admin):
    `{ "success": false, "error": "لا يمكن إلغاء تفعيل هذه الشركة لأنها تضم المشرف العام النشط الوحيد في النظام." }`

---

## 2. User Management Actions (Role-Scoped)

### 2.1 Create User (Invitation Trigger)
- **Action/Endpoint**: `inviteUser` (Server Action)
- **Authorization**: 
  - Super Admin: can invite users to any company, assigning any role.
  - Company Admin: can invite users to their own company only, assigning `company_admin`, `supervisor`, or `sales_user`.
- **Input Parameters**:
  ```json
  {
    "email": "sarah@nebras.com",
    "display_name": "سارة أحمد",
    "role": "supervisor",
    "company_id": "uuid" -- Super Admin only. Automatically set from admin profile for Company Admin.
  }
  ```
- **Response**:
  - Success:
    ```json
    {
      "success": true,
      "user_id": "uuid",
      "invitation_url": "https://nebras.com/invite?token=..." -- Return URL for manual copy-paste fallback
    }
    ```
  - Error (Duplicate Email): `{ "success": false, "error": "البريد الإلكتروني مسجل بالفعل في النظام." }`
  - Error (Unauthorized Role elevation): `{ "success": false, "error": "غير مصرح لك بتعيين هذا الدور." }`

### 2.2 Toggle User Activation Status (Deactivate/Reactivate)
- **Action/Endpoint**: `toggleUserStatus` (Server Action)
- **Authorization**:
  - Super Admin: all users.
  - Company Admin: own company's users except Super Admin or demotions/deactivations on self.
- **Input Parameters**:
  ```json
  {
    "user_id": "uuid",
    "status": "inactive"
  }
  ```
- **Response**:
  - Success: `{ "success": true }` (Triggers `signOut` globally and database status update)
  - Error (Self-Deactivation / Last Super Admin): `{ "success": false, "error": "لا يمكنك إلغاء تفعيل حسابك أو مشرف النظام الوحيد." }`

---

## 3. Password Set (Invitation Complete Flow)

- **URL/Page**: `/invite`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "token": "token-string",
    "password": "newpassword123456"
  }
  ```
- **Response**:
  - Success: `{ "success": true, "message": "تم تفعيل الحساب بنجاح." }`
  - Error (Weak/Breached Password): 
    `{ "success": false, "error": "يجب أن تكون كلمة المرور مكونة من 12 خانة على الأقل ولم تظهر في تسريبات البيانات السابقة." }`
  - Error (Expired Token): `{ "success": false, "error": "رابط الدعوة هذا منتهي الصلاحية أو غير صالح." }`

---

## 4. Self-Service Profile

### 4.1 Update Name
- **Action/Endpoint**: `updateProfileName` (Server Action)
- **Authorization**: Any authenticated user
- **Input Parameters**:
  ```json
  {
    "display_name": "أحمد الحربي"
  }
  ```
- **Response**:
  - Success: `{ "success": true }`

### 4.2 Change Password
- **Action/Endpoint**: `changePassword` (Server Action)
- **Authorization**: Any authenticated user
- **Input Parameters**:
  ```json
  {
    "current_password": "oldpassword123",
    "new_password": "brandnewpassword987"
  }
  ```
- **Response**:
  - Success: `{ "success": true }`
  - Error (Verification/Complexity): `{ "success": false, "error": "كلمة المرور الحالية غير صحيحة أو الجديدة لا تطابق الشروط." }`
