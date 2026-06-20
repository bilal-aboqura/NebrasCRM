# Quickstart: Assessment Persistence and CRM Linking

## 1. Apply Supabase Database Migration
To apply the database schema, run the migration locally using the Supabase CLI:

```bash
supabase migration new create_assessments_table
# Copy content from F:/CodingProjects/NebrasCRM/specs/017-assessment-persistence/data-model.md into the SQL file
supabase db reset
```

## 2. Run Local Development Server
Launch the next.js dev server:

```bash
npm run dev
```

## 3. Verify Local Testing Suite
Run automated unit tests to verify tenant isolation and server-side calculation rules:

```bash
npm run test
# Or specifically:
npx vitest tests/017-assessment-persistence.test.ts
```
