# Quickstart & Verification Guide: Public Marketing Landing Page

This guide explains how to spin up the local environment and verify the landing page features.

## 1. Environment Configuration

Add the optional GTM variable to your `.env.local` if you wish to test tracking scripts:
```bash
NEXT_PUBLIC_GTM_ID=GTM-TEST1234
```
Ensure no other variables are required for the public page (it runs independently of database connections).

---

## 2. Running Locally

Start the local Next.js dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Manual Verification Checklist

### Unauthenticated Access
1. Open an incognito browser window.
2. Go to `http://localhost:3000`.
3. Confirm the landing page loads successfully without redirecting to `/login`.

### Sticky Header & Mobile Drawer
1. Resize your browser window to under `700px`.
2. Confirm the header links hide and a hamburger menu icon appears.
3. Click the hamburger icon to verify that the drawer menu slides open and links are clickable.

### Redirection & Navigation
1. Click the "دخول CRM" button; verify it redirects to `http://localhost:3000/login`.
2. Click the WhatsApp link; verify it points to `https://wa.me/966535370955`.
3. Click the Phone link; verify it points to `tel:+966502658846`.
4. Click the "المزيد" links in the services section; verify the page smooth-scrolls to the `#lead-capture` section.

### GTM Integration
1. View the HTML page source of `http://localhost:3000`.
2. Verify the Google Tag Manager script tag is injected in the `<head>` containing your GTM ID.
3. Clear `NEXT_PUBLIC_GTM_ID` from `.env.local`, restart the server, and verify the script tag is no longer present.
