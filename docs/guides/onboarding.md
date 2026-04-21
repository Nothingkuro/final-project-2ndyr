# Developer Onboarding Guide — Arrowhead Gym Management System

## 1. Prerequisites

Before beginning local setup, verify the following tools are installed on the development machine.

| Prerequisite | Minimum Version | Verification Command |
|---|---|---|
| Node.js | 20.x | `node --version` |
| npm | 10.x | `npm --version` |
| Git | Any recent version | `git --version` |
| PostgreSQL / NeonDB access | — | Requires a valid connection URL |

---

## 2. Repository Setup

### 2.1 Clone and Install

```bash
git clone https://github.com/<org>/final-project-2ndyr.git
cd final-project-2ndyr
npm install
```

The root `npm install` triggers workspace installs for `backend/`, `frontend/`, and `e2e/` simultaneously via the npm workspaces configuration.

### 2.2 Environment Configuration

Each package requires its own `.env` file. Create them from the provided examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp e2e/.env.example e2e/.env.test
```

---

## 3. Environment Variable Reference

### 3.1 `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled PostgreSQL connection string (NeonDB pooler endpoint). Used by the running Express server. |
| `DIRECT_URL` | ✅ | Direct PostgreSQL connection string (NeonDB non-pooler endpoint). Used by Prisma Migrate only. |
| `FRONTEND_URL` | ✅ | Frontend origin allowed by the CORS policy (e.g., `http://localhost:5173`). |
| `JWT_SECRET` | ✅ | Secret key used to sign the `arrowhead_session` JWT. Use a strong random string in production. |
| `SESSION_TTL` | — | Session duration (default: `7d`). |
| `AUTH_COOKIE_NAME` | — | Cookie name (default: `arrowhead_session`). |
| `BCRYPT_ROUNDS` | — | bcrypt hashing cost factor (default: `10`). |
| `SEED_OWNER_USERNAME` | — | Username seeded for the admin account (default: `owner`). |
| `SEED_OWNER_PASSWORD` | ✅ | Password for the seeded admin account. Do not commit real values. |
| `SEED_STAFF_USERNAME` | — | Username seeded for the staff account (default: `staff`). |
| `SEED_STAFF_PASSWORD` | ✅ | Password for the seeded staff account. Do not commit real values. |
| `PORT` | — | HTTP server port (default: `5001`). |
| `NODE_ENV` | — | Runtime environment (`development`, `test`, `production`). |

### 3.2 `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Backend base URL used by the API service layer (e.g., `http://localhost:5001`). |

### 3.3 `e2e/.env.test`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL_TEST` | ✅ | An **isolated** test PostgreSQL URL separate from development data. E2E resets target this database. |
| `SEED_STAFF_PASSWORD` | ✅ | Staff password the E2E suite uses to log in. Must match the seed used on the test database. |
| `E2E_BASE_URL` | — | Frontend URL the E2E suite navigates to (default: `http://127.0.0.1:5173`). |
| `E2E_HEADLESS` | — | `true` to run browsers headless, `false` for headed mode (default: `true`). |
| `E2E_USE_EXISTING_BACKEND` | — | `true` to skip the automatic backend startup (useful when backend is already running). |

---

## 4. Day 1 Verification Checklist

Use this checklist on a clean machine to confirm the development environment is fully operational.

### Step 1 — Prerequisites

- [ ] Node.js 20+ is installed (`node --version`).
- [ ] npm is available (`npm --version`).
- [ ] Access to a PostgreSQL/NeonDB URL for development.

### Step 2 — Install and Configure

- [ ] Root workspace install completed: `npm install`
- [ ] Environment files created from examples:
  ```bash
  cp backend/.env.example backend/.env
  cp frontend/.env.example frontend/.env
  cp e2e/.env.example e2e/.env.test
  ```
- [ ] `backend/.env` configured with:
  - [ ] `DATABASE_URL` — pooled NeonDB connection string
  - [ ] `DIRECT_URL` — direct NeonDB connection string
  - [ ] `FRONTEND_URL` — set to `http://localhost:5173`
  - [ ] `JWT_SECRET` — a non-empty secret string
  - [ ] `SEED_OWNER_PASSWORD` — a chosen owner password
  - [ ] `SEED_STAFF_PASSWORD` — a chosen staff password
- [ ] `frontend/.env` contains `VITE_API_BASE_URL=http://localhost:5001`
- [ ] `e2e/.env.test` contains `DATABASE_URL_TEST` pointing to an isolated test database.

### Step 3 — Database Preparation

- [ ] Generate Prisma Client:
  ```bash
  npm --prefix backend run db:generate
  ```
- [ ] Apply migrations and seed the development database:
  ```bash
  npm --prefix backend run db:seed
  ```

### Step 4 — Start the Application

- [ ] Start backend and frontend together:
  ```bash
  npm run dev
  ```
- [ ] Frontend loads at `http://localhost:5173`.
- [ ] API health endpoint responds:
  ```bash
  curl http://localhost:5001/api/health
  # Expected: {"status":"UP"}
  ```

### Step 5 — Smoke Tests

- [ ] Log in with the seeded `owner` or `staff` credentials.
- [ ] Members page renders with seeded member data.
- [ ] Payments page shows active membership plans.
- [ ] _(Optional)_ Run one E2E spec to validate the full stack:
  ```bash
  npm --prefix e2e run test:e2e -- test/specs/payment-subscription.e2e.spec.ts
  ```

---

## 5. Suggested Onboarding Tasks

The following small, bounded tasks help new developers understand the system's architecture without requiring full context.

| Task | Purpose |
|---|---|
| Trace the payment flow by running `payment-subscription.e2e.spec.ts` and following the code from UI to backend controller | Understand end-to-end data flow |
| Update a label or status badge in the member or payment UI, verify in Storybook | Understand the component layer |
| Follow `src/App.tsx` → `InactivityTimeout.tsx` → `authApi.ts` | Understand the auth and session refresh flow |
| Add a new field to an existing API endpoint and write a unit test for the controller | Understand the controller + test pattern |

---

## 6. Common Troubleshooting

| Symptom | Likely Cause | Resolution |
|---|---|---|
| Backend cannot connect to database | `DATABASE_URL` or `DIRECT_URL` is missing or incorrect | Verify `backend/.env` against the NeonDB console connection strings |
| Frontend cannot reach the API | `VITE_API_BASE_URL` is wrong or missing | Confirm `frontend/.env` contains the correct backend origin |
| E2E database reset fails | Test database URL points to the production/dev database | Set `DATABASE_URL_TEST` to a separate, isolated database in `e2e/.env.test` |
| Prisma migration errors | `DIRECT_URL` is set to the pooler endpoint instead of the direct endpoint | Use the non-pooler NeonDB URL for `DIRECT_URL` |
| `npx prisma generate` fails | Prisma schema out of sync with client | Ensure `backend/prisma/schema.prisma` is valid and re-run `db:generate` |
| Storybook blank screen on load | Storybook addon version mismatch | Ensure all `@storybook/*` packages are on the same version |

---

## 7. Related Documents

- [Architecture Reference](../technical/01-architecture.md)
- [Testing Strategy](./testing.md)
- [API Reference](../technical/03-api-reference.md)
- [SRS](../business/02-srs.md)
