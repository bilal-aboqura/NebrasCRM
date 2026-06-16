# Research: User and Company Administration

This document details the research findings, design decisions, and trade-offs for Feature 002.

---

## 1. Supabase Auth Invitation Flow

### Decision
Use Supabase Auth's built-in Admin API `supabase.auth.admin.inviteUserByEmail()` server-side (using the service-role client) to create user accounts.

### Rationale
- Securely offloads token generation, token storage, and link expiration to Supabase Auth.
- Prevents administrative exposure to plaintext passwords during creation.
- Supabase automatically sets the user's status to pending and provides a redirect URL to complete the password setup.

### Alternatives Considered
- *Custom Invite Tokens*: Store custom random tokens in a `user_invitations` table. Rejected because it duplicates built-in Supabase security controls and requires custom cron jobs to clean up expired tokens.

---

## 2. Password Strength & Breach Check

### Decision
Enforce a minimum length of 12 characters in frontend validation and server actions. Intercept password registration and check against the HaveIBeenPwned API (using a k-Anonymity range search to protect privacy) or enable Supabase's built-in leaked password protection.

### Rationale
- k-Anonymity range search sends only the first 5 characters of the SHA-1 hash to `https://api.pwnedpasswords.com/range/{prefix}`. This maintains absolute user privacy (the full hash never leaves the server).
- Enforces the user's request for "12 chars + breach check".

---

## 3. Immediate Session Termination & Revocation

### Decision
When an administrator deactivates a user, demotes their role, deactivates their company, or resets their password:
1. Trigger a global sign-out via the Supabase Admin API: `supabase.auth.admin.signOut(userId, 'global')`. This instantly revokes all refresh tokens.
2. To address the remaining lifetime of the stateless JWT (access token), Next.js middleware must validate the user's active status against the database.
3. Keep access token lifetime short (e.g., 5-15 minutes). The middleware checks a short-lived cache or performs a fast query (`SELECT status FROM profiles WHERE id = ...` and checks the company status) on protected dashboard requests. If inactive, the middleware destroys local session cookies.

### Rationale
- Ensures user/company deactivations take effect within seconds, rather than waiting up to an hour for the JWT to expire.
- Minimizes database overhead by checking only on protected layout transitions or using cache.

---

## 4. Last Active Super Admin Lockout Prevention

### Decision
Implement a server-side PostgreSQL function or transaction using `SELECT FOR UPDATE` to perform an atomic lock and count.
Before deactivating a user or changing a role:
```sql
-- Acquire row-level lock on all super_admin profiles
SELECT id FROM public.profiles 
WHERE role = 'super_admin' AND status = 'active'
FOR UPDATE;

-- Check if deactivating this user would leave 0 active super_admins
IF (SELECT count(*) FROM public.profiles WHERE role = 'super_admin' AND status = 'active') <= 1 THEN
  RAISE EXCEPTION 'يجب أن يكون هناك مشرف عام نشط واحد على الأقل في النظام';
END IF;
```
A similar trigger will run when a company is deactivated, checking if all active Super Admins belong to that company.

### Rationale
- Row-level locking prevents concurrent updates from bypassing the validation check and locking the system.

---

## 5. Field-Level Audit Logging

### Decision
Use a PostgreSQL database trigger on the `companies` and `profiles` tables to capture `UPDATE` actions and compute field-level before/after diffs, writing them to `audit_logs` in a JSON format.
For example, a modification of user role will result in:
```json
{
  "role": {
    "old": "sales_user",
    "new": "supervisor"
  }
}
```
Passwords and invitation tokens are explicitly excluded from being diffed or logged.

### Rationale
- Guarantees 100% audit log compliance, preventing bypasses from direct API calls or database updates.
