# Feature Specification: CBAHI Self-Assessment Tool

**Feature Branch**: `016-cbahi-self-assessment`  
**Created**: 2026-06-21  
**Status**: Draft  
**Input**: User description: "Build the CBAHI self-assessment tool for the NEBRASGOO platform. This is an interactive, Arabic-first questionnaire that lets a user (visitor or consultant) evaluate a medical facility's readiness for CBAHI accreditation, chapter by chapter, producing a readiness score and a gap report."

---

## Clarifications

### Session 2026-06-21

- Q: What action should the Call-to-Action (CTA) in the generated gap report take for public visitors? → A: Display a "طلب استشارة مجانية" (Request Free Consultation) button that redirects to the public lead capture form, pre-filling the URL with the facility type and score.
- Q: Should we provide a dedicated "طباعة التقرير" (Print Report) button in the user interface to trigger printing? → A: Add a "طباعة التقرير" (Print Report) button next to the reset button that triggers the browser's print function (`window.print()`).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Facility Type Selection & Form Load (Priority: P1)

As a public visitor or consultant, I want to select the medical facility type so that I can see the exact chapters and assessment items applicable to my facility.

**Why this priority**: Choosing the facility type is the starting point of the assessment. Without it, the user cannot load the relevant standards or start answering.

**Independent Test**: The user navigates to the assessment page, selects "المجمعات الطبية العامة" (General Medical Complexes) and verifies that the 11 general chapters are displayed. They then switch to "مجمعات / مراكز الأسنان" (Dental Centers) and verify that the 6 dental chapters are displayed.

**Acceptance Scenarios**:
1. **Given** the user is on the self-assessment tool page, **When** they select "المجمعات الطبية العامة", **Then** the system displays 11 chapters (LD, PC, LB, RD, DN, MM, MOI, IPC, FMS, DPU, DA) with their respective 33 assessment items.
2. **Given** the user is on the self-assessment tool page, **When** they select "مجمعات / مراكز الأسنان", **Then** the system displays 6 chapters (LD, PC, DL, MOI, IPC, FMS) with their respective 23 assessment items.
3. **Given** the user has started answering questions for one facility type, **When** they switch to the other facility type, **Then** all previous answers, notes, and scores are reset, and a warning is shown to prevent accidental data loss.

---

### User Story 2 - Chapter-Based Assessment & Live Scoring (Priority: P1)

As a public visitor or consultant, I want to answer the assessment items chapter by chapter and see my overall readiness score update in real-time, so that I get immediate feedback on my facility's compliance level.

**Why this priority**: The core interactive value of the tool lies in filling out the items and seeing the live score, helping the user understand their level of preparation.

**Independent Test**: The user fills out a few items with different compliance levels ("متوفر", "جزئي", "غير متوفر", "غير منطبق") and notes that the score ring, progress bar, counts, and readiness text update instantly.

**Acceptance Scenarios**:
1. **Given** a facility type has been selected, **When** the user marks an item as "متوفر" (1 point), "جزئي" (0.5 points), or "غير متوفر" (0 points), **Then** the live readiness score updates immediately based on the formula: `(total points earned / total applicable points) * 100`.
2. **Given** a user is filling out the assessment, **When** they mark an item as "غير منطبق" (not applicable), **Then** this item is excluded from both the numerator and the denominator of the score calculation.
3. **Given** the live readiness score is updated, **When** the score falls into a specific tier, **Then** the system displays the corresponding readiness level text and color:
   - **≥85%**: جاهزية عالية — ينصح بتنفيذ زيارة محاكاة قبل التقديم. (High readiness)
   - **65–84%**: جاهزية متوسطة — توجد فجوات تحتاج خطة تحسين واضحة. (Medium readiness)
   - **<65%**: جاهزية منخفضة — يوصى بمشروع تجهيز شامل قبل التقديم للاعتماد. (Low readiness)
4. **Given** the live readiness score is updated, **When** the user changes an answer, **Then** the counts for "متوفر", "جزئي", "غير متوفر", and "غير منطبق" update in the stats breakdown.

---

### User Story 3 - Gap Report Generation & Printing (Priority: P2)

As a user, I want to generate a readiness summary report and print it so that I can share the gaps and recommendations with my team or management.

**Why this priority**: The printed gap report is the tangible deliverable that the visitor or consultant takes away to plan their next steps or prepare their remediation plan.

**Independent Test**: The user completes an assessment, clicks the "إصدار تقرير الجاهزية" button, views the generated report details on the screen, and triggers the browser's print dialog to verify a clean, single-page or multi-page layout styled for RTL Arabic printing.

**Acceptance Scenarios**:
1. **Given** the user has answered at least one item, **When** they click "إصدار تقرير الجاهزية", **Then** a report section is rendered displaying:
   - Assessed facility type
   - Overall readiness percentage
   - Counts breakdown by compliance status
   - General recommendation based on the score tier
   - A list of the top gaps (items scored as 0 or 0.5 or left unanswered) showing their codes, questions, and status.
2. **Given** the gap list is generated, **When** there are more than 25 gap items, **Then** the report displays the top 25 most critical gaps for readability, indicating that there are additional gaps.
3. **Given** the user triggers the browser print dialog, **When** the page prints, **Then** the printed document includes only the gap report and assessment details, hiding navigation headers, footers, and interactive buttons, formatted in clean, RTL Arabic layout.
4. **Given** the user is a public visitor and has generated a report, **When** they click "طلب استشارة مجانية", **Then** they are redirected to the public lead capture form with the facility type and readiness score pre-filled as URL parameters.
5. **Given** a gap report has been generated, **When** the user clicks the "طباعة التقرير" button, **Then** the browser's native print interface is opened.

---

### User Story 4 - Chapter Filtering & Assessment Reset (Priority: P3)

As a user dealing with a long checklist, I want to filter the questions by chapter and be able to reset the entire form so that I can manage my work easily.

**Why this priority**: Improves usability for large facility types with many questions, allowing focused work on a single department or clearing the form to start fresh.

**Independent Test**: The user filters the display to only see "خدمات المختبر" and confirms other chapters are hidden. They then click the reset button and verify that all selections and notes are cleared.

**Acceptance Scenarios**:
1. **Given** a facility type is active, **When** the user selects a specific chapter from the filter dropdown, **Then** only the items belonging to that chapter are shown, while selecting "كل الفصول" restores all chapters.
2. **Given** the user has answered items and written notes, **When** they click "تصفير التقييم" and confirm the prompt, **Then** all dropdown selections and notes textareas are cleared, and the score resets to 0%.

---

### Edge Cases

- **No answers provided yet**: If the user generates a report without answering any items, the system treats all items as gaps, shows a 0% score, and lists the top 25 items as unanswered gaps.
- **All items marked "غير منطبق" (Not Applicable)**: If all items are excluded from scoring, the denominator becomes 0. The system must display a 0% score or "غير محدد" and show a friendly message indicating that no items are applicable.
- **Accidental navigation or tab closure**: Since no database persistence is implemented in this phase, refreshing or closing the browser tab will lose the progress. The page must display a standard browser confirmation dialog before unloading if the user has entered any answers.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: **No-Authentication Access**: The system MUST allow public visitors to access the self-assessment tool route without logging in.
- **FR-002**: **Authentication Compatibility**: The system MUST allow authenticated users (e.g. consultants) to access the same self-assessment tool route with the same functionality.
- **FR-003**: **Facility Type Options**: The system MUST provide a selection between two facility types:
  - المجمعات الطبية العامة (General Medical Complexes - 11 chapters, 33 items)
  - مجمعات / مراكز الأسنان (Dental Centers - 6 chapters, 23 items)
- **FR-004**: **RTL Arabic Display**: The user interface MUST be fully localized in Arabic and rendered in Right-to-Left (RTL) format.
- **FR-005**: **Static Question Loading**: The assessment questions, codes, and suggested evidence MUST be loaded from embedded static data (sourced from the client's provided question matrix).
- **FR-006**: **Item Compliance Status**: For each item, the user MUST be able to choose one of four compliance statuses:
  - متوفر (1 point)
  - جزئي (0.5 points)
  - غير متوفر (0 points)
  - غير منطبق (not applicable, excluded from scoring)
- **FR-007**: **Optional Notes/Evidence**: For each item, the user MUST be able to enter free-text notes/evidence in an optional input field.
- **FR-008**: **Live Scoring**: The system MUST compute and display the overall readiness score live using the standard formula.
- **FR-009**: **Readiness Tier Visuals**: The overall score must be displayed prominently using a circular progress ring, a progress bar, and a textual readiness level with colors reflecting the tier (green/gold/red).
- **FR-010**: **Chapter Filtering**: The user MUST be able to filter the visible list of items to a single chapter or view all chapters.
- **FR-011**: **Ephemeral Browser State**: All assessment inputs MUST live in the client-side state. The system is NOT required to persist answers to the database in this feature.
- **FR-012**: **Gap Report Generation**: Clicking the report generation button MUST compile and render a summary card containing the score, count metrics, tier-based recommendation, and a list of the top gaps (up to 25 items). For public visitors, the report MUST include a "طلب استشارة مجانية" (Request Free Consultation) CTA button that redirects to the public lead capture form, pre-filling the URL parameters with the facility type and readiness score.
- **FR-013**: **Print Trigger and Optimization**: The system MUST provide a "طباعة التقرير" (Print Report) button to trigger the browser's print interface (`window.print()`), and the printed document MUST use a print-friendly layout that hides page navigation, buttons, and interactive inputs.
- **FR-014**: **Reset Action**: The user MUST be able to clear all inputs, notes, and generated reports to return the tool to its initial state.

---

### Key Entities *(include if feature involves data)*

Since the assessment in this feature is static and ephemeral (lives only in client-side state), the entities describe the static schema and state structure:

- **FacilityType**: Represents the configuration for a facility type.
  - Attributes: identifier (general/dental), title (Arabic), description (Arabic), list of Chapters.
- **Chapter**: Represents a group of standards (CBAHI chapter).
  - Attributes: code (e.g. "LD", "PC"), title (Arabic), list of AssessmentItems.
- **AssessmentItem**: Represents a single standard to be evaluated.
  - Attributes: code (e.g. "LD-01"), question (Arabic), suggested evidence (Arabic).
- **AssessmentSessionState** (Ephemeral state):
  - Attributes: selected facility type, answers map (item code -> compliance status), notes map (item code -> text notes), current score, current active chapter filter.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete the entire assessment (33 questions for General Medical Complexes) and view their live score in less than 5 minutes.
- **SC-002**: The readiness score and counts breakdown update in under 100 milliseconds upon changing any question answer.
- **SC-003**: The generated gap report displays correct counts and lists only items scored as "غير متوفر" (0 points), "جزئي" (0.5 points), or unanswered.
- **SC-004**: The print layout correctly excludes page headers, footers, and interactive buttons, and formats the report cleanly on standard A4 paper size.

---

## Assumptions

- **Target Audience Browser**: Users are using modern web browsers (Chrome, Safari, Edge, Firefox) with JavaScript enabled.
- **RTL Language**: The user interface is completely in Arabic, utilizing the Tajawal font and the NebrasGOO platform's deep green and gold design system.
- **Persistence Scope**: No saving to database or CRM-linking is implemented in this feature. This is strictly a local client-side interactive tool.
- **Static Content**: The CBAHI questions and criteria are static and will not change dynamically without code updates.
