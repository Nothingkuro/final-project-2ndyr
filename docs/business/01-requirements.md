# Requirements Elicitation — Arrowhead Gym Management System

## 1. Elicitation Context

Requirements were gathered through a direct interview with the gym owner (business stakeholder). The interview revealed that internal communication — whether about operational decisions, staff directives, or supplier management — is conducted either in person or via chat and group chat. This informal structure, while practical for a small team, highlights a business that operates on personal communication rather than structural processes and systems.

---

## 2. Current Operational Workflow

Based on the stakeholder interview, three distinct workflow patterns were identified:

### 2.1 Member-Facing Workflow

```
Customer inquiry → Staff assists customer → Payment processing → Gym usage
```

### 2.2 Internal Management Workflow

```
Owner identifies issue/decision → Discusses in person or via group chat → Employee adjusts → Operations continue
```

### 2.3 Supplier Procurement Workflow

```
Owner reviews needed supplies → Checks prices → Decides based on cost → Purchases supplies
```

> **Observation:** The operational flow is straightforward but **heavily manual and owner-dependent**. The absence of digital records introduces systemic risk at each step.

---

## 3. Identified Issues and Challenges

The primary issue identified is an **over-reliance on manual, paper-based systems**. Paper records are inherently vulnerable to the following risks:

| Risk | Description |
|---|---|
| **Human Error** | Handwritten records are subject to transcription mistakes and illegibility |
| **Data Loss** | Physical documents can be damaged, misplaced, or destroyed |
| **Inaccuracy** | Unverified records lead to discrepancies in payment and membership status |
| **Difficulty Tracking Historical Data** | No structured archive makes retrospective analysis nearly impossible |
| **Slow Reporting** | Manual aggregation of data produces delays in business insight |

---

## 4. Problems That Require Software (In-Scope)

Paper-based record tracking is the primary candidate for digitization. A digital gym and inventory management system would:

- **Reduce human error** through input validation and automated calculation
- **Improve accuracy** by linking records — payments directly update membership status
- **Allow quick data retrieval** through search and filter on structured data
- **Generate reports automatically** removing manual aggregation
- **Support data-driven decision-making** by surfacing trends previously invisible

The following management domains are explicitly targeted for software automation:

| Domain | Current State | Digital Solution |
|---|---|---|
| **Membership Records** | Paper logbooks | Searchable digital member registry with status tracking |
| **Payment History** | Handwritten receipts | Linked payment log with automatic expiry computation |
| **Equipment Inventory** | Ad hoc inspection | Structured inventory list with condition and quantity fields |
| **Supplier Transactions** | Physical receipts | Indexed supplier directory with transaction history |

---

## 5. Problems That Do NOT Require Software (Out-of-Scope)

Not every operational gap identified requires a technical solution. The following were deliberately excluded from scope:

| Out-of-Scope Area | Rationale |
|---|---|
| **Internal communication tools** | The team is small; personal and chat-based communication is effective and does not introduce the same risks as unstructured data. A chat system would add complexity without proportional value. |
| **Leadership and decision-making style** | The owner's tendency to evaluate suppliers purely on cost is a **strategic mindset issue**, not a systems problem. Software cannot substitute for business judgment. |
| **Employee management / payroll** | Staff scheduling and salary management are outside the operational footprint of this phase. |
| **Client-facing portal** | The system is strictly an **internal tool** for owner and staff. Members interact with staff directly. |
| **Automated marketing / notifications** | Email and SMS re-engagement tools are beyond the Phase 1 scope. |

---

## 6. Analyst Realizations

The elicitation process surfaced several important insights that influenced the scope and approach of the system:

1. **Stakeholders describe what they do, not what they need.** The business owner described daily workflows, not explicit system requirements. Deriving requirements required interpretation and gap analysis, not direct transcription.
2. **Problems are often deeper than initial answers reveal.** The stated "challenge" of paper records obscures downstream risks — financial inaccuracies, audit inability, and operational bottlenecks — that only become apparent through structured analysis.
3. **Real-world businesses prioritize cost and operational simplicity over optimization.** The system scope therefore stays lean: solve the highest-value problems without over-engineering.
4. **Software must be justified, not assumed.** Before proposing automation, the full manual workflow must be understood, real pain points identified, and the marginal value of digitization confirmed.

---

## 7. Related Documents

- [Software Requirements Specification (SRS)](./02-srs.md)
- [Architecture Reference](../technical/01-architecture.md)
- [Database Schema](../technical/02-database.md)
