# NebrasCRM Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-06-21

## Active Technologies
- Next.js (App Router), TypeScript (Node.js v20+) + `xlsx` (SheetJS) (011-bulk-import-export)
- PostgreSQL (Supabase) + RLS policies (011-bulk-import-export)
- Next.js 14 (App Router), TypeScript (Node v20+) + React 18, TailwindCSS, Lucide React, Recharts (012-kpi-dashboard)
- Memory database (`db` in `@/lib/data/store`, backing local mocks) (012-kpi-dashboard)
- Next.js 14 (App Router), TypeScript, Node.js v20+ + `recharts` (for visual reports), `xlsx` (SheetJS for Excel exports), `lucide-react` (icons) (013-reports-module)

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
- 013-reports-module: Added Next.js 14 (App Router), TypeScript, Node.js v20+ + `recharts` (for visual reports), `xlsx` (SheetJS for Excel exports), `lucide-react` (icons)
- 012-kpi-dashboard: Added Next.js 14 (App Router), TypeScript (Node v20+) + React 18, TailwindCSS, Lucide React, Recharts
- 011-bulk-import-export: Added Next.js (App Router), TypeScript (Node.js v20+) + `xlsx` (SheetJS)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
