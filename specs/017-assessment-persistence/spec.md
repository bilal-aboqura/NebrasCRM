# Feature Specification: Assessment Persistence and CRM Linking

**Feature Branch**: `017-assessment-persistence`  
**Created**: 2026-06-21  
**Status**: Draft  
**Input**: User description: "Build assessment persistence and CRM linking for the NEBRASGOO platform. This feature adds the ability to save a completed CBAHI self-assessment (from Feature 015) to the database and link it to a specific facility record in the CRM. It transforms the assessment from an ephemeral browser-only tool into a persistent, trackable record that consultants and managers can reference when working with a facility. It builds on Features 001–015 (auth, tenant isolation, roles, facilities, the facility detail page and activity timeline, and the self-assessment tool with its scoring logic and data) and must respect all their rules."

---

## Clarifications

### Session 2026-06-21

- Q: كيف يتم التعامل مع تقييم الزائر العام عند تعبئة نموذج طلب الاستشارة؟ → A: يتم تسجيل النسبة الإجمالية للجاهزية ونوع المنشأة فقط كحقل في تفاصيل المنشأة الجديدة أو في سجل الأنشطة (Activity Timeline) كإشارة مرجعية للمستشار، دون حفظ الإجابات التفصيلية للبنود في قاعدة البيانات.
- Q: ماذا يحدث لحدث النشاط في الخط الزمني للمنشأة عند أرشفة التقييم؟ → A: يظل حدث "تم حفظ التقييم" في الخط الزمني للمنشأة ولكن يتم تحديثه أو وسمه ليوضح أنه مؤرشف، كما يتم تسجيل حدث جديد في الخط الزمني عند أرشفة التقييم أو استعادته يوضح اسم المستخدم الذي قام بالإجراء.
- Q: كيف يتم تمثيل اتجاه درجة الجاهزية بصرياً عند وجود تقييمين أو أكثر؟ → A: يتم تمثيله بشكل نصي وبصري مبسط يعرض مقارنة مباشرة بين التقييم الأول والتقييم الأحدث (مثال: "45% ← 78% (+33%)") مع سهم ملون يدل على التقدم أو التراجع، دون استخدام رسوم بيانية معقدة.


---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saving a CRM-Linked Assessment (Priority: P1)

As an authenticated CRM consultant, I want to save a completed CBAHI self-assessment and link it to a specific facility in my company, so that I can persist the audit details and keep a record of the facility's compliance status.

**Why this priority**: Saving is the core requirement of this feature. Without it, assessments remain ephemeral, and the transition from a public tool to a CRM utility is incomplete.

**Independent Test**:
1. Log in to the CRM as a consultant.
2. Complete a CBAHI assessment (e.g., answer all dental complex questions).
3. Click the "حفظ التقييم" (Save Assessment) button.
4. Select an assigned facility from the list (or verify that it is pre-selected if launched from the facility detail page).
5. Click confirm. Verify that the assessment is persisted and you are redirected back to the facility detail page.

**Acceptance Scenarios**:
1. **Given** the user is logged in as a CRM consultant and has filled out a self-assessment, **When** they click "حفظ التقييم", **Then** the system presents a facility selection modal showing a searchable picker with facilities within their visibility scope.
2. **Given** the user launched the self-assessment from a facility's detail page, **When** they complete the assessment and click "حفظ التقييم", **Then** the facility is pre-selected and locked in the selection field.
3. **Given** the user saves the assessment, **When** the save is successful, **Then** the system records the facility, the facility type, the overall score, the exact per-item answers (item code, compliance status, and notes), the readiness tier, the assessor's profile, and the timestamp.
4. **Given** an unauthenticated public visitor is completing the self-assessment, **When** they finish the assessment, **Then** the "حفظ التقييم" button is not visible, and only the standard lead-capture CTA is shown.
5. **Given** an unauthenticated public visitor submits the lead capture form from their gap report, **When** the new facility record is created, **Then** the system records their overall readiness score percentage and facility type in the facility's details/metadata or activity timeline as reference, without creating a detailed assessment answers snapshot.

---

### User Story 2 - Facility Self-Assessment History (Priority: P1)

As a CRM user (consultant, supervisor, or administrator), I want to see the history of all self-assessments completed for a facility on its detail page, so that I can track its readiness level and progress over time.

**Why this priority**: High value for consultants to see previous audits at a glance on the facility detail page, providing context before calling or visiting the facility.

**Independent Test**:
1. Navigate to the detail page of a facility that has saved assessments.
2. Locate the "التقييم الذاتي" (Self Assessment) section.
3. Verify that all completed assessments are listed chronologically (newest first) with their completion date, assessor name, score percentage, and facility type.
4. Verify that a score trend indicator is shown comparing the initial and latest scores.

**Acceptance Scenarios**:
1. **Given** a facility has saved assessments, **When** a user views the facility detail page, **Then** the system displays a new "التقييم الذاتي" section showing a list of saved assessments sorted by date (newest first).
2. **Given** the history list is rendered, **When** displaying each assessment, **Then** the system shows the date of assessment, the assessor's display name, the facility type (general/dental), and the score percentage inside a colored badge/ring corresponding to the readiness tier (green for high, gold for medium, red for low).
3. **Given** multiple assessments exist for a facility, **When** viewing the history section, **Then** the system shows a progression text comparison displaying the oldest vs. the newest assessment score (e.g. "45% ← 78% (+33%)") with a colored arrow indicating progress (green for increase, red for decrease).
4. **Given** a sales user is viewing a facility, **When** they do not have visibility rights to that facility, **Then** they cannot access the facility's detail page or see its assessments.

---

### User Story 3 - View Saved Assessment Details (Priority: P1)

As a CRM user, I want to open a saved assessment from the facility detail page to view its full details in a read-only format, so that I can see the exact compliance status and notes for each standard.

**Why this priority**: Crucial for diagnostic purposes. Consultants must be able to review the detailed gap report and notes of past assessments to plan remediation.

**Independent Test**:
1. Click on a specific assessment record from the facility's assessment history.
2. Verify that a read-only assessment view is opened.
3. Verify that the view displays all chapters, standards, compliance selections, and assessor notes.
4. Verify that all inputs are disabled (read-only) and there is no save button.

**Acceptance Scenarios**:
1. **Given** the user is viewing the facility assessment list, **When** they click on a specific historical assessment, **Then** the system opens a detailed read-only assessment page.
2. **Given** the detailed assessment page is open, **When** displaying the standards, **Then** the system shows the exact selected status ("متوفر", "جزئي", "غير متوفر", "غير منطبق") and notes entered by the assessor at that time.
3. **Given** the detailed assessment page is open, **When** rendering the page, **Then** all interactive elements (dropdowns, textareas) are disabled, the score is fixed, and the overall gap report and recommendations are shown.
4. **Given** the user is viewing a saved assessment, **When** they try to make edits, **Then** the system prevents changes because the assessment record is immutable.

---

### User Story 4 - Launch Pre-Linked Assessment (Priority: P2)

As a CRM consultant, I want to start a new assessment directly from a facility's detail page, so that the assessment tool opens with the facility pre-linked and the type pre-selected, reducing manual steps.

**Why this priority**: Simplifies the consultant workflow by bypassing the manual facility selection and type mapping steps when auditing an existing facility.

**Independent Test**:
1. Navigate to the facility detail page for a facility with type "medical_complex".
2. Click the "بدء تقييم جديد" (Start New Assessment) button.
3. Verify that the assessment tool opens, the facility type "المجمعات الطبية العامة" is automatically selected, and the facility name is shown as linked.

**Acceptance Scenarios**:
1. **Given** the user is on the facility detail page, **When** they click "بدء تقييم جديد", **Then** the system redirects to the self-assessment tool.
2. **Given** the facility's type in the database is "medical_complex", **When** the assessment tool loads, **Then** it automatically pre-selects the "المجمعات الطبية العامة" (General Medical Complexes) standards.
3. **Given** the facility's type in the database is "dental_complex", **When** the assessment tool loads, **Then** it automatically pre-selects the "مجمعات / مراكز الأسنان" (Dental Centers) standards.
4. **Given** the assessment tool is opened from a facility detail page, **When** the tool loads, **Then** the system displays a banner indicating that the assessment is pre-linked to that facility.

---

### User Story 5 - Assessment Soft-Archiving and Recovery (Priority: P3)

As a CRM supervisor or administrator, I want to soft-archive outdated or erroneous assessments and recover them if needed, so that I can maintain a clean assessment history without permanently losing data.

**Why this priority**: Essential administrative task to manage assessment quality and clean up duplicate or erroneous logs.

**Independent Test**:
1. Log in as a supervisor or admin.
2. Open a saved assessment detail page or locate it in the history list.
3. Click "أرشفة التقييم" (Archive Assessment) and confirm. Verify it disappears from the default list.
4. Go to the archived assessments list/toggle, locate the archived assessment, and click "استعادة" (Recover) to restore it.

**Acceptance Scenarios**:
1. **Given** a user is logged in as a supervisor or admin, **When** they view a saved assessment, **Then** they see an "أرشفة التقييم" option.
2. **Given** a supervisor or admin clicks "أرشفة التقييم" and confirms, **When** the action completes, **Then** the assessment's archived status is set to true, and it is removed from the active facility history list.
3. **Given** a sales_user is viewing the same facility or assessment, **When** they view the page, **Then** they do not see the archive button and cannot view archived assessments.
4. **Given** a supervisor or admin has toggled the view to show archived assessments, **When** they click "استعادة" on an archived assessment, **Then** the assessment is restored to the active list.
5. **Given** an assessment is archived or restored, **When** the action completes, **Then** the system logs a new activity in the facility timeline (e.g. "تم أرشفة التقييم بواسطة المشرف" or "تم استعادة التقييم بواسطة المشرف") and updates the original "تم حفظ التقييم" timeline entry to display a "مؤرشف" (archived) status tag or visual indicator.

---

### Edge Cases

- **Change in Facility Ownership / Assigned Sales User**:
  - *Scenario*: A sales user completes an assessment for a facility assigned to them. Later, the facility is re-assigned to another sales user.
  - *Handling*: The original assessor's name remains on the assessment record, but the original assessor can no longer view or access the assessment or the facility detail page, as visibility inherits the parent facility.
- **Unmapped Facility Type**:
  - *Scenario*: A facility has a type like "laboratory" or "general_hospital" which does not map to a standard CBAHI questionnaire type (General or Dental).
  - *Handling*: The "بدء تقييم جديد" button opens the self-assessment page with the facility pre-linked, but does not pre-select a facility type. The user is prompted to choose a type manually.
- **Direct Save Attempt (Unauthorized)**:
  - *Scenario*: An authenticated user tries to save an assessment against a facility belonging to another company (tenant bypass) or a facility they do not have edit rights to.
  - *Handling*: The system rejects the operation server-side, returning an authorization/permission error.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: **Authentication-Aware Save UI**: The system MUST show the "حفظ التقييم" (Save Assessment) button only to authenticated CRM users. Public visitors MUST NOT see this button.
- **FR-002**: **Tenant Isolation**: Assessments MUST be isolated by company. Users from Company A MUST NOT be able to view, search, create, or modify assessments from Company B.
- **FR-003**: **Visibility Scope Inheritance**: Assessment access permissions MUST inherit from the linked Facility. A user can only view assessments for a facility if they have permission to view that facility.
- **FR-004**: **Creation Scope Enforcement**: A sales user MUST only be able to save an assessment for a facility assigned to them. Supervisors and admins can save assessments for any facility within their company.
- **FR-005**: **Searchable Facility Picker**: When saving an assessment directly (not pre-linked), the system MUST provide a searchable dropdown listing all active facilities that the user has permission to edit.
- **FR-006**: **Assessment Snapshot Persistence**: Saved assessments MUST store:
  - Associated company identity
  - Associated facility identity
  - Assessor's profile identity
  - Facility type assessed (general/dental)
  - Overall score percentage (percentage score computed at save time)
  - Readiness tier (computed readiness level based on score)
  - Answers (snapshot of item codes, compliance statuses, and free-text notes)
  - Date and time created (immutable timestamp)
- **FR-007**: **Immutability of Saved Audits**: Once saved, assessments MUST be immutable. Modifications, corrections, or updates are disabled. If a correction is needed, the user MUST run a new assessment.
- **FR-008**: **Activity Timeline Logging**: Saving an assessment MUST write an entry to the facility's activity timeline specifying the readiness tier, the score, and the name of the assessor in Arabic.
- **FR-016**: **Timeline Updates on Archiving/Recovery**: When an assessment is archived or recovered, the system MUST: (a) log a new event in the facility's activity timeline indicating the action and the user responsible, and (b) update the original "تم حفظ التقييم" timeline entry with a status tag reflecting that the assessment is archived.
- **FR-009**: **Facility Detail Integration**: The facility detail page MUST render an assessment history tab/section ("التقييم الذاتي") listing saved assessments sorted chronologically.
- **FR-010**: **Read-Only Detail Modal/View**: Clicking an assessment in the history list MUST open a read-only detailed view showing the score, the status of all items, notes, gaps, and recommendations.
- **FR-011**: **Chronological Score Trend**: The facility detail page assessment section MUST display a progression text comparison displaying the oldest vs. the newest assessment score (e.g. "45% ← 78% (+33%)") with a colored arrow indicating progress (green for increase, red for decrease) if two or more assessments exist.
- **FR-012**: **Pre-linked Assessment Launch**: On the facility detail page, the system MUST show a "بدء تقييم جديد" (Start New Assessment) button that opens the assessment tool with the facility pre-linked and the questionnaire type pre-selected based on the facility's type.
- **FR-013**: **Soft-Archiving Option**: The system MUST allow supervisors and administrators to soft-archive an assessment, setting its archived status to true.
- **FR-014**: **Admin Recovery Workflow**: Supervisors and administrators MUST be able to view soft-archived assessments and recover them (setting archived status to false).
- **FR-015**: **Arabic-First RTL Layout**: All UI components (modals, forms, detail views, trend charts) MUST be in Arabic, aligned RTL, and adhere to the platform's color palette (deep green and gold).

---

### Key Entities

- **Assessment**:
  - **company_id**: Reference to the company (tenant isolation).
  - **facility_id**: Reference to the linked facility.
  - **assessed_by**: Reference to the User Profile of the assessor.
  - **facility_type_assessed**: String enum (`general`, `dental`).
  - **overall_score**: Numeric value representing the score percentage (0.0 to 100.0).
  - **readiness_tier**: String enum (`high`, `medium`, `low`).
  - **answers**: Collection of answer items, where each item contains:
    - `item_code`: String (e.g. "LD-01")
    - `status`: String enum (`available`, `partial`, `unavailable`, `not_applicable`)
    - `notes`: Optional String containing notes or evidence description.
  - **is_archived**: Boolean flag indicating if the assessment is soft-archived.
  - **created_at**: Immutable timestamp.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consultant can complete and save a facility assessment with 33 items, resulting in a successful database write, facility activity timeline log, and redirect in under 3 seconds.
- **SC-002**: Assessment list and score trend on the facility detail page load in under 200 milliseconds.
- **SC-003**: 100% of saved assessments are strictly isolated by company, validated by automated server-side checks.
- **SC-004**: System prevents editing of saved assessments, maintaining a perfect history log for audit trails.
- **SC-005**: 100% of user interface elements (facility selector, saved detail modal, list, and trends) render in Arabic and RTL format.

---

## Assumptions

- **Existing Self-Assessment Tool**: Feature 016's self-assessment tool UI layout and scoring logic are fully functional and will be reused for rendering the read-only saved assessment view.
- **Pre-selection Type Mapping**:
  - `medical_complex` (مجمع طبي) and `general_hospital` map to "general" (المجمعات الطبية العامة).
  - `dental_complex` (مجمع أسنان) and `dental_clinic` map to "dental" (مجمعات / مراكز الأسنان).
- **Trend Visual representation**: The trend of multiple assessments is displayed as a simple timeline or a small trend indicator (e.g., "+15% منذ التقييم الأول") rather than requiring a complex chart if space is limited.
- **Soft-Archiving**: Soft-archived assessments are excluded from normal queries and are only fetched when administrators specifically request to see archived assessments.
- **Activity Log**: The facility activity log infrastructure is extensible to support saving custom assessment activities.
- **User Session**: The user profile is accessible in the context of the assessment tool for authenticated users, allowing us to display/hide the save button and pre-populate the assessor ID.

---

## Out of Scope

- Uploading evidence documents per assessment item.
- Automated gap-to-action-plan generation.
- Assessment templates that can be customized or versioned dynamically (the items are fixed from the CBAHI standards).
- Sharing assessment results with the facility client.

