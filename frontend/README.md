# Frontend — Arrowhead Gym Management System

React dashboard built with Vite and Tailwind CSS. This package contains all UI components, page-level containers, API services, TypeScript types, and Storybook stories.

---

## Local Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Open the app at `http://localhost:5173`.

---

## Environment Variables

Copy `.env.example` to `.env` and provide the following value.

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL consumed by the API service layer (e.g., `http://localhost:5001`) |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production bundle |
| `npm run lint` | Run ESLint checks |
| `npm run preview` | Preview the production build locally |
| `npm run storybook` | Start Storybook on port 6006 |
| `npm run build-storybook` | Build the static Storybook output |

---

## Folder Conventions

Use the following convention when deciding where new code belongs.

| Directory | Convention |
|---|---|
| `src/pages/` | Route-level composition only. Pages orchestrate data fetching and assemble domain components. |
| `src/components/layout/` | Shared app chrome: `MainLayout`, `Sidebar`, `Header`, and inactivity timeout wrapper. |
| `src/components/common/` | Generic, reusable UI primitives: search/filter controls, modals, action groups. |
| `src/components/<domain>/` | Domain-specific components for members, payments, plans, reports, suppliers, and equipment. |
| `src/services/` | API communication layer. Keep all `fetch` calls here; never call `fetch` in presentational components. |
| `src/types/` | Shared TypeScript contracts for domain models (Member, Payment, Report, etc.). |
| `src/hooks/` | Reserved for custom React hooks. |
| `src/layouts/` | Reserved for future layout abstractions. |
| `src/stories/` | Storybook stories and mock fixtures for isolated component/page previews. |

---

## Adding a New Page

1. Create the page component in `src/pages/` (e.g., `src/pages/StaffPage.tsx`).
2. Export it through `src/pages/index.ts`.
3. Import the page in `src/App.tsx` via the existing barrel import.
4. Add a `<Route>` entry in `src/App.tsx` using the `ProtectedRoute` + `MainLayout` shell pattern.
5. Add a navigation entry in `src/components/layout/Sidebar.tsx` if sidebar access is required.

---

## Service Layer Pattern

All backend calls live in `src/services/`. Domain-specific API modules (e.g., `membershipPlanApi.ts`) expose typed async functions. Pages/components import and call these functions; they never call `fetch` directly.

```ts
// Usage in a page or component
import { listMembershipPlans } from '../services/membershipPlanApi';

const plans = await listMembershipPlans();
```

---

## Documentation

- [Architecture Reference](../docs/technical/01-architecture.md)
- [API Reference](../docs/technical/03-api-reference.md)
- [Developer Onboarding](../docs/guides/onboarding.md)
- [Root Project Guide](../README.md)
