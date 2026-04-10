# Final Project Repository

Monorepo structure for a React frontend and Express TypeScript backend.

## Project Structure

```text
final-project-2ndyr/
  e2e/                      # Selenium + Jest E2E tooling package
    jest.e2e.config.ts      # Dedicated Jest config for E2E runs
    tsconfig.json           # TypeScript config for E2E tests
    test/
      pages/                # Selenium page objects
      setup/                # E2E environment and DB reset hooks
      specs/                # Selenium E2E specs
      utils/                # Selenium driver helpers
  frontend/                 # React + Vite + TypeScript
    src/
      assets/               # Images, icons, static media
      components/           # Reusable UI components
      pages/                # Route-level pages
      layouts/              # Shared page layouts
      hooks/                # Custom React hooks
      services/             # API calls and client services
      types/                # Frontend TypeScript types/interfaces
      utils/                # Utility helpers
      constants/            # App constants and config
  backend/                  # Express + TypeScript API
    src/
      config/               # Environment and app config
      controllers/          # Request handlers
      middleware/           # Express middleware
      routes/               # API route definitions
      services/             # Business logic layer
      types/                # Backend TypeScript types/interfaces
      utils/                # Utility helpers
      app.ts                # Express app setup
      server.ts             # Server bootstrap
    tests/                  # Integration/unit tests
```

## Setup

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Run tests

```bash
cd backend
npm test
```

### 4. Run Selenium E2E smoke tests

Start backend and frontend first:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Install E2E dependencies and run tests:

```bash
cd e2e
npm install
npm run test:e2e
```

E2E tests now reset the database before the suite and after every test case by truncating tables and reseeding.
Set `DATABASE_URL` to a test database before running E2E so resets are isolated from development data.

Or run from repository root:

```bash
npm run test:e2e
```

Use headless mode for CI:

```bash
npm run test:e2e:headless
```

## Backend Scripts

- `npm run dev`: Run API in watch mode via nodemon + ts-node.
- `npm run build`: Compile TypeScript to `dist/`.
- `npm start`: Start compiled server from `dist/`.
- `npm test`: Run Jest + Supertest tests.
