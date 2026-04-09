# Playwright E2E

This package runs browser-based end-to-end tests for:

- Membership management
- Payment and subscription tracking
- Inventory and equipment tracking

## Install

From repository root:

```bash
npm --prefix e2e install
npm --prefix e2e run playwright:install
```

## Required environment variables

Set these in `e2e/.env.test` before running tests. If `e2e/.env.test` is absent, the runner also falls back to `e2e/.env`:

- `DATABASE_URL_TEST` - points to your test database (this is mapped to `DATABASE_URL` for backend reset and server processes)
- `SEED_STAFF_PASSWORD` or `E2E_LOGIN_PASSWORD` - staff login password used by E2E

Optional variables:

- `E2E_LOGIN_USERNAME` (default: `staff`)
- `E2E_BASE_URL` (default: `http://127.0.0.1:5173`)
- `E2E_FRONTEND_PORT` (default: `5173`)
- `E2E_BACKEND_PORT` (default: `5001`)
- `E2E_HEADLESS` (`true`/`false`, default: `true`)
- `E2E_USE_EXISTING_BACKEND` (`true` to skip auto-start)
- `E2E_USE_EXISTING_FRONTEND` (`true` to skip auto-start)

## Run tests

From repository root:

```bash
npm --prefix e2e run test:e2e
```

Headless explicitly:

```bash
npm --prefix e2e run test:e2e:headless
```

Headed mode:

```bash
npm --prefix e2e run test:e2e:headed
```

UI mode:

```bash
npm --prefix e2e run test:e2e:ui
```

## What the suite does

- Starts backend and frontend automatically through Playwright `webServer`
- Resets and reseeds the database before each test via `backend` script `db:reset:e2e`
- Logs in as staff and executes feature workflows in a real browser
- Captures screenshot/video/trace for failures
