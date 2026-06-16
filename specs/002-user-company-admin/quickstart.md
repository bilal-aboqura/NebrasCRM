# Quickstart: User and Company Administration

This guide describes how to apply migrations, run, and verify the user and company administration features (invitations, role-scoped directories, self-service profile updates, and lockout protection).

---

## 1. Apply Database Migrations & Seeds

Before running the application, you must apply the new database migrations containing extended schemas, triggers, and updated RLS policies.

1. Ensure the local Supabase container environment is running:
   ```bash
   supabase start
   ```

2. Reset and re-apply all database migrations (including the new ones for Feature 002):
   ```bash
   supabase db reset
   ```
   *Note: This command runs all SQL files in `supabase/migrations/` sequentially and then re-seeds test accounts using `supabase/seed.sql`.*

---

## 2. Testing the User Invitation Flow

Since local testing environments typically do not have SMTP/email servers configured, you can test and verify user invitations using one of the following methods:

### Method A: UI URL Fallback (Recommended)
1. Log in as `superadmin@nebrasgoo.com` or `admin_a@nebrasgoo.com`.
2. Go to the "إدارة المستخدمين" (User Management) screen and create/invite a new user.
3. The UI will catch the successful API response and display a copyable invitation link:
   `http://localhost:3000/invite?token=some-invitation-token`
4. Copy this link, open a new private browser window, navigate to the link, and complete the password creation form.

### Method B: Supabase Inboxes (Docker)
1. Go to your local Supabase Studio dashboard: [http://localhost:54323](http://localhost:54323)
2. In the sidebar, select **Inboxes** or **Monitor**.
3. View the outgoing invitation email, click the activation link (it will redirect you to your localhost page containing the token).

---

## 3. Verifying Session Termination & Lockout Protection

### Lockout Prevention Test
1. Log in as a `Super Admin`.
2. Go to the user directory and attempt to deactivate your own account or change your role to `sales_user`.
3. Verify that the UI displays a clear Arabic error message: `يجب أن يكون هناك مشرف عام نشط واحد على الأقل في النظام` and the action is blocked.

### Immediate Session Termination Test
1. Open two different browser profiles (or a normal tab and an incognito window).
2. In Tab 1, log in as a Sales User (`sales_a@nebrasgoo.com`) and navigate around the dashboard.
3. In Tab 2, log in as a Company Admin (`admin_a@nebrasgoo.com`). Go to the User Directory and deactivate the Sales User (`sales_a@nebrasgoo.com`).
4. Switch back to Tab 1. Click any link or attempt to perform any operation.
5. Verify that you are immediately signed out and redirected back to the login screen.

---

## 4. Running Database & RLS Tests

We run database-level tests to verify that `Company Admins` cannot read or write data of other tenants, and that RLS policies are strictly enforced:

```bash
supabase db test
```
This command runs pgTAP unit tests in `supabase/tests/`, validating tenant isolation, admin role restrictions, and lockout prevention triggers.
