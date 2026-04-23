# Software Requirements Specification (SRS)
## Arrowhead Gym Management System — Version 1.0

---

## 1. Introduction

The current business operations of the gym are heavily reliant on manual, paper-based record-keeping. This informal structure has led to significant risks, including data loss, human error in payment tracking, and a lack of historical data for business analysis.

The purpose of the Arrowhead **Digital Gym & Inventory Management System** is to provide a centralized, digital repository for operational data. By digitizing membership records, payment histories, equipment inventory, and attendance, the system aims to improve data accuracy, speed up operational flow, and transition the business from a "memory-based" operation to a "data-driven" one.

For the business context, elicitation process, and stakeholder interview findings that motivated this specification, refer to the [Requirements Elicitation Document](./01-requirements.md).

---

## 2. System Scope

### 2.1 In-Scope Features

- **Membership Management:** Digital registration, status tracking (Active/Inactive/Expired), and profile management.
- **Membership Plan Configuration:** Ability for the Admin to define fixed-price subscription plans.
- **Payment & Subscription Tracking:** Logging of member payments, expiration dates, and financial history.
- **Member Attendance Tracking:** Simple logging of member check-ins.
- **Inventory Management:** Tracking gym equipment, condition status, and quantity.
- **Supplier Transaction Logging:** Recording purchases and costs associated with specific suppliers.
- **Reporting Dashboard:** Generation of essential reports (Revenue, Expirations, Inventory).

### 2.2 Out-of-Scope

- **Internal Communication Tools:** No chat or messaging module.
- **Client-Facing Portal:** Strictly an internal tool for the owner and staff.
- **Automated Marketing:** Email/SMS marketing or automated re-engagement tools are excluded.
- **Payroll System:** Employee salary, shifts, and attendance management are outside the project scope.

---

## 3. Stakeholders / Users

| User Role | Description |
|---|---|
| **Administrator (Owner)** | Full access to the system. Manages configuration, views financial reports, and oversees all records. Focus areas: oversight, financial health, strategic decisions, and system configuration. |
| **Staff (Employee/Cashier)** | Responsible for day-to-day data entry: registering members, logging payments, tracking check-ins, and updating equipment status. Restricted from financial reporting and financial record deletion. |

---

## 4. System Overview

The system is a simple, internal, web-based application designed for rapid data entry at a gym counter.

1. **Frontend:** A modern, responsive dashboard used by Staff and Admin.
2. **Backend:** A centralized API handles business logic and enforces data consistency.
3. **Database:** A cloud-hosted PostgreSQL database ensures data integrity, availability, and resilience against physical risks.
4. **Workflow:** Staff primarily use a search bar to locate a member. Once identified, they can log attendance, process a payment against a configured membership plan, or update the member's profile. All financial transactions are instantly reflected in the Administrator's reporting dashboard.

---

## 5. Functional Requirements

### FR-1: Membership Management

- **FR-1.1:** The system shall allow Staff to create and update member profiles (First Name, Last Name, Contact Number, Join Date, Status).
- **FR-1.2:** Contact Number and Full Name must be mandatory data fields upon creation.
- **FR-1.3:** The system shall track the membership start date and calculated expiry date.
- **FR-1.4:** Staff shall be able to deactivate a member's profile, changing the Status to `INACTIVE` without physical deletion. When a member is deactivated, their expiry date shall be set to null.

### FR-2: Payment Processing Log

- **FR-2.1:** The system shall record transaction details including Amount, Date Paid, Payment Type (Cash/GCash), the related Membership Plan ID, and the Staff User ID who processed the payment.
- **FR-2.2 — Payment Validity Logic:** Upon payment submission, the system shall calculate the `expiry_date` by adding the subscription duration to:
  - **(a)** The current date, if the member's existing status is `INACTIVE` or `EXPIRED`.
  - **(b)** The existing `expiry_date`, if the member's status is `ACTIVE` (renewal/extension).
- **FR-2.3:** The system shall present a chronological view of payment history for each member.
- **FR-2.4:** Upon payment, the system shall store the member's `previousStatus` and `previousExpiryDate` on the payment record to support undo functionality.
- **FR-2.5:** The system shall provide an undo mechanism for 5 seconds after a payment is submitted. If activated, the system reverts the member's status and expiry date using the stored `previousStatus` and `previousExpiryDate`.

### FR-3: Inventory & Equipment Tracking

- **FR-3.1:** The system shall allow users to log equipment items (Item Name, Current Quantity).
- **FR-3.2:** The system shall allow Staff to update the equipment's Condition using a predefined status list (`GOOD`, `MAINTENANCE`, `BROKEN`).

### FR-4: Supplier Management

- **FR-4.1:** The system shall maintain a directory of supplier profiles (Name, Contact Number, Service Category).
- **FR-4.2:** The system shall allow the Owner to log supply purchases, linking each transaction to a Supplier and recording the Total Cost and Transaction Date.

### FR-5: Reporting

- **FR-5.1 — Daily Revenue Report:** The system shall generate an on-demand report showing the total revenue collected and a breakdown by payment method for all payments processed since 12:00 AM local time on the current day.
- **FR-5.2 — Expiry Alert List:** The system shall provide a dashboard list of all active members whose subscriptions expire within the next 3 calendar days.
- **FR-5.3 — Monthly Revenue Report:** The system shall generate a summary of total revenue collected for a specified calendar month.
- **FR-5.4 — Low Inventory Alert:** The system shall provide a list of equipment items where the quantity is below a fixed threshold of 5 (configurable minimum).
- **FR-5.5 — At-Risk Retention Alert:** The system shall identify active members at churn risk using combined expiry and attendance inactivity criteria.
- **FR-5.6 — Revenue Forecasting Modes:** The system shall provide next-month revenue projection using selectable forecast modes (`CONSERVATIVE`, `OPTIMISTIC`).
- **FR-5.7 — Peak Utilization Analytics:** The system shall provide hourly attendance utilization grouped by membership plan.

### FR-6: Membership Plan Management (Admin Only)

- **FR-6.1:** The Administrator shall be able to create, edit, and deactivate predefined membership plans.
- **FR-6.2:** Each plan definition must include a Plan Name (string), a Fixed Price (currency), and a Duration (integer, in days).

### FR-7: Member Attendance Tracking

- **FR-7.1:** The Staff shall be able to log a member's physical check-in.
- **FR-7.2:** The system shall enforce a validation rule: check-in is only permitted if the associated member's status is `ACTIVE`.
- **FR-7.3:** The system shall record the `member_id` and the exact timestamp of the check-in event.
- **FR-7.4:** The system shall provide an undo button for 5 seconds after a check-in is recorded.

### FR-8: Profile Management (Owner Only)

- **FR-8.1:** The Owner/Admin must be able to edit both their own and the staff's password and username.
- **FR-8.2:** The Profiles page shall display both the creation date and the last-updated date for each user record.
- **FR-8.3:** Username input fields shall be pre-filled with current usernames.

---

## 6. User Stories and Acceptance Criteria

### 6.1 Membership Management (FR-1)

#### US-1.1 — New Member Registration

**As a** Staff member, **I want to** quickly input a new member's details (Name, Contact, Join Date) into a digital form, **so that** I no longer have to rely on paper logbooks that can be damaged or lost.

| Acceptance Criterion | Condition |
|---|---|
| AC-1.1-1 | System provides a form with validation for mandatory fields (Full Name, Contact Number). |
| AC-1.1-2 | System prevents duplicate active entries based on Contact Number. |
| AC-1.1-3 | Upon submission, the member is assigned a unique System ID; the ID, full name, and status appear on the dashboard list in real time. |

---

#### US-1.2 — Instant Member Search

**As a** Staff member, **I want to** search for a member by name or ID using a search bar, **so that** I can verify their membership status in under 500ms when they arrive.

| Acceptance Criterion | Condition |
|---|---|
| AC-1.2-1 | Search results update in real-time as the staff member types. |
| AC-1.2-2 | Results clearly display the member's current status (Active/Expired) using color coding (e.g., green for Active, red for Expired). |

---

#### US-1.3 — Membership Deactivation

**As a** Staff member, **I want to** mark a member as inactive without deleting their historical data, **so that** a record of former clients is maintained for potential future re-engagement.

| Acceptance Criterion | Condition |
|---|---|
| AC-1.3-1 | A "Deactivate" button exists on the member profile. |
| AC-1.3-2 | Deactivating a member sets their status to `INACTIVE` and their expiry date to null. |
| AC-1.3-3 | Deactivated members do not appear in default "Active" filtered views but remain searchable in "All Members" views. |

---

#### US-1.4 — Update Member Profile

**As a** Staff member, **I want to** edit an existing member's details (e.g., Contact Number), **so that** the member's profile remains accurate and up-to-date.

| Acceptance Criterion | Condition |
|---|---|
| AC-1.4-1 | Staff can modify any editable field (First Name, Last Name, Contact Number, Notes). |
| AC-1.4-2 | All mandatory fields (Full Name, Contact Number) must pass validation upon update. |

---

### 6.2 Payment & Subscription Tracking (FR-2)

#### US-2.1 — Log Membership Payment

**As a** Staff member, **I want to** record a payment for a specific member and select a predefined membership plan, **so that** the system automatically calculates their new expiration date.

| Acceptance Criterion | Condition |
|---|---|
| AC-2.1-1 | System allows selection of payment method (Cash, GCash). |
| AC-2.1-2 | System presents a list of currently active Membership Plans. |
| AC-2.1-3 | System marks member status as `ACTIVE` upon submission. |
| AC-2.1-4 | System calculates the new expiry date by adding plan duration to the current date (if inactive/expired) or extending the existing expiry date (if already active). |

---

#### US-2.2 — View Payment History

**As an** Owner, **I want to** access a chronological list of all payments made by a specific member, **so that** I can resolve disputes and maintain accurate financial transparency.

| Acceptance Criterion | Condition |
|---|---|
| AC-2.2-1 | Member profile includes a "Payment History" section. |
| AC-2.2-2 | Each entry displays Date, Amount, Payment Method, the Membership Plan purchased, and the Staff member who processed the transaction. |
| AC-2.2-3 | GCash payment entries also display the Reference Number of that transaction. |
| AC-2.2-4 | Payment history can be filtered by month and year. |

---

#### US-2.3 — Undo Payment

**As an** Owner/Staff, **I want to** undo a payment submitted for a given member, **so that** there are no duplicates or malformed payment records.

| Acceptance Criterion | Condition |
|---|---|
| AC-2.3-1 | Once a payment is submitted, the system provides an undo button for **5 seconds** before it reverts to the standard submit button. |
| AC-2.3-2 | If the undo button is clicked, the system reverts the member's status and expiry date using the payment record's `previousStatus` and `previousExpiryDate` fields. |

---

### 6.3 Inventory & Equipment Tracking (FR-3)

#### US-3.1 — Equipment Condition Logging

**As a** Staff member, **I want to** update the status of a piece of equipment (e.g., "Good," "Needs Repair," "Out of Order"), **so that** the owner knows which machines need maintenance immediately.

| Acceptance Criterion | Condition |
|---|---|
| AC-3.1-1 | Inventory list allows quick selection of a predefined condition status for each item. |
| AC-3.1-2 | System records a "Last Updated" timestamp for each status change. |

---

#### US-3.2 — Asset Quantity Tracking

**As an** Owner, **I want to** see a list of all gym assets and their current quantities, **so that** I can quickly identify items that are missing or need replenishment.

| Acceptance Criterion | Condition |
|---|---|
| AC-3.2-1 | System allows the Administrator to add, edit, and delete inventory item records. |
| AC-3.2-2 | The Quantity field must only accept non-negative integers. |

---

### 6.4 Supplier & Transaction Management (FR-4)

#### US-4.1 — Supplier Directory

**As an** Owner, **I want to** store centralized contact details for different suppliers, **so that** staff can quickly contact the right person for maintenance or supply reorder.

| Acceptance Criterion | Condition |
|---|---|
| AC-4.1-1 | Each supplier profile must include Name, Contact Number, and Service Category. |
| AC-4.1-2 | A dedicated page exists to view, search, and edit the full supplier list. |

---

#### US-4.2 — Log Supply Purchases

**As an** Owner, **I want to** log the cost of supplies purchased, **so that** I can accurately track business expenses against revenue.

| Acceptance Criterion | Condition |
|---|---|
| AC-4.2-1 | Transactions must be linked to a specific Supplier record. |
| AC-4.2-2 | Total cost and a description of items purchased must be recorded for every transaction. |

---

### 6.5 Reporting & Financial Analytics (FR-5)

#### US-5.1 — Daily Revenue Summary

**As an** Owner, **I want to** see a summary of all payments collected for the current business day, **so that** I can reconcile digital records with the physical cash drawer.

| Acceptance Criterion | Condition |
|---|---|
| AC-5.1-1 | A "Daily Report" page shows total revenue and a breakdown by payment method. |
| AC-5.1-2 | The report reflects all payments processed since **12:00 AM local time** on the current day. |

---

#### US-5.2 — Membership Expiry Alerts

**As a** Staff member, **I want to** see a list of members whose subscriptions expire within the next 3 days, **so that** I can remind them to renew when they visit.

| Acceptance Criterion | Condition |
|---|---|
| AC-5.2-1 | An "Upcoming Expirations" dashboard widget is visible immediately upon Staff login. |

---

#### US-5.3 — Monthly Revenue Summary

**As an** Owner, **I want to** generate a summary report of total revenue for a specified calendar month, **so that** I can track monthly performance and analyze trends.

| Acceptance Criterion | Condition |
|---|---|
| AC-5.3-1 | The system allows the Administrator to select any past calendar month. |
| AC-5.3-2 | The report displays the total collected revenue for the selected month. |

---

#### US-5.4 — Low Inventory Alert List

**As an** Owner, **I want to** see a list of equipment items below a minimum threshold, **so that** I receive an alert when items need to be re-ordered.

| Acceptance Criterion | Condition |
|---|---|
| AC-5.4-1 | A "Low Inventory Alert" list is visible on the reports page. |
| AC-5.4-2 | The system displays items where quantity is below the configurable minimum (default: 5). |

---

#### US-5.5 — At-Risk Membership Retention Alerts

**As a** Staff member, **I want to** see members who are both nearing expiry and not checking in regularly, **so that** I can proactively remind them before they churn.

| Acceptance Criterion | Condition |
|---|---|
| AC-5.5-1 | The system lists only active members with expiry dates within the next 14 days. |
| AC-5.5-2 | Members are included only when they have no attendance records in the last 10 days. |
| AC-5.5-3 | Each record includes name, contact number, expiry date, and days-until-expiry for outreach prioritization. |

---

#### US-5.6 — Revenue Forecast Scenario Comparison

**As an** Owner, **I want to** switch between forecast modes, **so that** I can compare conservative and optimistic projections for next month revenue planning.

| Acceptance Criterion | Condition |
|---|---|
| AC-5.6-1 | The reports dashboard provides selectable projection modes: `CONSERVATIVE` and `OPTIMISTIC`. |
| AC-5.6-2 | Forecast output includes baseline active-plan revenue, projected churn adjustment, and final forecasted revenue. |
| AC-5.6-3 | Invalid or missing mode input defaults to `CONSERVATIVE`. |

---

#### US-5.7 — Peak Utilization by Plan

**As an** Owner, **I want to** view hourly attendance intensity by membership plan, **so that** I can make better staffing and facility allocation decisions.

| Acceptance Criterion | Condition |
|---|---|
| AC-5.7-1 | The dashboard displays utilization across all 24 hourly buckets in a day. |
| AC-5.7-2 | Attendance counts are grouped by the member's latest associated plan. |
| AC-5.7-3 | Hours with no activity remain visible as zero values to preserve trend continuity. |

---

### 6.6 Configuration Management (FR-6)

#### US-6.1 — Define Membership Plans

**As an** Owner, **I want to** create and maintain a list of standard membership plans, **so that** staff can use fixed, accurate pricing and durations when logging payments.

| Acceptance Criterion | Condition |
|---|---|
| AC-6.1-1 | The Administrator can define a Plan Name, Fixed Price, and Duration in days (e.g., 30, 90, 180). |
| AC-6.1-2 | Plans can be deleted and marked as `ACTIVE` or `ARCHIVED`. |

---

### 6.7 Member Attendance (FR-7)

#### US-7.1 — Log Member Check-in

**As a** Staff member, **I want to** quickly log a member's physical arrival, **so that** the gym owner has a digital record of daily attendance.

| Acceptance Criterion | Condition |
|---|---|
| AC-7.1-1 | Staff can trigger a "Check-in" action from the member's profile page. |
| AC-7.1-2 | The system only allows check-in if the member's status is `ACTIVE`. |
| AC-7.1-3 | System records the date and timestamp of the check-in event. |
| AC-7.1-4 | System provides an undo button for **5 seconds** after a check-in is recorded. |

---

### 6.8 Profile Management (FR-8)

#### US-8.1 — Change Passwords and Usernames

**As an** Owner, **I want to** change the username and password of both my own and the staff role's account, **so that** the application remains personalized and secure.

| Acceptance Criterion | Condition |
|---|---|
| AC-8.1-1 | Owner has access to a "Profiles" tab in the sidebar. |
| AC-8.1-2 | Profiles page includes four input fields: change username and password for Admin and Staff respectively, each with separate submit buttons. |
| AC-8.1-3 | Profiles page displays the creation date and last-updated date for both user records. |
| AC-8.1-4 | Username input fields are pre-filled with current usernames. |
| AC-8.1-5 | System updates username and password upon submission. |

---

## 7. Non-Functional Requirements

### NFR-1: Usability & Operational Speed

- **NFR-1.1 (Operational Speed):** Staff must be able to verify a member's status and log a single payment transaction in **under 5 seconds**.
- **NFR-1.2 (Search Performance):** Search queries for member names must return results in under **500ms**.
- **NFR-1.3 (Responsiveness):** The system interface must maintain full usability on screen widths down to **375px** (mobile portrait). Primary navigation menus shall collapse into a hamburger menu on screens under 768px wide.

### NFR-2: Security & Access Control

- **NFR-2.1 (Authentication):** Access must be restricted via authenticated user login. All user sessions must utilize secure, token-based authentication (JWT).
- **NFR-2.2 (Authorization):** The system must enforce Role-Based Access Control (RBAC). The `STAFF` role must be prevented from viewing financial reports and from deleting financial records.
- **NFR-2.3 (Session Timeout):** The system must automatically log out a user after **5 minutes** of continuous inactivity. A token refresh mechanism must extend the session only upon confirmed user activity (mouse/keyboard interaction, API calls, or form submission).

### NFR-3: Reliability & Data Integrity

- **NFR-3.1 (Atomic Transactions):** Payment record creation and the associated update to the member's `expiry_date` must be executed as a single, atomic database transaction (ACID compliance).
- **NFR-3.2 (System Availability):** The system API and database shall maintain an uptime of **99.5%** during typical gym operating hours (6:00 AM to 10:00 PM, local time). Any single outage shall not exceed **5 consecutive minutes**.

### NFR-4: Maintainability

- **NFR-4.1 (Documentation):** A new developer shall be able to clone the repository, install dependencies, and run the system locally within **30 minutes** using only the provided documentation.
- **NFR-4.2 (Backup Strategy):** The cloud-hosted database must implement Point-in-Time Recovery (PITR) with a minimum retention window of **6 hours** (provided natively by NeonDB). A manual full-database snapshot shall be created before any major system update or schema migration.

---

## 8. Assumptions and Constraints

### 8.1 Assumptions

- **Initial User Records:** Upon first deployment, the database will contain exactly two pre-seeded user records — one `ADMIN` and one `STAFF` — each with a pre-configured password.
- **Plan Configuration:** Membership plans (Name, Price, Duration) are pre-configured by the Administrator and are not configurable by Staff during a payment transaction.
- **Currency:** All financial transactions and reporting operate in a single currency (local currency, Philippine Peso).
- **Hardware:** Staff will use modern desktop browsers or tablets capable of handling a standard web application interface.

### 8.2 Constraints

- **User Records:** The application must maintain exactly two records in the users table — one `ADMIN` and one `STAFF`.
- **Tech Stack:** The core application must utilize: **React**, **Express with TypeScript**, and **PostgreSQL** (NeonDB via Prisma ORM).
- **Budget:** Cloud hosting services must remain within the free tier or a minimal operating budget (maximum approximately $10 USD/month).
- **Deployment Model:** The system requires a reliable internet connection for operation as the database is cloud-hosted.

---

## 9. External Interface Requirements

### 9.1 User Interfaces (UI)

- **Web Browser Compatibility:** The application must be fully functional on the latest two major versions of Google Chrome and Mozilla Firefox.
- **Screen Resolution:** The interface must be optimized for a minimum desktop resolution of 1280×800 pixels and remain usable at 375px (mobile portrait).

### 9.2 Software Interfaces

- **Database Connection:** The Backend API will connect to the PostgreSQL database via a secure, encrypted connection (SSL/TLS).
- **External Dependencies:** The system relies solely on the configured tech stack. No integration with external payment gateways (e.g., Stripe) or third-party APIs is required.

---

## 10. Data Requirements (Schema Entities)

### 10.1 Entity Enumeration

The system stores and processes the following core entities:

1. **User (Staff/Admin):** `id`, `username`, `password_hash`, `role`
2. **MembershipPlan:** `id`, `plan_name`, `price`, `duration_days`, `is_active`
3. **Member:** `id`, `first_name`, `last_name`, `contact_number` (unique), `join_date`, `expiry_date`, `status` (Active/Inactive/Expired), `notes`
4. **Payment:** `id`, `amount`, `date_paid`, `payment_type`, `previous_status`, `previous_expiry_date`, `reference_number`, `member_id` (FK), `staff_id` (FK), `plan_id` (FK)
5. **Attendance:** `id`, `member_id` (FK), `checkin_timestamp`
6. **Equipment:** `id`, `item_name`, `quantity`, `condition` (Good/Needs Repair/Out of Order), `last_checked_date`
7. **Supplier:** `id`, `name`, `contact_number`, `service_category`
8. **SupplierTransaction:** `id`, `items_purchased`, `total_cost`, `transaction_date`, `supplier_id` (FK)

### 10.2 Data Types and Field Constraints

| Entity | Attribute | Data Type | Mandatory | Default | Notes / Constraints |
|---|---|---|---|---|---|
| **User** | id | String | ✅ | — | Primary Key (CUID) |
| | username | String | ✅ | — | — |
| | password_hash | String | ✅ | — | bcrypt hashed |
| | role | Enum | ✅ | `STAFF` | `ADMIN` or `STAFF` |
| **MembershipPlan** | id | String | ✅ | — | Primary Key (CUID) |
| | plan_name | String | ✅ | — | — |
| | price | Decimal | ✅ | — | Fixed price in local currency |
| | duration_days | Integer | ✅ | — | Duration in days |
| | is_active | Boolean | ✅ | `true` | Plan availability flag |
| **Member** | id | String | ✅ | — | Primary Key (CUID) |
| | first_name | String | ✅ | — | — |
| | last_name | String | ✅ | — | — |
| | contact_number | String | ✅ | — | Unique index |
| | join_date | Date | ✅ | Current date | — |
| | expiry_date | Date | ⬜ | — | Calculated by system; null if inactive |
| | status | Enum | ✅ | `ACTIVE` | `ACTIVE`, `INACTIVE`, `EXPIRED` |
| | notes | String | ⬜ | `""` | — |
| **Payment** | id | String | ✅ | — | Primary Key (CUID) |
| | amount | Decimal | ✅ | — | Transaction value |
| | date_paid | DateTime | ✅ | Now | Transaction timestamp |
| | previous_status | String | ⬜ | — | Captured at payment time for undo |
| | previous_expiry_date | DateTime | ⬜ | — | Captured at payment time for undo |
| | reference_number | String | ⬜ | — | Required for GCash transactions |
| | payment_type | Enum | ✅ | `CASH` | `CASH` or `GCASH` |
| | member_id | String | ✅ | — | FK → Member |
| | user_id | String | ✅ | — | FK → User |
| | plan_id | String | ✅ | — | FK → MembershipPlan |
| **Attendance** | id | String | ✅ | — | Primary Key (CUID) |
| | member_id | String | ✅ | — | FK → Member |
| | checkin_timestamp | DateTime | ✅ | Now | Exact check-in time |
| **Equipment** | id | String | ✅ | — | Primary Key (CUID) |
| | item_name | String | ✅ | — | — |
| | quantity | Integer | ✅ | — | Must be non-negative |
| | condition | Enum | ✅ | `GOOD` | `GOOD`, `MAINTENANCE`, `BROKEN` |
| | last_checked_date | Date | ✅ | Current date | — |
| **Supplier** | id | String | ✅ | — | Primary Key (CUID) |
| | name | String | ✅ | — | — |
| | contact_number | String | ✅ | — | — |
| | service_category | String | ⬜ | `"GENERAL"` | — |
| **SupplierTransaction** | id | String | ✅ | — | Primary Key (CUID) |
| | items_purchased | String | ✅ | — | Description string |
| | total_cost | Decimal | ✅ | — | Transaction expense |
| | transaction_date | Date | ✅ | — | — |
| | supplier_id | String | ✅ | — | FK → Supplier |

---

## 11. Proposed Tech Stack & Implementation Notes

The system utilizes the latest stable versions of each technology:

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | 19.x / 8.x / 4.x | Rapid development, clean administrative UI, responsive styling |
| **Backend** | Express with TypeScript | 5.x / 5.x | Type safety and scalability; reliable financial calculations |
| **ORM** | Prisma ORM | 7.x | Simplified data relationships, type-safe database access, managed migrations |
| **Database** | NeonTech (Serverless PostgreSQL) | — | Cloud-hosted, PITR-enabled, free-tier compatible |
| **Unit/Integration Testing** | Jest + Supertest | 30.x / 7.x | Controller isolation, API route testing |
| **Component Testing** | Storybook | 10.x | Isolated UI component development and review |
| **E2E Testing** | Playwright | 1.x | Full browser-based user journey validation |
| **CI/CD** | GitHub Actions | — | Automated testing pipeline, staging deployments before production |

---

## 12. Related Documents

- [Requirements Elicitation](./01-requirements.md)
- [Architecture Reference](../technical/01-architecture.md)
- [Database Schema](../technical/02-database.md)
- [API Reference](../technical/03-api-reference.md)
- [Developer Onboarding](../guides/onboarding.md)
- [Testing Strategy](../guides/testing.md)
