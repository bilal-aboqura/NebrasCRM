# Quickstart Guide: CBAHI Self-Assessment Tool

This guide explains how to run, develop, and test the CBAHI Self-Assessment feature.

## 1. Project Route and Navigation
- **Public URL**: `/assessment`
- **Mockup Reference**: Mockup HTML can be viewed at `NEBRASGOO_CBAHI_Assessment_From_Standards/index.html` and logic in `NEBRASGOO_CBAHI_Assessment_From_Standards/assets/app.js`.

---

## 2. Key File Paths

| Component / File | Purpose | Path |
|---|---|---|
| **Static Data** | CBAHI chapters, questions, and suggested evidence | `src/lib/data/cbahi-data.ts` |
| **Custom State Hook** | Scoring calculations, reset, and state management | `src/hooks/use-cbahi-session.ts` |
| **Assessment Page** | Interactive questionnaire container | `src/app/(public)/assessment/page.tsx` |
| **Public Layout** | Sticky header, contact bar, and footer shared wrapper | `src/app/(public)/layout.tsx` |
| **Unit Tests** | Logic, scoring formulas, and state reset tests | `src/tests/016-cbahi-self-assessment.test.ts` |

---

## 3. Local Development

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/assessment` in your browser.
3. Select a facility type and begin marking compliance statuses to see the score update in real-time.

---

## 4. Testing Instructions

To run the automated tests for this feature:
```bash
npm run test src/tests/016-cbahi-self-assessment.test.ts
```

Tests verify:
- Facility switching resets all active progress and loads correct counts.
- Scoring is accurate, including correct exclusion of "غير منطبق" (na) items.
- Empty states (0 answered) and division-by-zero prevention (all items na) are handled.
- Reset action returns the session state to initial values.
