# Quickstart: App Shell Navigation & Routing Wires

This guide describes how to run and verify the app shell navigation.

## Component Layout & Entry Points

1. **Authenticated Shell Wrapper (`src/app/(dashboard)/layout.tsx`)**
   Combines `Sidebar` and `Header` components around the main application children.

2. **Sidebar Component (`src/components/Sidebar.tsx` & `src/components/SidebarNav.tsx`)**
   - `Sidebar.tsx` (Server Component) fetches the authenticated user's role.
   - `SidebarNav.tsx` (Client Component) displays navigation links dynamically based on the role and applies active-link styling in RTL format.

3. **Header Component (`src/components/Header.tsx`)**
   - Displays active company name (resolved via cookie for Super Admin, and via profile for others).
   - Displays user display name, role badge, company switcher (for Super Admin only), and logout button.

4. **Landing Page (`src/app/(dashboard)/page.tsx`)**
   Renders 4 counts cards (Facilities, Overdue Follow-ups, Pending Offers, Active Contracts) querying the Supabase database.

## Running Tests

Verify everything is working correctly by running the Vitest integration suite:

```bash
npm run test
```

## Verification Scenarios

### 1. Role Navigation Visibility
- Log in as `super_admin`: Verify "الشركات" (Companies) and "المستخدمون" (Users) are visible under the Admin section in the sidebar.
- Log in as `company_admin` or `supervisor`: Verify "المستخدمون" (Users) is visible, but "الشركات" (Companies) is hidden.
- Log in as `sales_user`: Verify the Admin section only contains "الملف الشخصي" (Profile). "المستخدمون" and "الشركات" must be hidden.

### 2. Stats Counts Isolation
- Verify that statistics cards on `/` match the correct counts for the active user's company and assigned leads (for Sales Users).
- Verify that changing the active company via the switcher (as Super Admin) updates all stats counts immediately.
