# Arrowhead Gym Management System

[![Backend & E2E Tests](https://github.com/Nothingkuro/final-project-2ndyr/actions/workflows/test.yaml/badge.svg)](https://github.com/Nothingkuro/final-project-2ndyr/actions/workflows/test.yaml)

---

## Overview

**Arrowhead Gym Management System** is a web-based platform designed to digitize the daily operations of a small gym. The system replaces a historically paper-based workflow — spanning member enrollment, payment collection, equipment inventory, and supplier procurement — with a centralized, role-aware digital interface accessible to gym staff and administrators.

The platform enforces a two-role access model: **Staff** carry out day-to-day tasks such as member check-ins and payment recording, while **Admin (Owner)** additionally access financial reports, manage membership plans, and oversee user accounts. All data is persisted in a cloud-hosted PostgreSQL database with point-in-time recovery, ensuring operational continuity.

---

## Key Features

- **Member Registry** — Register, search, filter, and manage gym members with real-time status tracking (`ACTIVE`, `EXPIRED`, `INACTIVE`).
- **Payment Processing** — Record membership payments linked to configurable plans; atomically renews member expiry on each transaction.
- **Attendance Tracking** — Log member check-ins with timestamps; view full attendance history per member.
- **Equipment Inventory** — Track gym equipment stock and condition (`GOOD`, `MAINTENANCE`, `BROKEN`) with low-inventory alerting.
- **Supplier Management** — Maintain a supplier directory and log itemized procurement transactions.
- **Operational Reports** — Admin dashboard with daily/monthly revenue, membership expiration forecasts, and inventory alerts.
- **Membership Plan Configuration** — Admin-managed plan catalogue controlling name, price, and duration.
- **Profile Management** — Staff and admin can update their own credentials securely.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router, TypeScript |
| **Backend** | Node.js, Express, TypeScript (strict mode) |
| **ORM** | Prisma ORM (adapter-based client) |
| **Database** | PostgreSQL via NeonDB (serverless, PITR-enabled) |
| **Testing** | Jest (unit/integration), Playwright (E2E), Storybook (component isolation) |
| **CI/CD** | GitHub Actions (3-job pipeline: unit → integration → E2E) |

---

## Quick Start

### 1. Install all workspace dependencies

```bash
npm install
```

### 2. Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp e2e/.env.example e2e/.env.test
```

Fill in `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and seed passwords in `backend/.env`. Set `VITE_API_BASE_URL=http://localhost:5001` in `frontend/.env`.

### 3. Prepare the database

```bash
npm --prefix backend run db:generate
npm --prefix backend run db:seed
```

### 4. Start the application

```bash
npm run dev
```

### 4. Run the application

- [ ] Start backend and frontend together:

Frontend: `http://localhost:5173` · Backend: `http://localhost:5001`

> **First time?** See the full [Developer Onboarding Guide](docs/guides/onboarding.md) for the complete Day 1 Verification Checklist and environment variable reference.

---

## Repository Layout

```text
final-project-2ndyr/
├── backend/        Express API, Prisma schema, migrations, and test suites
├── frontend/       React dashboard, UI components, Storybook stories
├── e2e/            Playwright browser tests and database reset helpers
├── docs/           Project documentation (see Documentation Map below)
└── .github/        GitHub Actions CI/CD workflow definitions
```

---

## Documentation Map

### Business

| Document | Description |
|---|---|
| [Requirements Elicitation](docs/business/01-requirements.md) | Stakeholder analysis, in-scope/out-of-scope problems, functional and non-functional requirements |
| [Software Requirements Specification (SRS)](docs/business/02-srs.md) | Formal user stories with acceptance criteria for all system features |

### Technical

| Document | Description |
|---|---|
| [Architecture Reference](docs/technical/01-architecture.md) | System diagrams, tech stack rationale, module responsibilities, and request lifecycle |
| [Database Schema](docs/technical/02-database.md) | Full Prisma model definitions, ER diagram, and NeonDB backup/recovery strategy |
| [API Reference](docs/technical/03-api-reference.md) | All REST endpoints with methods, auth requirements, request/response shapes |

### Guides

| Document | Description |
|---|---|
| [Developer Onboarding](docs/guides/onboarding.md) | Day 1 checklist, env variable reference, troubleshooting, and suggested starter tasks |
| [Testing Strategy](docs/guides/testing.md) | Jest unit/integration test patterns, Playwright E2E conventions, CI/CD pipeline details |

### Package Guides

| Document | Description |
|---|---|
| [Backend Package](backend/README.md) | Local setup commands, available scripts, and backend-specific conventions |
| [Frontend Package](frontend/README.md) | Local setup commands, folder conventions, and frontend-specific scripts |
| [E2E Package](e2e/README.md) | E2E environment variables, run commands, and test suite behavior |

---

## Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start backend and frontend in parallel |
| `npm run build` | Build backend and frontend |
| `npm run test:e2e` | Run the full Playwright E2E suite |
| `npm --prefix backend run test` | Run all Jest tests (unit + integration) |
| `npm --prefix backend run test:unit` | Run unit tests only |
| `npm --prefix frontend run storybook` | Start Storybook component explorer |
