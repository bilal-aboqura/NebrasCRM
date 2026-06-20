# Data Model: CBAHI Self-Assessment Tool

This document defines the static schemas and interactive React state shapes for the CBAHI Self-Assessment Tool.

## 1. Static Question Schemas

The assessment data is static and loaded locally. The following types define the structures:

### `AssessmentItem`
Represents a single assessment standard item.
- `code` (string, unique): e.g., `"LD-01"`, `"PC-03"`.
- `question` (string): The Arabic question text.
- `suggestedEvidence` (string): Arabic text describing suggested evidence or verification documents.

### `Chapter`
Represents a CBAHI chapter grouping multiple assessment items.
- `code` (string, unique): e.g., `"LD"`, `"PC"`, `"IPC"`.
- `title` (string): Arabic title of the chapter (e.g., `"القيادة والإدارة"`).
- `items` (Array of `AssessmentItem`): The list of items in this chapter.

### `FacilityTypeConfig`
Represents the config and chapters for a specific facility type.
- `id` (string): `"general"` or `"dental"`.
- `title` (string): Arabic title (e.g., `"المجمعات الطبية العامة"`).
- `description` (string): Detailed Arabic description.
- `chapters` (Array of `Chapter`): The chapters belonging to this facility type.

---

## 2. Ephemeral Assessment State Shape

The interactive session state is managed via React state and adheres to the following interface:

### `AssessmentSessionState`
- `facilityType` (`"general"` | `"dental"`): The active facility type.
- `answers` (`Record<string, "1" | "0.5" | "0" | "na" | "">`): Maps item codes (e.g. `"LD-01"`) to compliance values.
- `notes` (`Record<string, string>`): Maps item codes to user-provided textnotes.
- `activeChapterFilter` (`string`): The code of the currently filtered chapter (e.g., `"all"` or `"LD"`).
- `showReport` (boolean): Flag indicating whether the gap report section has been generated and is visible.

---

## 3. Validation and Scoring Rules

### Compliance Value Scoring
- `"1"` (متوفر): `1.0` points.
- `"0.5"` (جزئي): `0.5` points.
- `"0"` (غير متوفر): `0.0` points.
- `"na"` (غير منطبق): Excluded from both Points Earned (numerator) and Max Points (denominator).
- `""` (unanswered): Counts as `0.0` points in Points Earned, and `1.0` in Max Points.

### Readiness Tiers
- **Score ≥ 85%**: High Readiness (`"high"`)
  - Label: `"جاهزية عالية"`
  - Description: `"ينصح بتنفيذ زيارة محاكاة قبل التقديم."`
  - Color styling: Green / Gold gradient.
- **Score 65–84%**: Medium Readiness (`"medium"`)
  - Label: `"جاهزية متوسطة"`
  - Description: `"توجد فجوات تحتاج خطة تحسين واضحة."`
  - Color styling: Amber / Gold.
- **Score < 65%**: Low Readiness (`"low"`)
  - Label: `"جاهزية منخفضة"`
  - Description: `"يوصى بمشروع تجهيز شامل قبل التقديم للاعتماد."`
  - Color styling: Red / Rose.
