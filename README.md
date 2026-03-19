# Final Project Repository

Monorepo structure for a React frontend and Express TypeScript backend.

## Project Structure

```text
final-project-2ndyr/
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

## Backend Scripts

- `npm run dev`: Run API in watch mode via nodemon + ts-node.
- `npm run build`: Compile TypeScript to `dist/`.
- `npm start`: Start compiled server from `dist/`.
- `npm test`: Run Jest + Supertest tests.
