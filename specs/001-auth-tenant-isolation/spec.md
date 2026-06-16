# Feature Specification: Foundational Access Layer (Authentication & Tenant Isolation)

**Feature Branch**: `001-auth-tenant-isolation`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "Build the foundational access layer for the NEBRASGOO multi-tenant platform: authentication, tenant data isolation, and role-based access."

## Clarifications

### Session 2026-06-16
- Q: Does the multi-tenant system require globally unique emails or tenant-scoped unique emails? → A: Globally Unique Emails (an email address can only be registered to a single user in the entire system, automatically mapping them to their company upon authentication).
- Q: How should the system handle multiple consecutive failed login attempts? → A: Temporary Cooldown (throttle failed login attempts by enforcing a 30-second delay after 5 failed attempts).
- Q: Which access events should be audited, and where? → A: Database Audit Table (record logins, logouts, failed attempts, and company-switch actions in a database log table with user, event, timestamp, target company).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Arabic Login & Scoped Dashboard (Priority: P1)

An employee of either company enters their email and password to log in. The system authenticates them and redirects them to the authenticated dashboard shell, automatically configured for their specific company.

**Why this priority**: Absolute prerequisite. Users must be able to log in securely before doing anything else in the platform.

**Independent Test**:
Enter valid credentials for a user belonging to Company A ("نبراس الجودة"). The system logs the user in and opens the dashboard, displaying the "نبراس الجودة" branding and header badge. Enter incorrect credentials and verify that the screen displays a clear, localized Arabic error message without exposing details about whether the email or password was wrong.

**Acceptance Scenarios**:

1. **Given** the user is on the login page (in Arabic, RTL format, with Tajawal font), **When** they submit valid credentials for a Company A employee, **Then** they are redirected to the dashboard shell with Company A context.
2. **Given** the user is on the login page, **When** they submit invalid credentials, **Then** the page remains on the login screen, shows a clear Arabic error message, and does not establish a session.

---

### User Story 2 - Strict Tenant Data Isolation (Priority: P1)

An authenticated user works on the platform. The application ensures that they can only view and modify data belonging to their own company. Any attempts to access, query, or enumerate data belonging to the other company are rejected.

**Why this priority**: Critical commercial promise. Preventing cross-tenant data leakage is non-negotiable.

**Independent Test**:
While logged in as a Company A user, attempt to request or view mock records using direct URL manipulation (e.g., using parameters containing Company B identifiers). Verify that the system denies access (e.g., returning an access denied page/error in Arabic) and does not leak any Company B data.

**Acceptance Scenarios**:

1. **Given** a logged-in user belonging to Company A ("نبراس الجودة"), **When** they attempt to access any screen or route, **Then** the system filters all data and options to only display those belonging to Company A.
2. **Given** a logged-in user belonging to Company A, **When** they attempt to bypass UI controls by directly requesting a resource belonging to Company B ("تقنية الارتقاء"), **Then** the request is blocked server-side and the user is shown an "Access Denied" error in Arabic.

---

### User Story 3 - Role-Based Access Control in App Shell (Priority: P2)

An authenticated user navigates the application. The sidebar navigation and page controls adapt dynamically based on their assigned role: Company Admin, Supervisor, or Sales User. Controls and pages they are not permitted to use are hidden from the UI, and any direct attempts to access unauthorized endpoints are denied server-side.

**Why this priority**: Necessary to enforce proper business workflows and prevent unauthorized actions (e.g., a Sales User viewing team-wide reporting).

**Independent Test**:
Log in as a Sales User. Verify that team dashboards, supervisor reports, and settings pages are hidden from the sidebar. Attempt to access a supervisor report URL directly and verify that the page displays an access denied message.

**Acceptance Scenarios**:

1. **Given** a user logged in with the `Sales User` role, **When** they look at the sidebar navigation, **Then** they only see pages they are authorized to access (e.g., their assigned leads/dashboard), and administrative/reporting links are hidden.
2. **Given** a user logged in with the `Sales User` role, **When** they attempt to access a `Supervisor` or `Company Admin` page route directly, **Then** they are blocked and shown an authorization error in Arabic.
3. **Given** a user logged in with the `Supervisor` role, **When** they access the dashboard, **Then** they can view team-wide reporting and metrics for their company, but cannot perform company-wide administrative actions.

---

### User Story 4 - Super Admin Multi-Tenant Company Switcher (Priority: P2)

A user logged in with the `Super Admin` role sees all companies' contexts and can switch their active operating company on the fly using a dedicated UI control in the app shell. The application immediately updates the brand context and re-scopes all views to the selected company.

**Why this priority**: Required for top-level administrators who manage both companies under the NEBRASGOO brand.

**Independent Test**:
Log in as a Super Admin. Confirm that the app shell shows an active company marker (e.g., "Active Tenant: نبراس الجودة"). Click the switcher, select "تقنية الارتقاء", and verify the marker updates and the dashboard displays metrics and records for "تقنية الارتقاء".

**Acceptance Scenarios**:

1. **Given** a user logged in with the `Super Admin` role, **When** they are in the application, **Then** a company switcher is visible in the app shell.
2. **Given** a `Super Admin` switches the active company from Company A to Company B, **When** they navigate the application, **Then** all views and pages display data scoped exclusively to Company B.
3. **Given** a non-Super Admin user (e.g., Company Admin), **When** they are in the application, **Then** no company switcher is visible, and they cannot switch companies.

---

### User Story 5 - Session Termination & Forgot Password Gate (Priority: P3)

An employee logs out of the application to secure their session, or accesses the password recovery link if they cannot log in.

**Why this priority**: Basic security hygiene for public or shared devices.

**Independent Test**:
Click the "Logout" button in the app shell header or sidebar. Verify that the session is cleared, and trying to navigate back to the dashboard redirects the browser to the login screen. Click the "Forgot Password" link on the login page and verify it displays instructions in Arabic.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they click "Logout", **Then** the active session is destroyed and the user is redirected to the login page.
2. **Given** an unauthenticated visitor on the login page, **When** they click the "Forgot Password" link, **Then** they are presented with an Arabic dialog directing them to contact their company administrator to reset their password.

---

### Edge Cases

- **Brute-Force Protection / Login Cooldown**: When 5 consecutive failed login attempts occur on an account, any subsequent login attempt within 30 seconds must immediately fail with an Arabic message indicating they are throttled.
- **Session Expiry / Timeout**: If a user's session expires due to inactivity, the next interaction must redirect them to the login screen with a message explaining that their session has expired.
- **Direct Link Sharing**: If a logged-in user shares a URL to a specific record with a user of a different company, the recipient must be shown an authorization error, rather than the record contents.
- **Concurrent Company Switching**: If a Super Admin has multiple tabs open and switches the company in one tab, the other tabs must stay consistent or safely handle the change without cross-tenant data leakage.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST authenticate users using their email and password, returning a secure session token or cookie.
- **FR-002**: The login interface MUST be rendered in Arabic (`lang="ar"`, `dir="rtl"`) using the `Tajawal` typeface and follow the green/gold color scheme.
- **FR-003**: The system MUST determine the user's company membership from their account credentials upon successful login, and store this scoping in the session.
- **FR-004**: The system MUST enforce data isolation server-side by scoping all database queries and transactions by the active session's `company_id`.
- **FR-005**: The system MUST enforce role-based access control server-side, denying access by default to any action not explicitly allowed for the user's role.
- **FR-006**: The system MUST support four roles: `Super Admin`, `Company Admin`, `Supervisor`, and `Sales User`.
- **FR-007**: Only the `Super Admin` role MUST be allowed to operate across tenants via a manual company-switch action.
- **FR-008**: The system MUST provide an app shell containing a sidebar and header layout.
- **FR-009**: The app shell navigation MUST dynamically render links based on the authenticated user's role, hiding unauthorized options.
- **FR-010**: Unauthenticated users trying to access any protected route MUST be redirected to the login screen.
- **FR-011**: The login screen MUST include a "Forgot Password" link that displays an Arabic instruction modal or message.
- **FR-012**: User email addresses MUST be globally unique across all tenants to support direct authentication without company pre-selection.
- **FR-013**: The system MUST throttle failed login attempts by enforcing a 30-second cooldown period after 5 consecutive failures.
- **FR-014**: The system MUST record logins, logouts, failed authentication attempts, and Super Admin company-switching actions in a database audit log table.

### Key Entities *(include if feature involves data)*

- **Company**: Represents a tenant. Essential attributes include a unique identifier, name (e.g., "نبراس الجودة" or "تقنية الارتقاء"), and active status.
- **User**: Represents an employee. Essential attributes include a unique identifier, email (globally unique), hashed password, assigned `company_id` (foreign key to Company), assigned role, and status.
- **Session**: Represents an active authenticated state. Essential attributes include a session token, user identifier, associated `company_id`, active company override (for Super Admin only), and expiration timestamp.
- **AuditLog**: Represents a security/access event log. Essential attributes include a unique identifier, user identifier, event type (e.g., login, logout, failed_login, company_switch), target company identifier (if applicable), and timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully log in and see their scoped dashboard in under 2 seconds on a standard 3G/4G connection.
- **SC-002**: 100% of data reads and writes for non-Super Admin roles must be filtered by `company_id` at the data-access layer.
- **SC-003**: 100% of unauthorized route requests (both unauthenticated and role-violating) must be blocked and redirected with zero data leaks.
- **SC-004**: Keyboard-only users can navigate all elements of the login screen and sidebar shell.

## Assumptions

- **Pre-seeded Tenants**: The database/data store is pre-populated with the two companies ("نبراس الجودة" and "تقنية الارتقاء") and initial test accounts for each role.
- **Arabic Local Conventions**: Dates, numbers, and system messages will be formatted in Arabic.
- **Single Brand Theme**: Both tenants share the same base brand visual identity (deep green, gold, cream background) with the company name shown as the primary distinguishing factor.
- **Cookie/Token Session**: Authentication will use a secure cookie or token stored in the browser's session storage.
