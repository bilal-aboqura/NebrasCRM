# Feature Specification: Public Lead Capture Form

**Feature Branch**: `015-public-lead-capture`  
**Created**: 2026-06-21  
**Status**: Draft  
**Input**: User description: "Build the public lead-capture form for the NEBRASGOO landing page. When a visitor submits their facility details, the system creates a new facility record inside the CRM (tenant-scoped, unassigned, status = new, lead_source = website_form). This is the bridge between the public website and the internal CRM. It fills the placeholder left by Feature 013 (landing page) and builds on Feature 003 (facility entity, phone normalization, duplicate detection) while requiring NO visitor authentication."

## Clarifications

### Session 2026-06-21

- **Q1: How should duplicate check behave if a matching phone number belongs to an archived facility?**  
  **A**: Re-activate and update the facility. The system restores the archived facility record to active status (`isArchived = false`), updates its details with the new submission data, sets status = `new`, resets `ownerId = null`, and logs the re-activation/creation event.
- **Q2: How should the success state be presented to the visitor after a successful submission?**  
  **A**: Replace the form content in-place with a clean success card containing a green checkmark and the success message.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Public Lead Request Submission (Priority: P1)

As a website visitor (facility owner or manager), I want to submit my facility name, type, city, and phone number without logging in, so that I can request a free CBAHI readiness assessment from NEBRASGOO.

**Why this priority**: Core requirement. This is the main lead-capture bridge between the public website and the CRM.

**Independent Test**: Load the public marketing landing page, navigate to the assessment booking section, fill in all fields with valid data, and submit. Check that the success screen is displayed, and check the CRM database/admin view to ensure the lead is created as a new, unassigned facility with `lead_source = website_form` and an activity timeline log.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor is in the lead-capture section of the landing page, **When** they fill out all required fields (اسم المنشأة, المدينة, رقم الجوال, نوع المنشأة) and click submit, **Then** the system creates a new facility record, assigns it to the designated default company context, and shows a success message.
2. **Given** an unauthenticated visitor is in the lead-capture section, **When** they attempt to submit with any missing required field, **Then** the form displays standard Arabic inline error messages and blocks submission.
3. **Given** an unauthenticated visitor, **When** they enter a phone number in any common format (e.g., "0501112233", "+966 50 111 2233"), **Then** the system normalizes it correctly before checking for duplicates or saving.

---

### User Story 2 - Duplicate Lead Submission Handling (Priority: P1)

As a visitor who has already requested an assessment, I want the system to recognize my existing request if I submit again, so that I am notified without having a duplicate record created.

**Why this priority**: Prevent CRM clutter and sales rep confusion by enforcing primary phone uniqueness.

**Independent Test**: Submit a lead with phone number "050 111 2233". After success, attempt to submit another lead using the same phone number (or formatted as "+966501112233"). Verify that the second submission does not create a new facility and shows the friendly Arabic duplicate message.

**Acceptance Scenarios**:

1. **Given** a facility with normalized phone number "+966501112233" already exists and is active under any company, **When** a visitor submits a new lead with a phone number that normalizes to "+966501112233", **Then** the system blocks the creation and displays: "تم تسجيل طلبك مسبقاً، سيتواصل معك فريقنا قريباً".
2. **Given** a facility with normalized phone number "+966501112233" already exists but is archived, **When** a visitor submits a new lead with a phone number that normalizes to "+966501112233", **Then** the system restores the facility (`isArchived = false`), updates its details, sets its status to `"new"`, sets `ownerId = null`, sets its company ID to the default company, logs the event in the activity timeline, and displays the success message in-place.

---

### User Story 3 - Submission Rate Limiting and Abuse Prevention (Priority: P2)

As a system owner, I want the lead submission endpoint to block rapid, repetitive submissions from the same source, so that the CRM is protected from spam and automated bot attacks.

**Why this priority**: High priority for public endpoints to prevent database bloat and API denial-of-service.

**Independent Test**: Trigger 6 submissions from the same IP address within a short period (under an hour). Verify that the 6th submission fails with a rate-limit error message and does not write to the database.

**Acceptance Scenarios**:

1. **Given** an IP address has submitted 5 requests within an hour, **When** they submit a 6th request within that same hour, **Then** the system rejects the submission and returns a friendly Arabic rate-limiting warning.

---

### Edge Cases

- **Missing Default Company Configuration**: If the configurable environment variable for the target company ID is not set or refers to a non-existent company ID, the system should default to the primary tenant's company ID (e.g., "نبراس الجودة") and log a warning in the system logs.
- **Client Input HTML/Script Injection**: If a visitor enters HTML or JS tags into the facility name or city fields, the system must sanitize the inputs server-side (strip all tag content, trim leading/trailing whitespace) before inserting the record into the database.
- **Cross-Boundary Phone Inputs**: If a phone number is provided that is completely invalid or cannot be normalized by the Saudi phone utility, the system must reject it with a validation error: "رقم الجوال المدخل غير صحيح. يجب أن يكون رقماً سعودياً صالحاً".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render the lead-capture form inside the public landing page with the header "احجز تقييم جاهزية مجاني".
- **FR-002**: The form MUST include the following inputs, all of which are mandatory:
  - **اسم المنشأة (Facility Name)**: Free-text input.
  - **المدينة (City)**: Free-text input.
  - **رقم الجوال (Phone)**: Text input with helper text indicating Saudi mobile format.
  - **نوع المنشأة (Facility Type)**: Dropdown selection containing: مجمع طبي, مجمع لطب الأسنان, مختبر, مركز أشعة, مستشفى.
- **FR-003**: The submission endpoint MUST be a public action/endpoint that does NOT require authentication.
- **FR-004**: The system MUST sanitize all text inputs on the server-side to strip HTML/scripts, trim whitespace, and limit length (e.g., max 255 characters for text inputs).
- **FR-005**: The system MUST normalize the submitted phone number using the shared `normalizeSaudiPhone` utility prior to duplicate checks and storage.
- **FR-006**: The system MUST perform a duplicate check by searching for the normalized primary phone number across ALL companies in the CRM database (active and archived).
- **FR-007**: If a duplicate primary phone is found on an active facility, the system MUST NOT create a new facility record and MUST return a friendly Arabic message: "تم تسجيل طلبك مسبقاً، سيتواصل معك فريقنا قريباً".
- **FR-008**: If a duplicate primary phone is found on an archived facility, the system MUST restore the facility record to active status (`isArchived = false`), update its details (name, type, notes with the submitted city), set status to `"new"`, reset `ownerId` to null, update `companyId` to the default company, log the restoration event in the activity timeline, and display the success message.
- **FR-009**: If the submission is unique, the system MUST create a new facility record with:
  - `name`: Submitted facility name.
  - `type`: Submitted facility type.
  - `city`: Placed inside the `notes` field as free-text (e.g., "المدينة المدخلة: [المدينة]").
  - `region`: Left empty or set to a default (e.g., "غير محدد" / "Unspecified").
  - `primaryPhone`: Normalized phone number.
  - `status`: Set strictly to `"new"`.
  - `lead_source`: Set strictly to `"website_form"`.
  - `ownerId`: Set strictly to `null` (unassigned).
  - `companyId`: Set to the company ID retrieved from the configured environment variable `DEFAULT_LEAD_COMPANY_ID`.
- **FR-010**: The system MUST log the creation or restoration event in the activity timeline (event type = `facility_created` or `facility_recovered`, with message noting submission source as website form).
- **FR-011**: The endpoint MUST NOT expose internal facility IDs, database primary keys, or tenant configurations in the client response.
- **FR-012**: The system MUST enforce client rate limiting allowing a maximum of 5 form submissions per IP address per hour. If exceeded, it returns the Arabic message: "لقد تجاوزت الحد الأقصى للمحاولات المسموح بها. يرجى المحاولة مرة أخرى لاحقاً."
- **FR-013**: The lead-capture form MUST handle successful submissions by replacing the form inputs in-place with a success message container displaying a green checkmark and the text: "تم استلام طلبك بنجاح، سيتواصل معك فريق نبراس الجودة قريباً".
- **FR-014**: The user interface of the form, including success/error messages and validation feedback, MUST be in Arabic, use the Tajawal font, support RTL layout, and fit seamlessly into the design system of the public landing page.

### Key Entities *(include if feature involves data)*

- **Visitor Submission (Transient)**:
  - `facilityName`: String (required, max 100 characters)
  - `city`: String (required, max 100 characters)
  - `phone`: String (required, validated & normalized)
  - `facilityType`: Enum (medical_complex, dental_complex, lab, radiology, hospital)
- **Facility (CRM Extension)**:
  - `lead_source`: New field or property representing how the lead entered the CRM (values: `"manual"`, `"website_form"`, `"imported"`).
  - `notes`: Extended to contain the free-text city submitted by the public visitor for sales team follow-up and normalization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public submissions bypass authentication checks while strictly preventing updates to unauthorized fields (e.g., custom company ID, assigned owner, or status other than "new").
- **SC-002**: Double-submission/duplicate attempts using the same phone number result in zero duplicate database records and 100% display of the friendly duplicate notice.
- **SC-003**: The form handles validation, normalization, and database insertion in under 1.5 seconds.
- **SC-004**: Rate limiting correctly triggers after the 5th submission from a single IP within a rolling 60-minute window, blocking subsequent writes.

## Assumptions

- **Target Company Context**: The environment variable `DEFAULT_LEAD_COMPANY_ID` is set to the correct company ID in production (representing "نبراس الجودة").
- **RTL and Styling**: The form components will utilize the existing Tailwind configuration and Tajawal font styling from the landing page.
- **IP Detection**: The deployment environment reliably exposes the client IP in standard request headers (e.g., `x-forwarded-for` or Next.js `headers()`).
- **Shared Normalization**: The `normalizeSaudiPhone` utility from Feature 003 is robust and works correctly for all common Saudi phone formats.
