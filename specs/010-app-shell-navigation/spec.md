# Feature Specification: App Shell Navigation & Routing Wires

**Feature Branch**: `010-app-shell-navigation`  
**Created**: 2026-06-17  
**Status**: Draft  
**Input**: User description: "Complete and wire the application shell navigation for the NEBRASGOO CRM so every implemented page is reachable without manually typing URLs. The pages from Features 001–009 already exist as routes; this feature builds the role-aware navigation that links to them and fixes the post-login landing."

## Clarifications

### Session 2026-06-17
- Q: Which page should be the default landing destination immediately after a successful login? → A: The Dashboard placeholder page (`/`) updated to display summary statistics cards (e.g., counts of facilities, follow-ups, offers, and contracts).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Role-Aware Sidebar Navigation (Priority: P1)

An authenticated user uses the sidebar to navigate the platform. The sidebar displays appropriate destinations based on the user's role. The active destination is visually highlighted.

**Why this priority**: Core navigation requirement. Users must be able to switch between sections of the CRM without manual URL entry.

**Independent Test**:
- Log in as a `sales_user`. Check that the sidebar contains: لوحة التحكم, المنشآت, المسار, المتابعات, العروض, العقود, and الملف الشخصي. Validate that the Admin sections for المستخدمون and الشركات are hidden.
- Log in as a `supervisor` or `company_admin`. Confirm that the Admin section is visible and contains المستخدمون, but does not contain الشركات.
- Log in as a `super_admin`. Verify that the Admin section contains both المستخدمون and الشركات.
- Click on different nav items. Verify that the active item is visually highlighted in a gold state.

**Acceptance Scenarios**:

1. **Given** the user is authenticated as a `Sales User`, **When** the sidebar renders, **Then** only non-admin links (لوحة التحكم, المنشآت, المسار, المتابعات, العروض, العقود, الملف الشخصي) are visible.
2. **Given** the user is authenticated as a `Supervisor` or `Company Admin`, **When** the sidebar renders, **Then** they see the standard links plus the المستخدمون (Users) administration link, but not the الشركات (Companies) link.
3. **Given** the user is authenticated as a `Super Admin`, **When** the sidebar renders, **Then** all links including الشركات (Companies) are visible in the sidebar.
4. **Given** the user is on a specific route (e.g., `/dashboard/facilities`), **When** the sidebar is displayed, **Then** the corresponding navigation link is highlighted in the active gold state.

---

### User Story 2 - Post-Login Destination Landing (Priority: P1)

After entering valid credentials on the login screen, the user is redirected to a functional landing page with real business content rather than a bare welcome page.

**Why this priority**: Good user experience. The system must immediately present actionable work items or records upon logging in.

**Independent Test**:
- Enter valid credentials on `/login`.
- Verify the system redirects to `/dashboard/facilities` (the Facilities list) or `/` containing a detailed statistics dashboard placeholder instead of a blank "مرحباً بك في نبراس" shell.

**Acceptance Scenarios**:

1. **Given** a user is on `/login`, **When** they submit valid credentials, **Then** they are logged in and redirected to `/dashboard/facilities` (the Facilities list page) or `/` (the dashboard placeholder showing statistics cards).

---

### User Story 3 - Facility Detail Accessibility (Priority: P1)

A user browsing facilities or viewing the sales pipeline board wants to see detailed information about a facility (such as contacts, offers, and contracts). They click on a facility row or a Kanban card to view the facility detail page.

**Why this priority**: Details navigation requirement. The detailed sections of facilities are nested, so users must be able to open them easily from both list and board views.

**Independent Test**:
- Open the Facilities list at `/dashboard/facilities`. Click on a row (or name). Verify it opens `/dashboard/facilities/[id]`.
- Open the Pipeline board at `/dashboard/pipeline`. Click on a pipeline card. Verify it opens `/dashboard/facilities/[id]`.

**Acceptance Scenarios**:

1. **Given** the user is on the Facilities list page, **When** they click a row representing a facility, **Then** they are navigated to the detail page for that facility.
2. **Given** the user is on the Pipeline Kanban board, **When** they click on a pipeline card, **Then** they are navigated to the detail page for that facility.

---

### User Story 4 - App Shell Header Context & Logout (Priority: P2)

An authenticated user looks at the header to verify their identity, active company, and role. If they are a Super Admin, they use the company switcher to change companies. Any user can click logout to end their session.

**Why this priority**: Security and Multi-tenant management. Displays critical context and enables tenant switching.

**Independent Test**:
- Log in as a user and check the header. Verify it displays:
  - User name (display_name if set, else email)
  - Arabic role label (e.g., مدير النظام for super_admin)
  - Active company name
  - "تسجيل الخروج" (Logout) button
- Log in as `super_admin`. Verify that the `CompanySwitcher` dropdown/list is visible in the header and allows switching active companies.
- Click "تسجيل الخروج" and verify the session is ended and user is redirected to `/login`.

**Acceptance Scenarios**:

1. **Given** any authenticated user, **When** they view the header, **Then** it shows their name, role in Arabic, active company name, and a logout button.
2. **Given** the authenticated user is a `Super Admin`, **When** they view the header, **Then** the company switcher component is visible, enabling them to change the active company.
3. **Given** the authenticated user is NOT a `Super Admin`, **When** they view the header, **Then** the company switcher is NOT rendered, and they only see their assigned company name.

---

### Edge Cases

- **Role Transition mid-session**: If a user's role is updated in the database, the sidebar must reflect the new role immediately or upon page refresh, preventing unauthorized link visibility.
- **Clicking interactive elements on Kanban Card**: Clicking the Whatsapp link, phone number, or the move dropdown on a Kanban card must trigger those actions without navigating the browser to the facility details page.
- **Deactivated Company**: If the active company is deactivated/disabled, the header must show a warning or automatically sign out the user.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-010-001**: The sidebar MUST render navigation links for the following routes:
  - لوحة التحكم: `/`
  - المنشآت: `/dashboard/facilities`
  - المسار: `/dashboard/pipeline`
  - المتابعات: `/dashboard/followups`
  - العروض: `/dashboard/offers`
  - العقود: `/dashboard/contracts`
- **FR-010-002**: The sidebar MUST render an Admin section containing:
  - المستخدمون: `/admin/users` (visible to `super_admin`, `company_admin`, `supervisor`)
  - الشركات: `/admin/companies` (visible ONLY to `super_admin`)
  - الملف الشخصي: `/profile` (visible to all authenticated roles)
- **FR-010-003**: The sidebar navigation items MUST display or hide dynamically based on the authenticated user's role:
  - `super_admin`: All destinations.
  - `company_admin` & `supervisor`: All destinations except الشركات.
  - `sales_user`: Destinations except المستخدمون and الشركات.
- **FR-010-004**: The active navigation item in the sidebar MUST be highlighted with a gold state (`#D4AF37` or equivalent theme color) matching the current active route.
- **FR-010-005**: Clicking a facility row in the Facilities list table MUST navigate the browser to `/dashboard/facilities/[id]`.
- **FR-010-006**: Clicking a Kanban card on the Pipeline board (excluding action buttons like call, whatsapp, and stage switcher) MUST navigate the browser to `/dashboard/facilities/[id]`.
- **FR-010-007**: Successful login MUST redirect the user to the Dashboard placeholder page (`/`) updated to display summary statistics cards (e.g., counts of facilities, follow-ups, offers, and contracts), rather than the empty welcome page.
- **FR-010-008**: The app shell header MUST display the authenticated user's name (display_name, falling back to email), their role name mapped to an Arabic equivalent:
  - `super_admin` -> "مشرف عام"
  - `company_admin` -> "مدير الشركة"
  - `supervisor` -> "مشرف"
  - `sales_user` -> "مسؤول مبيعات"
- **FR-010-009**: The header MUST display the name of the active company. For `super_admin`, this is the company corresponding to the `active_company_id` cookie (defaulting to their profile company if unset). For all other roles, this is their profile's company name.
- **FR-010-010**: The header MUST render the `CompanySwitcher` ONLY for users with the `super_admin` role.

### Key Entities

- **Profile**: Represents the authenticated user. Attributes: id, display_name, email, role, company_id.
- **Company**: Represents the tenant company. Attributes: id, name, status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-010-001**: 100% of implemented pages are reachable through sidebar links or inner lists (no manual URL entry needed).
- **SC-010-002**: Active page indicator updates correctly within 50ms of client-side navigation.
- **SC-010-003**: Sales users never see links to `/admin/companies` or `/admin/users` in the DOM or UI.
- **SC-010-004**: Clicking a Kanban card or facility row navigates to the facility details in under 200ms (client-side transition).

## Assumptions

- The routes for `/dashboard/facilities`, `/dashboard/pipeline`, `/dashboard/followups`, `/dashboard/offers`, `/dashboard/contracts`, `/admin/users`, `/admin/companies`, and `/profile` are pre-existing and active.
- Tailwind and custom CSS styles from Feature 001 are present and can be reused.
- Supabase client configurations and queries are functioning correctly.
