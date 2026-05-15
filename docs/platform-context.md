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
- WebSockets (live quotes, blotter updates, workflow events) — **Phase 4**: deal create/status events over **`/ws/deals`** ([phase-4 walkthrough](phases/phase-4-websocket-realtime.md)); broader feeds still TBD.
- **Acting user / attribution (demo)** — **Phase 6**: mock **`User`** + **`x-user-id`** → **`req.currentUser`** on the API ([phase-6 walkthrough](phases/phase-6-user-context.md)); not login or RBAC yet — prerequisite for audit trail (Step 7).
- PostgreSQL (durable tickets, audit, reference data)
- Docker (repeatable environments)
- GraphQL subscriptions (optional pattern for some desks; not required for v1)
- AWS-style deployment and boundaries **later** (VPC, ALB, managed DB, etc.)

**Boundary for early steps:** avoid pulling in AWS, Docker, GraphQL, full streaming quote feeds, databases, and Prisma until you deliberately add them — keep each step small and understandable. (Deal-row **WebSockets** are in for Phase 4; everything else on the list above is still optional / later.)

---

## What each repo area _is_ (in platform terms)

| Path                  | What it represents on a real desk                                                                           | What it should grow into                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`apps/web`**        | **Dealing desk / client UI** — where front office see quotes, tickets, risk hints, and workflow state.      | Rich screens for RFQs, axes, negotiation, and ticket lifecycle; **Phase 4** WebSocket-driven deal updates; **Phase 5** **MUI + AG Grid** blotter; **Phase 6** “acting as” user in the app bar + **`x-user-id`** on mutations; further live feeds (quotes, risk) still TBD. |
| **`apps/api`**        | **Gateway / orchestration** — the HTTP edge traders and internal tools hit first.                           | REST for commands and queries; **Phase 6** resolves **`x-user-id`** to **`req.currentUser`** (mock users today); later JWT/session, RBAC, correlation IDs, rate limits.                         |
| **`packages/shared`** | **Wire contracts** — the law of the land for JSON payloads between UI and API (and later between services). | Zod schemas for **`Deal`**, **`DealEvent`**, **`User`** (desk roles), and errors; inferred TypeScript types so UI and API cannot drift silently.                                            |

---

## Shipped slice vs full desk (Phase 1)

The **blotter UI** in `apps/web` is a deliberate **thin vertical slice**: same mental model as a live desk (rows = tickets/deals, columns = economics and parties, filters = “what am I looking at?”), but backed by **mock deals** only. **AG Grid** carries the high-density table (virtualisation, column APIs, export path later); **MUI** carries app chrome, forms, and dialogs. It proves:

- **`Deal`** / **`DealStatus`** in **`packages/shared`** driving the UI types and mock validation.
- Desk-style interaction patterns (search, filters, sort, drill-in) before you pay the cost of persistence and feeds.

Replacing **`MOCK_DEALS`** with API + TanStack Query (or WebSocket snapshots) later should reuse the same **`useBlotterView`** shape: swap the source list, keep the presentation components. The web client uses **`apps/web/src/api/requestJson.ts`** for generic **`fetch`** + **`ApiRequestError`**, and **`dealsClient.ts`** for deal paths plus Zod (**`Deal`** / **`Deal[]`**) so new resources can share the HTTP layer without duplicating error handling.

---

## How “shared contracts” map to OTC systems

- **Today:** `DealSchema` encodes **product** (rates: `IRS`, `OIS`; FX: `FX_OPTION`, `FX_SWAP`, `FX_NDF`; credit: `CDS`, `CDX`; cash: `BOND`; equity: `EQUITY_OPTION`, `EQUITY_SWAP`), **currency** (`GBP`, `USD`, `EUR`), **status** (`NEW`, `PENDING`, `MATCHED`, `CANCELLED`, `BOOKED`), **version**, and timestamps; `HealthResponseSchema` covers API readiness; **`UserSchema`** (**`id`**, **`name`**, **`role`**: `BROKER` | `TRADER` | `SUPERVISOR` | `OPERATIONS`) plus **`MOCK_USERS`** for Phase 6 acting-as — same **schema + `z.infer`** pattern for richer payloads later.
- **Tomorrow:** one definition for “RFQ created,” “quote revised,” “trade done,” and **who** performed each action (audit / compliance), consumed by the gateway and the desk UI — mirrors how serious trading APIs avoid duplicate DTOs and mismatched enums.

## Identity and attribution (Phase 6 — demo only)

On a live desk, every material action is tied to a **person or system account** (trader, broker, ops, supervisor). Phase 6 does not implement login; it establishes the **plumbing**:

- UI: user picks **Acting as** in the app bar; toolbar shows **name · role**.
- HTTP: mutations send **`x-user-id`** (demo header — not cryptographically trusted).
- API: **`userContextMiddleware`** sets **`req.currentUser`**; TypeScript knows about it via **`apps/api/src/types/express.d.ts`** (declaration merge on **`Express.Request`** — compile-time only; middleware sets the value at runtime).

Step 7 (audit trail) will **consume** **`req.currentUser`** when appending immutable history rows. Production path: JWT/session → verified identity → same **`req.currentUser`** hook → RBAC on transitions.

Details: [phases/phase-6-user-context.md](phases/phase-6-user-context.md).

## Ticket / workflow lifecycle (conceptual)

A common mental model (not implemented until you model it in code and DB):

**draft → sent → acknowledged → filled** (with branches for cancel, reject, amend).

The monorepo structure supports evolving those states in **`packages/shared`** while **`apps/web`** and **`apps/api`** stay in lockstep.

---

## Event-driven angle

“Event-driven” here means: important state changes should be observable as **facts** (messages or events) that multiple consumers can react to — blotter, risk, confirmations, ops dashboards — not only as a single synchronous HTTP response. **Phase 4** pushes **`DealEvent`** snapshots over **`/ws/deals`**; **Phase 6** adds **who** initiated writes via **`req.currentUser`** (audit history in Step 7 will persist that separately from the mutable **`Deal`** row).

---

## Why the README stays separate

- **README** = shipped behavior, commands, and layout (easy to verify against `git`).
- **This doc** = vocabulary, analogies, and direction so you do not lose the “what should be what” notes while the code catches up.

Update this file when your understanding of the desk or target architecture changes; update the README whenever behavior or commands change.
