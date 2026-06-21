# Feature 012 Validation Walkthrough

## Implemented

- Replaced the dashboard placeholder with Arabic KPI cards, a Recharts pipeline visualization, due follow-up alerts, and a recent activity feed.
- Added explicit active-company filtering to every dashboard query and facility-owner filtering for `sales_user` accounts.
- Added a management-only team performance table with Sunday-based Riyadh week, month, and quarter filters.
- Added zero-data states, SAR formatting, RTL layout, responsive grids, and direct facility links.
- Adapted the generated memory-store plan to the repository's current Supabase architecture.

## Automated validation

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with no warnings.
- `npm test`: 36 files passed, 112 tests passed.
- `npm run build`: production compilation and type validation passed.
- Dashboard-focused tests: 2 files passed, 8 tests passed.

## Manual walkthrough

1. Sign in as a sales user and open `/`.
2. Confirm the KPI cards, funnel, alerts, and activity entries only represent facilities assigned to that user.
3. Confirm the team performance section is absent.
4. Sign in as a supervisor, company admin, or super admin with an active company.
5. Confirm company-wide KPI values are shown and no other company's records appear.
6. Switch the team period between week, month, and quarter and confirm the table refreshes.
7. Follow an alert or activity link and confirm it opens the corresponding facility.
