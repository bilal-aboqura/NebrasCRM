# Data Model: App Shell Navigation & Routing Wires

This feature adds no new tables or migrations. It relies on the existing database schema and RLS security boundaries.

## Existing Entities Utilized

### 1. `companies` (Tenant isolation)
Represents the tenant companies operating in the platform.
- `id` (uuid, PK)
- `name` (text, unique)
- `status` (text: 'active' | 'inactive')

### 2. `profiles` (User identity & role context)
Represents the user profiles.
- `id` (uuid, PK, references auth.users)
- `company_id` (uuid, references companies)
- `email` (text, unique)
- `display_name` (text)
- `role` (text: 'super_admin' | 'company_admin' | 'supervisor' | 'sales_user')
- `status` (text: 'active' | 'inactive' | 'pending')

### 3. `facilities` (Customer/lead entities)
Used for counting total facilities and resolving detail page redirects.
- `id` (uuid, PK)
- `company_id` (uuid, references companies)
- `assigned_to` (uuid, references profiles)
- `status` (text)
- `is_archived` (boolean)

### 4. `followups` (Tasks and reminders)
Used for counting overdue pending tasks.
- `id` (uuid, PK)
- `company_id` (uuid, references companies)
- `assigned_to` (uuid, references profiles)
- `status` (text: 'pending' | 'done' | 'cancelled')
- `due_at` (timestamptz)

### 5. `offers` (Quotes)
Used for counting sent pending offers.
- `id` (uuid, PK)
- `company_id` (uuid, references companies)
- `status` (text: 'draft' | 'sent' | 'accepted' | 'rejected')
- `is_active` (boolean, represents soft archive state)
- `valid_until` (date)

### 6. `contracts` (Agreements)
Used for counting active contracts.
- `id` (uuid, PK)
- `company_id` (uuid, references companies)
- `status` (text: 'draft' | 'active' | 'completed' | 'terminated')
- `is_active` (boolean, represents soft archive state)
