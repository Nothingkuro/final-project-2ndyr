# API Reference — Arrowhead Gym Management System

## 1. Overview

All API endpoints are served from the Express backend, running on port `5001` by default. Routes are prefixed with `/api`. Authentication is managed via an `HttpOnly` session cookie (`arrowhead_session`) issued at login.

**Base URL (local):** `http://localhost:5001/api`  
**Authentication:** Cookie-based JWT session (`credentials: include` on all frontend requests)  
**Content Type:** `application/json` for all request/response bodies

### Role Abbreviations

| Symbol | Meaning |
|---|---|
| 🔓 | Public (no authentication required) |
| 🔑 | Requires authentication (any role) |
| 👑 | Requires `ADMIN` role |

---

## 2. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | 🔓 | Authenticate with username and password. Returns a session cookie on success. |
| `POST` | `/api/auth/refresh` | 🔑 | Extend the current session. Requires an active cookie. |
| `POST` | `/api/auth/logout` | 🔑 | Clear the session cookie and terminate the server-side session. |
| `GET` | `/api/auth/me` | 🔑 | Return the authenticated user's profile (id, username, role). |

### POST `/api/auth/login`

**Request body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "ADMIN | STAFF"
}
```

**Success (200):** Sets `arrowhead_session` cookie. Returns `{ "message": "Login successful" }`.  
**Failure (401):** Invalid credentials or role mismatch.

---

## 3. Member Management (`/api/members`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/members` | 🔑 | List all members with optional search/filter/pagination. |
| `POST` | `/api/members` | 🔑 | Register a new gym member. |
| `PATCH` | `/api/members/:memberId` | 🔑 | Update a member's personal information or status. |
| `PATCH` | `/api/members/:memberId/deactivate` | 🔑 | Deactivate a member (sets status to `INACTIVE`). |
| `GET` | `/api/members/:memberId/attendance` | 🔑 | Return the attendance history for a specific member. |
| `POST` | `/api/members/:memberId/check-in` | 🔑 | Record a check-in event (creates an `Attendance` record). |

### GET `/api/members` — Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `search` | `string` | Filter by first name, last name, or contact number (partial match) |
| `status` | `ACTIVE \| INACTIVE \| EXPIRED` | Filter by member status |
| `page` | `number` | Pagination page number (1-indexed) |
| `limit` | `number` | Number of results per page |

### POST `/api/members` — Request Body

```json
{
  "firstName": "string",
  "lastName": "string",
  "contactNumber": "string",
  "notes": "string (optional)"
}
```

**Success (201):** Returns the created `Member` object.  
**Conflict (409):** Contact number already in use.

---

## 4. Payments and Plans

### Membership Plans (`/api/plans`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/plans` | 🔑 | Return all active membership plans available for payment selection. |
| `POST` | `/api/plans` | 👑 | Create a new membership plan. |
| `PATCH` | `/api/plans/:planId` | 👑 | Update a plan's details or toggle its active status. |

### Payments (`/api/payments`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments` | 🔑 | Record a payment and atomically update the member's expiry date. |
| `GET` | `/api/members/:memberId/payments` | 🔑 | Return the full payment history for a specific member. |
| `POST` | `/api/payments/:paymentId/undo` | 🔑 | Undo a recent payment within the configured grace period. |

### POST `/api/payments` — Request Body

```json
{
  "memberId": "string",
  "planId": "string",
  "amount": "number",
  "paymentMethod": "CASH | GCASH",
  "referenceNumber": "string (optional, required for GCASH)"
}
```

**Success (201):** Returns the created `Payment` object and the updated `Member` record.  
**Not Found (404):** Member or plan does not exist.  
**Unauthorized (401):** User not authenticated.

> **Atomicity:** Payment creation and member `expiryDate` update are executed as a single Prisma transaction. If either operation fails, neither persists.

---

## 5. Reports (`/api/reports`)

Most report endpoints require `ADMIN` role. Two operational alerts are available to both authenticated Staff and Admin users.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports/upcoming-expirations` | 🔑 | Return active members whose expiry is within the configured alert window. |
| `GET` | `/api/reports/at-risk-members` | 🔑 | Return members with near-term expiry and recent attendance inactivity (retention risk). |
| `GET` | `/api/reports/daily-revenue` | 👑 | Return current business-day revenue with cash and GCash breakdown. |
| `GET` | `/api/reports/monthly-revenue` | 👑 | Return a time series of monthly revenue totals. |
| `GET` | `/api/reports/low-inventory` | 👑 | Return equipment items below a configurable quantity threshold. |
| `GET` | `/api/reports/revenue-forecast` | 👑 | Return next-month revenue projection using selected forecast mode. |
| `GET` | `/api/reports/peak-utilization` | 👑 | Return hourly attendance distribution grouped by latest membership plan. |
| `GET` | `/api/reports/overview` | 👑 | Return a combined payload of all report data (used by the dashboard). |

### Report Query Parameters and Normalization

The report controller sanitizes numeric query inputs to prevent invalid values and expensive unbounded queries.

| Parameter | Used By | Rule | Fallback |
|---|---|---|---|
| `days` | `/upcoming-expirations`, `/overview` | Positive integer, clamped to max `30` | `3` |
| `threshold` | `/low-inventory`, `/overview` | Non-negative integer, clamped to max `9999` | `5` |
| `mode` | `/revenue-forecast` | `OPTIMISTIC` or `CONSERVATIVE` | `CONSERVATIVE` |

### Reports Business Logic Notes

- **At-risk member criteria:** Member must be `ACTIVE`, must expire within the next **14 days**, and must have **no attendance within the last 10 days**.
- **Revenue forecast baseline:** Sum of prices of active membership plans.
- **Revenue forecast churn adjustment:** Sum of latest plan prices for active members expiring next month who have no attendance in the last 30 days.
- **Forecast modes:** `CONSERVATIVE` and `OPTIMISTIC` apply different strategy multipliers to baseline/churn inputs.

### GET `/api/reports/upcoming-expirations`

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `days` | `number` | Number of days ahead to scan for active memberships nearing expiry. |

Success response shape (`200`):

```json
[
  {
    "id": "string",
    "name": "string",
    "expiryDate": "ISO-8601 string",
    "contactNumber": "string"
  }
]
```

### GET `/api/reports/at-risk-members`

Success response shape (`200`):

```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "contactNumber": "string",
      "expiryDate": "ISO-8601 string",
      "daysUntilExpiry": 0,
      "lastCheckInTime": "ISO-8601 string or null",
      "riskLevel": "AT_RISK"
    }
  ],
  "updatedAt": "ISO-8601 string"
}
```

### GET `/api/reports/low-inventory`

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `threshold` | `number` | Minimum stock quantity before an item is flagged as low inventory. |

Success response shape (`200`):

```json
[
  {
    "id": "string",
    "itemName": "string",
    "category": "Equipment",
    "quantity": 0,
    "threshold": 5
  }
]
```

### GET `/api/reports/revenue-forecast`

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `mode` | `OPTIMISTIC \| CONSERVATIVE` | Forecasting profile used for projection math. |

Success response shape (`200`):

```json
{
  "projection": "CONSERVATIVE",
  "baselineActivePlanRevenue": 0,
  "projectedChurnAdjustment": 0,
  "forecastedRevenue": 0
}
```

### GET `/api/reports/peak-utilization`

Success response shape (`200`):

```json
[
  {
    "hour": 0,
    "planName": "Unassigned",
    "count": 0
  }
]
```

### GET `/api/reports/overview`

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `threshold` | `number` | Low-inventory threshold for equipment alerts. |
| `days` | `number` | Expiry-alert lookahead window in days. |

Success response combines the following report blocks in one payload: daily revenue, monthly revenue, membership expiry alerts, inventory alerts, at-risk members, revenue forecast, and peak utilization.

---

## 6. Equipment (`/api/equipment`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/equipment` | 🔑 | Return all equipment items. |
| `POST` | `/api/equipment` | 🔑 | Add a new equipment item to inventory. |
| `PATCH` | `/api/equipment/:equipmentId` | 🔑 | Update an equipment item's details, quantity, or condition. |
| `DELETE` | `/api/equipment/:equipmentId` | 👑 | Remove an equipment item from inventory. |

---

## 7. Suppliers (`/api/suppliers`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/suppliers` | 🔑 | Return all supplier records. |
| `POST` | `/api/suppliers` | 🔑 | Register a new supplier. |
| `PATCH` | `/api/suppliers/:supplierId` | 🔑 | Update supplier details. |
| `DELETE` | `/api/suppliers/:supplierId` | 👑 | Remove a supplier record. |
| `GET` | `/api/suppliers/:supplierId/transactions` | 🔑 | Return transaction history for a supplier. |
| `POST` | `/api/suppliers/:supplierId/transactions` | 🔑 | Log a new purchase transaction with a supplier. |

---

## 8. Profile and User Management

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile` | 🔑 | Return the authenticated user's profile. |
| `PUT` | `/api/profile` | 🔑 | Update the authenticated user's username or password. |
| `GET` | `/api/users` | 👑 | Return all staff/admin user accounts. |
| `PUT` | `/api/users/:userId` | 👑 | Update another user's account (Admin-only). |

---

## 9. Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | 🔓 | Returns `{ status: "UP" }` if the server is running. |

Use this endpoint for startup readiness checks in CI and deployment scripts.

---

## 10. Error Response Format

All error responses follow a consistent JSON structure:

```json
{
  "error": "Human-readable error message"
}
```

| HTTP Status | Meaning |
|---|---|
| `400` | Bad Request — Required fields missing or invalid format |
| `401` | Unauthorized — Missing or invalid session cookie |
| `403` | Forbidden — Authenticated but insufficient role |
| `404` | Not Found — Resource does not exist |
| `409` | Conflict — Duplicate unique field (e.g., contact number) |
| `500` | Internal Server Error — Unhandled server-side failure |

---

## 11. Related Documents

- [Architecture Reference](./01-architecture.md)
- [Database Schema](./02-database.md)
- [SRS — User Stories](../business/02-srs.md)
