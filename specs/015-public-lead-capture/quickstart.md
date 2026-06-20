# Quickstart: Public Lead Capture Form

This document provides instructions for launching, testing, and verifying the public lead-capture form.

## Environment Setup

1. Add the default target company ID configuration to your `.env.local` file:
   ```env
   DEFAULT_LEAD_COMPANY_ID=company-a
   ```
   *(For testing and development, `company-a` maps to "نبراس الجودة" in mock data).*

2. Verify that local development servers and dependencies are installed:
   ```bash
   npm install
   ```

---

## Local Verification Commands

### 1. Automated Integration & Unit Tests
To verify all validation, sanitization, rate-limiting, and duplication rules:
```bash
npm run test tests/integration/015-public-lead-capture.test.ts
```

### 2. Run the Development Server
To launch the application UI locally:
```bash
npm run dev
```
Navigate to the landing page at `http://localhost:3000` (once the landing page route is active) or the testing component test bench.

---

## Manual Verification Checklist

- [ ] **Public Form Rendering**:
  - Open the landing page at `http://localhost:3000` in an incognito window.
  - Verify that the form under "احجز تقييم جاهزية مجاني" appears correctly in RTL layout.
  - Verify that inputs use the `Tajawal` font.
  
- [ ] **Form Validation**:
  - Click submit without filling in fields. Verify Arabic validation warnings appear inline under each field.
  - Enter an invalid phone number (e.g., `12345`). Submit and verify the phone number validation error appears.
  
- [ ] **Successful Submission**:
  - Fill out the form with a new facility name (e.g. `عيادات الصحة المتميزة`), city `جدة`, phone `0555555555`, and type `مجمع طبي`.
  - Click submit.
  - Verify that the form content fades out and is replaced by a success checkmark and message in green.
  - Wait 8 seconds. Verify the form transitions back to an empty form.
  - Log in to the CRM dashboard (`http://localhost:3000/login` with `admin@nebras.local`).
  - Navigate to the Facilities List. Verify that the new facility appears as status `جديد` (new), owner is unassigned, lead source is `website_form`, and the city `جدة` is captured in the facility notes.
  
- [ ] **Duplicate Handling (Active)**:
  - Submit the form again with the same phone `0555555555`.
  - Verify the submission replaces the form in-place with an amber warning: "تم تسجيل طلبك مسبقاً، سيتواصل معك فريقنا قريباً".
  - Log in to the CRM and verify that NO duplicate facility is created in the table.
  
- [ ] **Duplicate Handling (Archived)**:
  - Inside the CRM, archive the facility created in the step above.
  - Go back to the public form and submit the same phone number `0555555555`.
  - Verify the submission returns success.
  - Log in to the CRM. Verify that the archived facility has been unarchived (`isArchived = false`), status is reset to `new`, owner is `null`, and a reactivation activity has been appended to the timeline.
  
- [ ] **Rate Limiting**:
  - Submit the form 5 times successfully (or with duplicates).
  - On the 6th attempt from the same device within an hour, verify a rate limit alert banner displays at the top of the form: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً".
  
- [ ] **GTM Event Verification**:
  - Open browser developer tools, go to the console, and type `window.dataLayer`.
  - Verify that the object contains `{event: "lead_form_submitted", facilityType: "مجمع طبي"}` for successful submissions, but NOT for duplicate or rate-limited submissions.
