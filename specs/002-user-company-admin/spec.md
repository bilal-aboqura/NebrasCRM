# Feature Specification: User and Company Administration

**Feature Branch**: `002-user-company-admin`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "Build user and company administration for the NEBRASGOO platform. This feature lets administrators create and manage the companies (tenants) and the people who work in them. It builds directly on Feature 001 (authentication, tenant isolation, the four roles, and the audit log already exist) and must respect all of its rules."

## Clarifications

### Session 2026-06-16
- Q: Should the system prevent the deactivation of the last remaining active Super Admin account in the entire system, to avoid a permanent lockout of platform administration? → A: Enforce server-side that the system must always have at least one active Super Admin account.
- Q: Can a user change their own email address via the self-service profile page, or is email change restricted to administrators? → A: No, email changes are restricted to administrators.
- Q: For administrative changes, should the audit log record the specific field-level changes (with before/after values) or just the action event? → A: Detailed logging (record specific fields changed with old and new values in the details JSON field, excluding sensitive data like passwords).
- Q: What password strength or complexity rules should be enforced when a user sets or updates their password? → A: Minimum 12 characters and a check against known breached/compromised passwords.
- Q: When an administrator triggers a password reset for a user, should the system immediately terminate all active sessions for that user? → A: Yes, immediately terminate all active sessions, forcing logout.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Company Directory and Management by Super Admin (Priority: P1)

Only the `Super Admin` can view, create, edit, and toggle activation status of companies (tenants) operating under the platform.

**Why this priority**: Core multi-tenant capability. Without managing company tenants, user onboarding and tenant isolation cannot be configured.

**Independent Test**:
Log in as a Super Admin. Navigate to the "إدارة الشركات" (Company Management) screen. Verify the directory displays all existing companies, their status, and current user counts. Create a new company "شركة الاختبار", edit its contact email, and deactivate it. Verify that deactivation prevents any user belonging to "شركة الاختبار" from logging in, even with correct credentials.

**Acceptance Scenarios**:

1. **Given** a logged-in `Super Admin` in the Arabic/RTL control panel, **When** they view the company list, **Then** they see a table with each company's Arabic name, status (active/inactive), and count of associated users, right-aligned, formatted with the Tajawal typeface.
2. **Given** a logged-in `Super Admin`, **When** they submit the new company form with name, contact details, and initial status, **Then** the company is created, its default status is applied, and a record is added to the database audit log.
3. **Given** a company's status is toggled to "Inactive" by a Super Admin, **When** any user associated with that company attempts to authenticate, **Then** they are denied access with a clear, localized Arabic error message ("حساب الشركة الخاص بك غير نشط. يرجى التواصل مع المسؤول").
4. **Given** any non-Super Admin user (e.g. `Company Admin`), **When** they attempt to access the company management URL, **Then** they are blocked server-side and shown a permission denied error.

---

### User Story 2 - Cross-Tenant User Directory and Creation by Super Admin (Priority: P1)

Only the `Super Admin` can view, create, and manage user accounts across all companies in the system, including assigning the `Super Admin` role. Changing a user's company membership (cross-company reassignment) is disallowed.

**Why this priority**: Required for system-wide operations, support, and initial setup of tenant administrators.

**Independent Test**:
Log in as a Super Admin. Go to the "إدارة المستخدمين" (User Management) screen. Verify users from all companies are listed. Create a new user, select "تقنية الارتقاء" as their company, and assign the `Company Admin` role. Verify the system generates a secure invitation link instead of asking for a password.

**Acceptance Scenarios**:

1. **Given** a logged-in `Super Admin`, **When** they view the user directory, **Then** they can see users from all companies, with options to filter the list by company, status, or role.
2. **Given** a `Super Admin` is creating a new user, **When** they fill the name, email, and select a company and any role (including Super Admin), **Then** the user is created in a "Pending Activation" status, and the system generates a secure invitation token.
3. **Given** a logged-in `Super Admin`, **When** they edit an existing user, **Then** they can modify the user's name or role (reassigning them to a different company is disabled).

---

### User Story 3 - Role-Scoped Tenant User Management by Company Admin (Priority: P1)

A `Company Admin` can manage user accounts strictly within their own company. They cannot see or manage users of other companies, create Super Admins, or reassign a user's company.

**Why this priority**: Core tenant administrative boundary. Enables each company to manage its own team members securely.

**Independent Test**:
Log in as a `Company Admin` for Company A ("نبراس الجودة"). Navigate to "إدارة المستخدمين". Verify that Company B's users are not visible. Try to create a user and verify the role dropdown only lists `Company Admin`, `Supervisor`, and `Sales User`, with no company selection option (locked to Company A). Try to access a Company B user's edit URL directly and verify a server-side 403 Forbidden is returned.

**Acceptance Scenarios**:

1. **Given** a logged-in `Company Admin` of Company A, **When** they view the user management dashboard, **Then** they see only the users belonging to Company A.
2. **Given** a logged-in `Company Admin` of Company A, **When** they create a new user, **Then** they can only choose roles `Company Admin`, `Supervisor`, or `Sales User`, and the user is automatically and unalterably bound to Company A.
3. **Given** a logged-in `Company Admin` of Company A, **When** they attempt to modify the details or status of a user belonging to Company B, **Then** the operation is rejected server-side and an audit log event is recorded tracking the unauthorized attempt.

---

### User Story 4 - Secure Password Set / Invitation Flow (Priority: P2)

When an administrator creates a user, the user must set their own password securely via an invitation link before logging in for the first time.

**Why this priority**: Enhances system security by avoiding administrative exposure to plaintext passwords.

**Independent Test**:
Create a user "سارة أحمد" through the admin interface. Notice that no password field was present. Capture the generated invitation link. Attempt to log in as "سارة أحمد" using the login form and verify access is denied. Open the invitation link, input a new password, and verify that the user can now successfully log in.

**Acceptance Scenarios**:

1. **Given** a user is newly created by an administrator, **When** the user attempts to log in, **Then** the system denies authentication with an Arabic message ("يرجى تفعيل حسابك أولاً باستخدام رابط الدعوة").
2. **Given** a user opens a valid invitation link, **When** they submit a password that is at least 12 characters long and passes a database breach check, **Then** the password is secure-hashed, the user's status is changed to "Active", and they are logged in.
3. **Given** an expired or invalid invitation link is accessed, **When** the page loads, **Then** it shows a clear error message in Arabic offering to request a new link.

---

### User Story 5 - Self-Service Profile & Password Update (Priority: P2)

Every authenticated user can update their display name and change their password. Changing the email address is restricted to administrators and is not available via self-service.

**Why this priority**: Standard self-service feature necessary for basic account maintenance.

**Independent Test**:
Log in as a `Sales User`. Click on "الملف الشخصي" (My Profile). Update the display name to "أحمد الحربي" and save. Go to "تغيير كلمة المرور" (Change Password), input the current password and a new password, and save. Log out, and log back in using the new password.

**Acceptance Scenarios**:

1. **Given** any authenticated user on the profile screen, **When** they update their display name, **Then** the change is saved immediately and reflected in the app shell header.
2. **Given** a user changing their password, **When** they provide the correct current password and a valid new password, **Then** the password is changed, the session remains active, and future logins require the new password.

---

### Edge Cases

- **Email Uniqueness Conflict**: If an administrator attempts to create or edit a user using an email address that already exists in the system (regardless of company), the operation MUST fail with the message: "البريد الإلكتروني مسجل بالفعل في النظام".
- **Self-Deactivation / Self-Demotion / Lockout Prevention**: A logged-in `Super Admin` or `Company Admin` MUST NOT be allowed to deactivate their own account or demote their own role. Furthermore, the system MUST block the deactivation or role change of the last remaining active `Super Admin` account in the system, returning a clear Arabic error message ("يجب أن يكون هناك مشرف عام نشط واحد على الأقل في النظام").
- **Concurrent Deactivation**: If a user is actively logged in and their account (or company) is deactivated by an administrator, the user's next request/navigation MUST terminate their session immediately and redirect them to the login screen with a deactivation message.
- **Session Termination on Password Reset**: When an administrator initiates a password reset for a user, all active sessions for that user MUST be terminated immediately server-side. The user's next request/navigation will result in session destruction and redirection to the login screen with an Arabic message indicating they must complete the password reset flow.
- **Cross-Company Reassignment**: User accounts cannot be reassigned to a different company. To move a user, the administrator must deactivate the user in the current company and create a new user account under the new company. This maintains data isolation integrity and clear audit history.
- **Weak or Breached Password**: Attempting to set or change a password to one that is shorter than 12 characters or is found in a list of known breached/compromised passwords MUST be rejected with a clear Arabic error message ("يجب أن تكون كلمة المرور مكونة من 12 خانة على الأقل ولم تظهر في تسريبات البيانات السابقة").
- **Invitation Token Expiry**: Invitation tokens are single-use and expire exactly 72 hours after generation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Only users with the `Super Admin` role MUST be allowed to view, create, edit, deactivate, or reactivate companies (tenants).
- **FR-002**: Companies MUST NEVER be hard-deleted from the database; they are managed via an active/inactive status flag.
- **FR-003**: Deactivating a company MUST instantly block all of its users from authenticating or accessing any system resources.
- **FR-004**: Only the `Super Admin` role MUST be allowed to manage users across multiple companies. Cross-company user reassignment (changing an existing user's company) MUST be disabled for all roles.
- **FR-005**: A `Company Admin` MUST only be able to view, create, edit, or deactivate users within their own company (`company_id` matching the admin's company).
- **FR-006**: A `Company Admin` MUST NOT be allowed to assign the `Super Admin` role, create users outside their company, or see users of other companies.
- **FR-007**: User creation MUST NOT accept a plaintext password; instead, it MUST generate a secure, single-use token and invitation link.
- **FR-008**: User email addresses MUST remain globally unique across the entire platform.
- **FR-009**: Every administrative action (company creation/edit/status change, user creation/edit/status change, admin password reset) MUST be recorded server-side in the `AuditLog` table, including detailed before/after values for modified fields (excluding passwords).
- **FR-010**: All administration interfaces MUST be rendered in Arabic (`lang="ar"`, `dir="rtl"`) using the `Tajawal` font and follow the brand design system.
- **FR-011**: Users MUST be able to change their own password and display name through a self-service profile page. Users MUST NOT be allowed to change their own email address.
- **FR-012**: An administrator MUST be able to trigger a secure password reset link for any user under their management scope.
- **FR-013**: The system MUST enforce server-side that at least one active `Super Admin` user remains in the system at all times, blocking any administrative action that would result in zero active Super Admins.
- **FR-014**: The system MUST enforce password validation requiring a minimum length of 12 characters and verifying the password is not present in a database of known breached/compromised passwords.
- **FR-015**: Triggering an admin-initiated password reset MUST immediately invalidate all active sessions and tokens for the target user server-side.

### Key Entities *(include if feature involves data)*

- **Company (Tenant)**:
  - `id`: Unique identifier (UUID).
  - `name_ar`: Arabic name of the company (e.g., "نبراس الجودة").
  - `contact_email`: Contact email address.
  - `contact_phone`: Contact phone number.
  - `status`: Active or Inactive.
- **User**:
  - `id`: Unique identifier (UUID).
  - `email`: Globally unique email address.
  - `display_name`: User's full name.
  - `password_hash`: Secure hashed password (null for pending invitations).
  - `role`: One of `Super Admin`, `Company Admin`, `Supervisor`, `Sales User`.
  - `company_id`: References the user's home Company.
  - `status`: Active, Inactive, or Pending Activation.
  - `invitation_token`: Secure token for password creation.
  - `invitation_expires_at`: Expiration timestamp of the invitation.
- **AuditLog**:
  - `id`: Unique identifier.
  - `actor_id`: User ID of the administrator performing the action.
  - `event_type`: Type of administrative action (e.g., `company_create`, `user_deactivate`).
  - `target_company_id`: Scoped company associated with the target or action.
  - `details`: JSON field containing specific field-level changes with before and after values (e.g., `{"role": {"old": "sales_user", "new": "supervisor"}}`), excluding sensitive fields like passwords.
  - `timestamp`: Record creation timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of user listings and mutations requested by `Company Admin` roles are filtered/verified by `company_id` at the database query layer.
- **SC-002**: 100% of user creation and password resets utilize tokenized invitation flows; no plaintext passwords are typed by admins or sent in requests.
- **SC-003**: Administrative audit logs are written for 100% of write operations in the user and company management screens.
- **SC-004**: Company and user dashboards load in under 2 seconds, displaying clear Arabic RTL tables with pagination (max 25 records per page).

## Assumptions

- **Existing Audit Log Table**: The `AuditLog` table created in Feature 001 supports custom administrative event types and structured details.
- **Email Delivery Service**: The platform has a configured email service to deliver invitation and password reset links; for environments without SMTP, a copy-paste interface is provided in the UI for convenience.
- **Token Expiration**: The default token expiration is set to 72 hours and is managed server-side.
