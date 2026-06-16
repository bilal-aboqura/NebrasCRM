# Quickstart: Foundational Access Layer

This guide describes how to run and verify the foundational access layer (Next.js, Supabase Local, RLS, and RBAC).

---

## 1. Prerequisites

Make sure you have the following installed on your machine:
* **Node.js** (v18.x or v20.x)
* **npm** (v9.x or later)
* **Docker Desktop** (required to run local Supabase)
* **Supabase CLI** (installed globally: `npm install -g supabase`)

---

## 2. Local Supabase Setup

The system uses Supabase CLI for local PostgreSQL and Auth services.

1. Navigate to the project root and start the Supabase containers:
   ```bash
   supabase start
   ```
   *Note: This command spins up Docker containers for Postgres, Auth (GoTrue), Studio, and local helpers, and automatically applies all migrations under `supabase/migrations/`.*

2. Seed the database with our standard tenants and role test accounts:
   ```bash
   supabase db reset
   ```
   *Note: This resets the database and runs the seed script `supabase/seed.sql`.*

---

## 3. Seed Accounts for Verification

The database is pre-seeded with the following test credentials:

| Tenant | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **تقنية الارتقاء** | `superadmin@nebrasgoo.com` | `password123` | `super_admin` (Cross-Tenant) |
| **نبراس الجودة** | `admin_a@nebrasgoo.com` | `password123` | `company_admin` (Tenant A) |
| **نبراس الجودة** | `supervisor_a@nebrasgoo.com` | `password123` | `supervisor` (Tenant A) |
| **نبراس الجودة** | `sales_a@nebrasgoo.com` | `password123` | `sales_user` (Tenant A) |
| **تقنية الارتقاء** | `admin_b@nebrasgoo.com` | `password123` | `company_admin` (Tenant B) |

---

## 4. Running the Next.js Application

1. Create a local environment file `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key-from-supabase-start
   SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key-from-supabase-start
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Running Verification Tests

To verify that Row Level Security policies and role boundaries are functioning correctly, we run pgTAP tests inside the PostgreSQL instance:

```bash
supabase db test
```
This command runs all unit tests defined in `supabase/tests/` using pgTAP, validating tenant isolation and role restrictions.
