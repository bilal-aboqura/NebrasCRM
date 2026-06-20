# NebrasCRM Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-06-21

## Active Technologies
- Next.js (App Router), TypeScript (Node.js v20+) + `xlsx` (SheetJS) (011-bulk-import-export)
- PostgreSQL (Supabase) + RLS policies (011-bulk-import-export)
- Next.js 14 (App Router), TypeScript (Node v20+) + React 18, TailwindCSS, Lucide React, Recharts (012-kpi-dashboard)
- Memory database (`db` in `@/lib/data/store`, backing local mocks) (012-kpi-dashboard)
- Next.js 14 (App Router), TypeScript, Node.js v20+ + `recharts` (for visual reports), `xlsx` (SheetJS for Excel exports), `lucide-react` (icons) (013-reports-module)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (014-marketing-landing-page)
- Next.js 14 (App Router), TypeScript (Node.js v20+) + React 18, TailwindCSS, Lucide React, `next/font/google` (014-marketing-landing-page)
- N/A (Static marketing page) (014-marketing-landing-page)
- TypeScript / Node.js v20+ + Next.js 14 (App Router), React 18, TailwindCSS, Lucide React (015-public-lead-capture)
- PostgreSQL / Supabase Memory Store (mock) in development; Server Action uses service role key to bypass client authentication RLS (015-public-lead-capture)

- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (011-bulk-import-export)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

[e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]: Follow standard conventions

## Recent Changes
- 015-public-lead-capture: Added TypeScript / Node.js v20+ + Next.js 14 (App Router), React 18, TailwindCSS, Lucide React
- main: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
- 014-marketing-landing-page: Added Next.js 14 (App Router), TypeScript (Node.js v20+) + React 18, TailwindCSS, Lucide React, `next/font/google`


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
