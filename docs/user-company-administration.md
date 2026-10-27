# User and Company Administration

Feature 002 adds Arabic-first administration for companies and users on top of the tenant-isolated access layer.

## Routes

- `/admin/companies`: Super Admin company directory, creation, editing, and activation status.
- `/admin/users`: Cross-tenant for Super Admin; tenant-scoped for Company Admin.
- `/invite?token=...`: One-time, 24-hour account activation link.
- `/profile`: Self-service display-name and password updates.

## Security Rules

- The database always retains at least one active Super Admin.
- Company Admin actions are limited to their own tenant and cannot assign `super_admin`.
- Invitation tokens are stored as SHA-256 hashes and consumed atomically.
- Passwords require at least 12 characters and a Have I Been Pwned k-anonymity check.
- Deactivation and password changes revoke active sessions immediately.
- Company and profile changes record field-level audit details without passwords or tokens.

## Account removal and recovery

- User rows expose suspension, reactivation, removal, and password recovery to Super Admins and Company Admins. Company Admins remain restricted to their own company. Administrators cannot remove or suspend themselves.
- Removal records `profiles.deleted_at`, disables the account, revokes sessions, and invalidates outstanding invitations and recovery links in one transaction. CRM records and their ownership history remain intact. Filter by **المستخدمون المحذوفون** to restore a removed user. Removed email addresses remain reserved; restore the existing account instead of inviting a duplicate.
- Pending accounts use **تجديد رابط التفعيل**. Restoring a removed pending account keeps it pending until its owner sets a password using a new invitation.
- For an active user who forgot their password, select **استعادة كلمة المرور**, copy the generated link, and share it with the verified account owner. No email is sent automatically. The reset link expires after one hour, is single use, and replaces any previous reset link. Suspended accounts must be reactivated first.
- `/reset?token=...` validates the new password and confirmation, updates Supabase Auth, and revokes existing sessions. `/reset` explains how to request a link from the administrator. Tokens are stored only as SHA-256 hashes and excluded from audit details.
- Configure `NEXT_PUBLIC_APP_URL` to the real HTTPS application origin so generated links point to the deployed app.

## October 2026 deployment

Apply these migrations before deploying the updated application:

1. `20261027000000_user_account_management.sql`
2. `20261027000001_offer_line_item_generated_amount.sql`
3. `20261027000002_atomic_facility_archive.sql`

The offer migration repairs the helper replaced by the July document-upload migration. It supports both stored and generated `offer_line_items.amount` columns, including draft creation, updates, empty drafts, and revised offers. The facility migration makes archive status and activity logging atomic; a failed activity insert rolls back the archive change. Successful archiving opens the archived facilities list.

## Local Verification

The local stack uses ports `55321`-`55329` to avoid collisions with other Supabase projects.

```powershell
supabase start
supabase db reset
supabase db test
npm test
npm run build
```

