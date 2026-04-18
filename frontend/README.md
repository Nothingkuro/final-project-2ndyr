# Frontend

This package contains the React dashboard for Arrowhead Gym Management System.

## What Lives Here

- `src/pages/`: Route-level screens for login, members, payments, equipment, reports, suppliers, plans, and profiles.
- `src/components/layout/`: Shared shell components such as the sidebar, header, and inactivity timeout wrapper.
- `src/components/`: Domain components for the major flows.
- `src/services/`: HTTP clients and API helpers.
- `src/types/`: Shared TypeScript contracts for UI and service code.
- `src/hooks/`: Reusable React hooks.

## Local Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The frontend expects `VITE_API_BASE_URL` to point at the backend, usually `http://localhost:5001`.

## Useful Commands

- `npm run dev`: Start Vite.
- `npm run build`: Type-check and build the app.
- `npm run lint`: Run ESLint.
- `npm run storybook`: Start Storybook.
- `npm run build-storybook`: Produce the static Storybook build.

## Documentation Links

- Shared architecture and API notes: [../docs/architecture.md](../docs/architecture.md)
- Root project guide: [../README.md](../README.md)
