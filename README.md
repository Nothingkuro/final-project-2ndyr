# Final Project Repository

Arrowhead is a monorepo for a gym management system with a React frontend, an Express/Prisma backend, and Playwright end-to-end tests.

## Quick Start

1. Install dependencies from the repository root.

```bash
npm install
```

2. Create local environment files from the examples.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp e2e/.env.example e2e/.env.test
```

3. Fill in the database URLs and seed passwords in `backend/.env` and `e2e/.env.test`.

4. Start both apps in development mode.

```bash
npm run dev
```

5. Open the frontend at `http://localhost:5173` and the backend at `http://localhost:5001`.

## Documentation

- Backend package guide: [backend/README.md](backend/README.md)
- Architecture diagram and module overview: [docs/architecture.md](docs/architecture.md)
- Frontend package guide: [frontend/README.md](frontend/README.md)
- E2E package guide: [e2e/README.md](e2e/README.md)

## Repository Layout

```text
final-project-2ndyr/
  backend/        Express API, Prisma schema, seed, and tests
  frontend/       React app, UI components, and client services
  e2e/            Playwright browser tests and database reset helpers
```

## System Overview

- The frontend runs on Vite and talks to the backend over HTTP with `credentials: include` so browser cookies carry the session.
- The backend exposes JSON REST endpoints, enforces authentication/roles in middleware, and persists data through Prisma.
- The E2E suite starts or attaches to the app, resets the test database, and runs browser workflows against seeded data.

## Core Modules

### Backend

- `src/app.ts`: Express app wiring, CORS, cookies, JSON parsing, and route registration.
- `src/server.ts`: Server bootstrap and port selection.
- `src/controllers/`: Request handlers for auth, members, payments, suppliers, equipment, plans, profiles, and reports.
- `src/routes/`: API route maps and role guards.
- `src/middleware/auth.middleware.ts`: Session verification and role enforcement.
- `src/lib/prisma.ts`: Singleton Prisma client configured for the adapter-based PostgreSQL setup.
- `src/utils/auth.ts`: JWT signing, cookie settings, password hashing, and session verification.

### Frontend

- `src/App.tsx`: Browser routes and protected route shell.
- `src/components/layout/`: App chrome, sidebar, header, and inactivity timeout wrapper.
- `src/pages/`: Page-level screens for login, dashboard sections, and member profile flows.
- `src/components/`: Reusable UI for members, payments, plans, reports, suppliers, and equipment.
- `src/services/`: API clients and HTTP helpers.
- `src/types/`: Shared TypeScript contracts used by components and services.

### E2E

- `test/specs/`: Playwright user journeys for members, payments, inventory, reports, suppliers, and profile management.
- `test/support/`: Login helpers, database reset utilities, and shared fixtures.

## Main API Surface

### Auth

- `POST /api/auth/login`: Validates username, password, and role, then issues the session cookie.
- `POST /api/auth/refresh`: Reissues the active session cookie for authenticated users.
- `POST /api/auth/logout`: Clears the session cookie.
- `GET /api/auth/me`: Returns the authenticated user profile.

### Members and Attendance

- `GET /api/members`: Lists members with search, filter, and pagination.
- `POST /api/members`: Creates a member.
- `PATCH /api/members/:memberId`: Updates a member.
- `PATCH /api/members/:memberId/deactivate`: Deactivates a member.
- `GET /api/members/:memberId/attendance`: Returns attendance history.
- `POST /api/members/:memberId/check-in`: Records a check-in.

### Payments

- `GET /api/plans`: Returns active membership plans for payment selection.
- `POST /api/payments`: Creates a payment and renews the member expiry date.
- `GET /api/members/:memberId/payments`: Returns the payment history for one member.

### Reports

- `GET /api/reports/upcoming-expirations`: Returns active members expiring soon.
- `GET /api/reports/daily-revenue`: Admin-only daily revenue summary.
- `GET /api/reports/monthly-revenue`: Admin-only monthly revenue series.
- `GET /api/reports/low-inventory`: Admin-only low-stock equipment alerts.
- `GET /api/reports/overview`: Admin-only combined reports dashboard data.

## Run Commands

### Root workspace

- `npm run dev`: Run backend and frontend in parallel.
- `npm run build`: Build backend and frontend.
- `npm run start`: Start the compiled backend.
- `npm run test:e2e`: Run Playwright tests.
- `npm run test:e2e:headless`: Run Playwright headless.
- `npm run test:e2e:headed`: Run Playwright with a visible browser.
- `npm run test:e2e:ci`: Run the CI-friendly E2E command.

### Backend package

- `npm --prefix backend run dev`: Start the API in watch mode.
- `npm --prefix backend run build`: Generate Prisma Client and compile TypeScript.
- `npm --prefix backend run test`: Run Jest tests.
- `npm --prefix backend run db:seed`: Seed the local database.

### Frontend package

- `npm --prefix frontend run dev`: Start the Vite dev server.
- `npm --prefix frontend run build`: Type-check and build the production bundle.
- `npm --prefix frontend run storybook`: Run Storybook locally.

## Suggested Onboarding Task

Start with one of these small tasks to understand the system quickly:

- Run `npm --prefix e2e run test:e2e -- test/specs/payment-subscription.e2e.spec.ts` and trace the payment flow from UI to backend.
- Update a label or status badge in the payments or member profile UI and confirm it in Storybook or e2e.
- Inspect the auth flow end-to-end by following `src/App.tsx`, `src/components/common/InactivityTimeout.tsx`, and `src/services/authApi.ts`.

## Troubleshooting

- If the backend cannot connect to the database, verify `backend/.env` and the `DATABASE_URL` / `DIRECT_URL` values.
- If the frontend cannot reach the API, confirm `frontend/.env` contains the correct `VITE_API_BASE_URL`.
- If E2E resets fail, use a dedicated test database in `e2e/.env.test` and run the root `test:e2e` scripts.
