# Platform context and target shape

**This file is notes and intent** — how OTCFlow relates to a real OTC desk and what the stack is meant to grow into. It is **not** a checklist of implemented features. For what is actually in the repo, see the root [README](../README.md).

---

## What OTCFlow is aiming for

OTCFlow is modeled on an **Event-driven OTC trading workflow**: voice and electronic flow, negotiated prices, and tickets that move through clear states (quote → trade → confirm → settle), with systems that stay consistent under load.

The **goal stack** (built incrementally; much of it not wired yet):

- React + TypeScript frontend
- Node.js + Express backend
- Shared TypeScript types (and validation) in a library
- REST APIs
- TanStack Query (client data fetching and cache)
- WebSockets (live quotes, blotter updates, workflow events)
- PostgreSQL (durable tickets, audit, reference data)
- Docker (repeatable environments)
- GraphQL subscriptions (optional pattern for some desks; not required for v1)
- AWS-style deployment and boundaries **later** (VPC, ALB, managed DB, etc.)

**Boundary for early steps:** avoid pulling in AWS, Docker, GraphQL, WebSockets, databases, and Prisma until you deliberately add them — keep each step small and understandable.

---

## What each repo area _is_ (in platform terms)

| Path                  | What it represents on a real desk                                                                           | What it should grow into                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`apps/web`**        | **Dealing desk / client UI** — where front office see quotes, tickets, risk hints, and workflow state.           | Rich screens for RFQs, axes, negotiation, and ticket lifecycle; live updates via WebSockets or similar; server-state via TanStack Query when you add it.     |
| **`apps/api`**        | **Gateway / orchestration** — the HTTP edge traders and internal tools hit first.                           | REST (and later optional GraphQL) for commands and queries; authn/authz; mapping to internal services; validation; rate limits; correlation IDs for support. |
| **`packages/shared`** | **Wire contracts** — the law of the land for JSON payloads between UI and API (and later between services). | Zod (or equivalent) schemas for RFQs, legs, parties, statuses, and errors; inferred TypeScript types so UI and API cannot drift silently.                    |

---

## How “shared contracts” map to OTC systems

- **Today:** `HealthResponseSchema` is a stand-in — same pattern you will use for **agreed wire formats** for quotes, orders, and workflow events.
- **Tomorrow:** one definition for “RFQ created,” “quote revised,” “trade done,” consumed by the gateway and the desk UI — mirrors how serious trading APIs avoid duplicate DTOs and mismatched enums.

## Ticket / workflow lifecycle (conceptual)

A common mental model (not implemented until you model it in code and DB):

**draft → sent → acknowledged → filled** (with branches for cancel, reject, amend).

The monorepo structure supports evolving those states in **`packages/shared`** while **`apps/web`** and **`apps/api`** stay in lockstep.

---

## Event-driven angle

“Event-driven” here means: important state changes should be observable as **facts** (messages or events) that multiple consumers can react to — blotter, risk, confirmations, ops dashboards — not only as a single synchronous HTTP response. You might start with REST + polling, then add WebSockets or a message bus when the story needs it.

---

## Why the README stays separate

- **README** = shipped behavior, commands, and layout (easy to verify against `git`).
- **This doc** = vocabulary, analogies, and direction so you do not lose the “what should be what” notes while the code catches up.

Update this file when your understanding of the desk or target architecture changes; update the README whenever behavior or commands change.
