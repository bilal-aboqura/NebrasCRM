# API Contract: Authentication & Tenant Switcher

This document details the interface contracts for authentication operations and active company switching. All endpoints use JSON for requests and responses.

---

## 1. Login Endpoint

Authenticates a user and establishes a session cookie.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```

### 1.1 Response (Successful Authentication)
- **Status**: `200 OK`
- **Headers**:
  - `Set-Cookie: sb-access-token=...; HttpOnly; Secure; SameSite=Lax`
  - `Set-Cookie: sb-refresh-token=...; HttpOnly; Secure; SameSite=Lax`
- **Response Body**:
  ```json
  {
    "success": true,
    "user": {
      "id": "e4b31a89-2144-48f8-b78a-bde9e64ad932",
      "email": "user@example.com",
      "role": "company_admin",
      "company_id": "c1f7b8a9-4567-48f8-b88a-d9be64ad931a"
    }
  }
  ```

### 1.2 Response (Invalid Credentials)
- **Status**: `401 Unauthorized`
- **Response Body**:
  ```json
  {
    "success": false,
    "error": "البريد الإلكتروني أو كلمة المرور غير صحيحة."
  }
  ```

### 1.3 Response (Throttled - Cooldown Active)
- **Status**: `429 Too Many Requests`
- **Response Body**:
  ```json
  {
    "success": false,
    "error": "لقد تجاوزت الحد الأقصى للمحاولات. يرجى الانتظار 30 ثانية قبل المحاولة مرة أخرى."
  }
  ```

---

## 2. Logout Endpoint

Clears session cookies and invalidates the session.

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Response**:
  - **Status**: `302 Found` (Redirect to `/login`)
  - **Headers**:
    - `Set-Cookie: sb-access-token=; Max-Age=0; HttpOnly; Secure`
    - `Set-Cookie: sb-refresh-token=; Max-Age=0; HttpOnly; Secure`
    - `Set-Cookie: active_company_id=; Max-Age=0; HttpOnly; Secure`

---

## 3. Switch Company Endpoint (Super Admin Only)

Switches the active company context for a Super Admin user.

- **URL**: `/api/auth/switch-company`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "company_id": "c2f8b8a9-4567-48f8-b88a-d9be64ad931b"
  }
  ```

### 3.1 Response (Successful Switch)
- **Status**: `200 OK`
- **Headers**:
  - `Set-Cookie: active_company_id=c2f8b8a9-4567-48f8-b88a-d9be64ad931b; HttpOnly; Secure; SameSite=Lax`
- **Response Body**:
  ```json
  {
    "success": true,
    "active_company_id": "c2f8b8a9-4567-48f8-b88a-d9be64ad931b"
  }
  ```

### 3.2 Response (Unauthorized / Forbidden)
- **Status**: `403 Forbidden`
- **Response Body**:
  ```json
  {
    "success": false,
    "error": "غير مصرح لك بتغيير الشركة."
  }
  ```
