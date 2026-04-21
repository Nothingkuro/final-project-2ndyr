# Backend — Arrowhead Gym Management System

Express/TypeScript REST API with Prisma ORM. This package contains the API server, database schema, migrations, seed scripts, and test suites.

---

## Local Setup

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:seed
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and provide values for the following keys. **Do not commit real secrets.**

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection string (NeonDB pooler endpoint) |
| `DIRECT_URL` | Direct PostgreSQL connection string (NeonDB non-pooler, for migrations) |
| `FRONTEND_URL` | Frontend origin allowed by the CORS policy |
| `JWT_SECRET` | Secret used to sign session JWTs |
| `SESSION_TTL` | Session duration (default: `7d`) |
| `AUTH_COOKIE_NAME` | Cookie name (default: `arrowhead_session`) |
| `BCRYPT_ROUNDS` | bcrypt hashing cost (default: `10`) |
| `SEED_OWNER_USERNAME` | Username for the seeded admin account |
| `SEED_OWNER_PASSWORD` | Password for the seeded admin account |
| `SEED_STAFF_USERNAME` | Username for the seeded staff account |
| `SEED_STAFF_PASSWORD` | Password for the seeded staff account |
| `PORT` | HTTP server port (default: `5001`) |
| `NODE_ENV` | Runtime environment (`development`, `test`, `production`) |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the API in watch mode (nodemon) |
| `npm run build` | Generate Prisma Client and compile TypeScript |
| `npm run start` | Run the compiled server from `dist/src/server.js` |
| `npm run test` | Run all Jest tests |
| `npm run test:unit` | Run unit tests only (no database required) |
| `npm run test:integration` | Run integration tests (requires `DATABASE_URL_TEST`) |
| `npm run db:generate` | Generate the Prisma Client from the schema |
| `npm run db:seed` | Seed the local development database |
| `npm run db:migrate` | Apply pending Prisma migrations (development) |
| `npm run db:reset:e2e` | Reset and reseed the E2E test database |

---

## Folder Conventions

| Directory | Contents |
|---|---|
| `src/app.ts` | Express app composition (middleware, CORS, routes) |
| `src/server.ts` | HTTP server bootstrap |
| `src/controllers/` | Request handlers for each API domain |
| `src/routes/` | Route declarations and role guard wiring |
| `src/middleware/` | Auth verification and role enforcement |
| `src/lib/` | Prisma client singleton |
| `src/utils/` | JWT helpers, cookie options, password hashing |
| `src/config/` | `ConfigManager` singleton for environment variables |
| `src/patterns/` | GoF design pattern implementations |
| `prisma/schema.prisma` | Database model definitions |
| `prisma/seed.ts` | Development and test seed data |
| `tests/unit/` | Controller and utility unit tests (Prisma mocked) |
| `tests/integration/` | API-level tests against a real database |

---

## Documentation

- [Architecture Reference](../docs/technical/01-architecture.md)
- [Database Schema](../docs/technical/02-database.md)
- [API Reference](../docs/technical/03-api-reference.md)
- [Testing Strategy](../docs/guides/testing.md)
- [Root Project Guide](../README.md)