# Backend

This package contains the Express API, Prisma schema, database seed, and backend tests for Arrowhead Gym Management System.

## What Lives Here

- `src/app.ts`: Express app wiring, middleware setup, and route registration.
- `src/server.ts`: Server bootstrap and port selection.
- `src/controllers/`: Request handlers for auth, members, payments, suppliers, equipment, plans, profiles, and reports.
- `src/routes/`: API route maps and role guards.
- `src/middleware/auth.middleware.ts`: Session verification and role enforcement.
- `src/lib/prisma.ts`: Prisma client singleton configured for the PostgreSQL adapter.
- `src/utils/auth.ts`: JWT signing, cookie settings, password hashing, and session verification.
- `prisma/schema.prisma`: Database schema and model definitions.
- `prisma/seed.ts`: Database seed data used for local development and tests.
- `tests/`: Unit, integration, and E2E support scripts.

## Local Setup

```bash
cp .env.example .env
npm install
npm run db:seed
npm run dev
```

The backend requires these values in `backend/.env`:

- `DATABASE_URL`: PostgreSQL connection string used by the running server.
- `DIRECT_URL`: Direct PostgreSQL connection string used by Prisma migrations.
- `FRONTEND_URL`: Frontend origin allowed by CORS.
- `JWT_SECRET`: Secret used to sign session cookies.

## Useful Commands

- `npm run dev`: Start the API in watch mode with nodemon.
- `npm run build`: Generate Prisma Client and compile TypeScript.
- `npm run start`: Run the compiled server from `dist/src/server.js`.
- `npm run test`: Run the Jest suite.
- `npm run test:unit`: Run unit tests.
- `npm run test:integration`: Run integration tests with the integration DB setup.
- `npm run db:seed`: Seed the local database.
- `npm run db:reset:e2e`: Reset and reseed the E2E database.

## Core Modules

- `src/controllers/auth.controller.ts`: Login, logout, user lookup, and session refresh.
- `src/controllers/member.controller.ts`: Member listing, creation, updates, check-ins, and deactivation.
- `src/controllers/payment.controller.ts`: Payment creation and member payment history.
- `src/controllers/report.controller.ts`: Revenue, inventory, and expiration reporting.
- `src/controllers/supplier.controller.ts`: Supplier management and transaction tracking.
- `src/controllers/equipment.controller.ts`: Equipment management and condition updates.
- `src/controllers/profile.controller.ts`: Profile viewing and user updates.

## API Surface

- `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/me`
- `GET /api/members`, `POST /api/members`, `PATCH /api/members/:memberId`, `PATCH /api/members/:memberId/deactivate`, `GET /api/members/:memberId/attendance`, `POST /api/members/:memberId/check-in`
- `GET /api/plans`, `POST /api/payments`, `GET /api/members/:memberId/payments`
- `GET /api/reports/upcoming-expirations`, `GET /api/reports/daily-revenue`, `GET /api/reports/monthly-revenue`, `GET /api/reports/low-inventory`, `GET /api/reports/overview`
- `GET /api/users`, `GET /api/profile`, `PUT /api/profile`, `PUT /api/users/:userId`

## Environment Notes

- Copy `.env.example` to `.env` before running the backend locally.
- Use a test database for E2E so reset scripts do not touch development data.
- Prisma uses the adapter-based client in `src/lib/prisma.ts`, so seed scripts should reuse the shared client pattern already in the repo.

## Documentation Links

- Root project guide: [../README.md](../README.md)
- Architecture diagram and module overview: [../docs/architecture.md](../docs/architecture.md)