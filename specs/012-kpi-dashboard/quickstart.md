# Quickstart Guide: Role-Aware KPI Dashboard

## System Prerequisites
Ensure that packages are installed. You can install or verify `recharts` package via:
```bash
npm install
```

## Running the Development Server
Run the local next dev server:
```bash
npm run dev
```
Navigate to `http://127.0.0.1:3000` or the configured dev port to test the landing page dashboard.

## Running Tests
Run the test suite to verify dashboard aggregates, role scoping, and tenant isolation:
```bash
npm run test
```
To run specific integration tests:
```bash
npx vitest run tests/integration/012-kpi-dashboard.test.ts
```
*(This test will be created during the implementation phase)*
