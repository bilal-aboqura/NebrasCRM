# Interface Contract: Lead Capture Redirection

This document defines the interface contract for linking assessment results to the public lead capture form on the home page.

## URL Structure

When a visitor clicks "طلب استشارة مجانية" in the gap report section, they are redirected to the homepage assessment section with the following query parameter format:

```text
GET /?type={facility_type}&score={score_percentage}#assessment
```

## Parameters Schema

| Parameter | Type | Required | Allowed Values | Description |
|---|---|---|---|---|
| `type` | string | Yes | `general`, `dental` | The facility type that was assessed. Maps to: `general` (General Medical Complexes) or `dental` (Dental Centers). |
| `score` | integer | Yes | `0` to `100` | The calculated overall readiness percentage, rounded to the nearest integer. |
| anchor `#assessment` | hash anchor | Yes | `#assessment` | Positions the browser viewport directly at the lead capture form. |

## Target Integration Flow

1. **Self-Assessment Page**:
   - Calculates overall score (e.g. `74`).
   - Facility type is active (e.g. `dental`).
   - Formulates URL: `/?type=dental&score=74#assessment`.
   - Executes navigation via standard anchor link or router push.

2. **Homepage / Lead Capture Component** (Feature 015 - Public Lead Capture):
   - Reads query parameters on load.
   - If `type` is present and matches `general` or `dental`, auto-selects the corresponding dropdown option.
   - Saves the `score` parameter (e.g. as a hidden input or state field) to be submitted as metadata along with the lead capture form submission.
