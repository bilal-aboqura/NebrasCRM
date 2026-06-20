# Research & Decisions: CBAHI Self-Assessment Tool

This document outlines the architectural research, options, and finalized design decisions for Feature 016: CBAHI Self-Assessment Tool.

## 1. Routing & Layout Integration

### Context
The self-assessment tool must be a public route (`/assessment`) that shares the public styling of the marketing website, keeping it distinct from the CRM dashboard layout.

### Research
- The CRM shell layout lives in `src/app/(dashboard)/layout.tsx`.
- The root layout is in `src/app/layout.tsx`.
- Currently, there is no `(public)` route group layout in `src/app`. Although Feature 014 (Marketing Landing Page) and Feature 015 (Public Lead Capture) have plans, they have not yet been implemented in the source code of this branch.
- The authentication middleware in `src/middleware.ts` protects `/dashboard`, `/admin`, and `/profile`. It does not intercept any route not starting with these prefixes.

### Decision
- **Route Group**: We will introduce a new Next.js route group `(public)` under `src/app/(public)/`.
- **Public Layout**: We will create `src/app/(public)/layout.tsx` which implements the top contact bar, header navigation, and footer derived from the client's mockup `NEBRASGOO_Homepage_CRM_Login/index.html`.
- **Assessment Page**: The assessment will live at `src/app/(public)/assessment/page.tsx`.
- **Auth Middleware**: Bypasses authentication automatically because `/assessment` is not in the `protectedPrefixes` array in `src/middleware.ts`. No middleware changes are needed.

---

## 2. Embedded Assessment Data Structure

### Context
The assessment question bank is static, representing CBAHI standards for general medical complexes (33 items across 11 chapters) and dental centers (23 items across 6 chapters).

### Decision
We will define static TypeScript structures in `src/lib/data/cbahi-data.ts`.
- **Interface definitions**:
  ```typescript
  export interface AssessmentItem {
    code: string;
    question: string;
    suggestedEvidence: string;
  }

  export interface Chapter {
    code: string;
    title: string;
    items: AssessmentItem[];
  }

  export interface FacilityTypeConfig {
    id: "general" | "dental";
    title: string;
    description: string;
    chapters: Chapter[];
  }
  ```
- The data is embedded as a typed constant `CBAHI_DATA` mapping `"general"` and `"dental"` keys to their respective config.

---

## 3. Ephemeral Client-Side State Management

### Context
The tool is interactive and runs fully in the browser. No assessment data is saved to the database in this feature. The assessment state must reset when switching facility types or clicking reset.

### Options Evaluated
1. **React Context + `useReducer`**: Good for sharing state across nested components, but might add unnecessary boilerplate for a single page.
2. **Local Component State (`useState`)**: Simplest, easiest to manage and pass down as props.
3. **Custom Hook (`useCbahisession`)**: Encapsulates all state (answers, notes, current facility type, active chapter) and scoring formulas.

### Decision
We will implement a custom hook `src/hooks/use-cbahi-session.ts`:
- Maintains:
  - `facilityType`: `"general" | "dental"`
  - `answers`: `Record<string, "1" | "0.5" | "0" | "na">`
  - `notes`: `Record<string, string>`
  - `activeChapter`: `string` (for filtering)
- Functions returned:
  - `setAnswer(code, value)`
  - `setNote(code, note)`
  - `setFacilityType(type)`
  - `setChapterFilter(chapterCode)`
  - `reset()`
  - `calculateScore()` - returns counts breakdown, score, and recommendation tier.

---

## 4. Scoring Logic & Div-by-Zero Handling

### Formula
- **Points Earned**: `sum(answers[code] as number)` where `value` is `1` for "متوفر", `0.5` for "جزئي", and `0` for "غير متوفر".
- **Applicable Items**: All items where an answer is selected and that answer is **not** `"na"` (not applicable).
- **Formula**: `Score = (Points Earned / Applicable Items Count) * 100`.
- Unanswered questions: Count toward the denominator (Applicable Items Count) as `1` but contribute `0` points to the numerator. This treats unanswered items as gaps.

### Edge Cases
If all selected answers are `"na"` or no questions are applicable:
- The denominator is `0`.
- **Handling**: The hook returns a score of `0` and a message indicating that no items are applicable.

---

## 5. Print View Optimization

### Decision
We will implement print styling in vanilla CSS inside the page or global CSS using a `@media print` query:
- **Hidden Elements**: Top bar, main header/nav, footer, facility type selector, chapter filter, textareas (replaced by text output of notes), select dropdowns (replaced by text output of status), and CTA buttons.
- **Printed Elements**: Overall score circle/percentage, progress stats, recommendation, and the full list of assessment items with their answers and comments, and the list of top 25 gaps.
- **Page Breaks**: Force a page break before each chapter for a professional presentation.

---

## 6. Lead Generation Redirection

### Context
When the visitor clicks "طلب استشارة مجانية", they should be redirected to the landing page lead capture form (from Feature 015) with their facility type and readiness score pre-filled.

### Decision
- The button is only visible when at least one question has been answered (i.e. `answeredCount > 0`).
- The link targets `/#assessment` (the ID anchor of the lead form on the landing page) with query parameters:
  `/?type={general|dental}&score={score_percentage}#assessment`
- Feature 015's form will eventually parse these parameters to auto-select the facility type and log the score.
