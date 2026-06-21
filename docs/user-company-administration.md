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

## Local Verification

The local stack uses ports `55321`-`55329` to avoid collisions with other Supabase projects.

```powershell
supabase start
supabase db reset
supabase db test
npm test
npm run build
```

