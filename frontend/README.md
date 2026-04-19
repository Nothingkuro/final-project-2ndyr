# Frontend

This package contains the React dashboard for the Arrowhead Gym Management System.

## Frontend Tech Stack

- React 19 for UI rendering and component composition.
- Vite 8 for local development server and production bundling.
- Tailwind CSS v4 (`@tailwindcss/vite` + `@tailwindcss/forms`) for styling and design tokens.
- React Router for page routing and protected dashboard navigation.
- TypeScript in strict mode for type-safe components, services, and domain models.

## Local Setup

1. Create a local environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

4. Open the app at `http://localhost:5173`.

Required environment variable:

- `VITE_API_BASE_URL`: Backend origin used by frontend services. Default local value is `http://localhost:5001`.

## Folder Structure Conventions

Use this convention when deciding where code belongs.

| Directory | Convention | Typical Contents |
| --- | --- | --- |
| `src/pages` | Route-level composition only. Keep pages focused on orchestration. | Data fetching triggers, route params, domain-level UI assembly. |
| `src/components/layout` | Shared dashboard chrome and layout scaffolding. | `MainLayout`, `Sidebar`, `Header`, global wrappers. |
| `src/components/common` | Generic, reusable UI primitives. | Search/filter controls, modals, action groups, timeout wrappers. |
| `src/components/<domain>` | Domain-specific reusable UI components. | Members, payments, reports, suppliers, equipment, membership plans. |
| `src/services` | API communication and request helper layer. | Base URL utilities, auth headers, domain API modules. |
| `src/types` | Shared TypeScript contracts for frontend domain models. | Member, payment, report, supplier, and user interfaces. |
| `src/layouts` | Reserved folder for future layout abstractions. Current active layouts are under `src/components/layout`. | Future expansion only. |
| `src/hooks` | Reserved folder for reusable custom hooks. | Future expansion only. |
| `src/stories` | Storybook stories and mock fixtures for isolated component/page previews. | `.stories.tsx`, test fixtures, Storybook mocks. |

## Adding a New Page and Wiring It in App.tsx

1. Create a page component in `src/pages`, for example `src/pages/StaffPage.tsx`.

2. Export it through `src/pages/index.ts`:

```ts
export { default as StaffPage } from './StaffPage';
```

3. Import the page in `src/App.tsx` (via the existing pages barrel import).

4. Add a route entry in `src/App.tsx` using the same route-shell pattern used by existing dashboard pages:

```tsx
<Route
	path="/dashboard/staff"
	element={
		<ProtectedRoute>
			<MainLayout>
				<StaffPage />
			</MainLayout>
		</ProtectedRoute>
	}
/>
```

5. If the page needs sidebar access, add its navigation entry in `src/components/layout/Sidebar.tsx`.

## Using the API Service Layer (`src/services`)

The service layer keeps HTTP concerns out of page and component code.

### Service design pattern

- `apiBaseUrl.ts`: Normalizes API base URL from environment.
- `authHeaders.ts`: Builds request headers for authenticated calls.
- `authApi.ts`: Session lifecycle calls such as refresh/logout.
- Domain modules (`equipmentApi.ts`, `membershipPlanApi.ts`, `reportsApi.ts`, `supplierApi.ts`, `profileApi.ts`) expose feature-specific API functions.

### Usage in a page/component

1. Import a domain function from `src/services`.
2. Call it inside page-level handlers/effects.
3. Store the response in local component state.
4. Keep retry/error UI logic in the page, not in presentational components.

Example pattern:

```ts
import { listMembershipPlans } from '../services/membershipPlanApi';

const plans = await listMembershipPlans();
```

Guideline:

- Prefer adding new backend calls to a domain service file first, then consume that function from pages/components.
- Avoid calling `fetch` directly in deeply nested presentational components.

## Useful Commands

- `npm run dev`: Start Vite development server.
- `npm run build`: Type-check and build for production.
- `npm run lint`: Run ESLint checks.
- `npm run preview`: Preview production build locally.
- `npm run storybook`: Start Storybook on port 6006.
- `npm run build-storybook`: Build static Storybook output.

## Documentation Links

- Root project guide: [../README.md](../README.md)
- Backend package guide: [../backend/README.md](../backend/README.md)
- Shared architecture notes: [../docs/architecture.md](../docs/architecture.md)
