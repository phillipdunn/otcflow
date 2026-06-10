# Platform context and target shape

**This file is notes and intent** — how OTCFlow relates to a real OTC desk and what the stack is meant to grow into. It is **not** a checklist of implemented features. For what is actually in the repo, see the root [README](../README.md).

---

## What OTCFlow is aiming for

OTCFlow is modeled on an **Event-driven OTC trading workflow**: voice and electronic flow, negotiated prices, and tickets that move through clear states (quote → trade → confirm → settle), with systems that stay consistent under load.

The stack was built **incrementally by phase**. The following are **in the repo today** (see the root [README](../README.md) for commands and layout):

- React + TypeScript frontend (**Phase 5** blotter: MUI + AG Grid)
- Node.js + Express backend
- Shared TypeScript types and Zod validation in **`packages/shared`**
- REST APIs + TanStack Query on the web (**Phase 3**)
- WebSockets — deal create/status over **`/ws/deals`** (**Phase 4**); internal **`DealEventBus`** (**Phase 12**)
- **Acting user / attribution (demo)** — **`x-user-id`** → **`req.currentUser`** (**Phase 6**); not login or RBAC
- **Audit trail** — append-only **`AuditEvent`** per deal (**Phase 7**), persisted in **PostgreSQL** via **Prisma** (**Phase 9**)
- **PostgreSQL** + **Prisma** migrations, seed, Docker Compose stack (**Phases 9–10**)
- Automated tests + **GitHub Actions CI** (**Phase 11–14**)
- **GraphQL** queries/mutations and **`dealUpdated`** subscription (**Phase 13**); blotter still uses REST + TanStack Query
- Observability — structured logs, health, metrics, graceful shutdown (**Phase 15**)
- Educational **Terraform skeleton** for a possible AWS layout (**Phase 16** — files only; **not applied** from this repo)

**Still ahead** (not shipped or not production-grade):

- Applying infrastructure to a live cloud account (Terraform is illustrative)
- Real authentication, RBAC, and trusted identity (replacing demo **`x-user-id`**)
- Full streaming quote feeds, RFQ axes, risk, confirmations — beyond the deal blotter slice
- Multi-service / event-bus-at-scale patterns beyond the current monolith

---

## What each repo area _is_ (in platform terms)

| Path                  | What it represents on a real desk                                                                           | What it should grow into                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`apps/web`**        | **Dealing desk / client UI** — where front office see quotes, tickets, risk hints, and workflow state.      | **Shipped:** blotter (MUI + AG Grid), TanStack Query + **`/ws/deals`**, acting-as user + **`x-user-id`**, audit timeline in deal detail, RTL + MSW tests. **Ahead:** RFQ/axes screens, negotiation flows, live quote and risk feeds. |
| **`apps/api`**        | **Gateway / orchestration** — the HTTP edge traders and internal tools hit first.                           | **Shipped:** REST + **`/ws/deals`**, **`req.currentUser`**, audit, Postgres/Prisma, simulator, internal event bus, GraphQL, CI, health/metrics/logs/shutdown. **Ahead:** production auth, multi-service extraction. See [architecture.md](architecture.md). |
| **`packages/shared`** | **Wire contracts** — the law of the land for JSON payloads between UI and API (and later between services). | Zod schemas for **`Deal`**, **`DealEvent`**, **`AuditEvent`**, **`User`**, and errors; inferred TypeScript types so UI and API cannot drift silently.                                            |

---

## Shipped slice vs full desk

The **blotter UI** in `apps/web` is a deliberate **thin vertical slice**: same mental model as a live desk (rows = tickets/deals, columns = economics and parties, filters = “what am I looking at?”). It loads deals from the **API** (TanStack Query + **`/ws/deals`** live updates), not from in-browser mocks — **`MOCK_DEALS`** in `mockDeals.ts` remains for tests/samples only.

**AG Grid** carries the high-density table; **MUI** carries app chrome, forms, and dialogs. **`useBlotterView`** keeps filters/sort/selection separate from server state so the list source can evolve without rewriting the grid.

The web client uses **`apps/web/src/api/requestJson.ts`** for generic **`fetch`** + **`ApiRequestError`**, and **`dealsClient.ts`** for deal paths plus Zod (**`Deal`** / **`Deal[]`**).

---

## How “shared contracts” map to OTC systems

- **Today:** `DealSchema` encodes **product** (rates: `IRS`, `OIS`; FX: `FX_OPTION`, `FX_SWAP`, `FX_NDF`; credit: `CDS`, `CDX`; cash: `BOND`; equity: `EQUITY_OPTION`, `EQUITY_SWAP`), **currency** (`GBP`, `USD`, `EUR`), **status** (`NEW`, `PENDING`, `MATCHED`, `CANCELLED`, `BOOKED`), **version**, and timestamps; `HealthResponseSchema` covers API readiness; **`UserSchema`** (**`id`**, **`name`**, **`role`**: `BROKER` | `TRADER` | `SUPERVISOR` | `OPERATIONS`) plus **`MOCK_USERS`** for Phase 6 acting-as — same **schema + `z.infer`** pattern for richer payloads later.
- **Phase 15** adds **observability**: structured logs, **`/health/live`** / **`/health/ready`**, **`/metrics`**, graceful shutdown — see [phase-index.md](phase-index.md) and root README § Operations.
- **Phase 14** adds **GitHub Actions CI** on PRs and **`main`** — see [phase-index.md](phase-index.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).
- **Tomorrow:** one definition for “RFQ created,” “quote revised,” “trade done,” and **who** performed each action (audit / compliance), consumed by the gateway, GraphQL schema, and the desk UI — mirrors how serious trading APIs avoid duplicate DTOs and mismatched enums.

## Identity and attribution (Phase 6 — demo only)

On a live desk, every material action is tied to a **person or system account** (trader, broker, ops, supervisor). Phase 6 does not implement login; it establishes the **plumbing**:

- UI: user picks **Acting as** in the app bar; toolbar shows **name · role**.
- HTTP: mutations send **`x-user-id`** (demo header — not cryptographically trusted).
- API: **`userContextMiddleware`** sets **`req.currentUser`**; TypeScript knows about it via **`apps/api/src/types/express.d.ts`** (declaration merge on **`Express.Request`** — compile-time only; middleware sets the value at runtime).

**Phase 7** appends immutable **`AuditEvent`** rows on create/status using **`req.currentUser`** (stored in PostgreSQL since **Phase 9**). Production path: JWT/session → verified identity → same **`req.currentUser`** hook → RBAC on transitions.

Details: [phase-index.md](phase-index.md) (Phases 6–7); implementation in `userContext.middleware.ts`, `audit.service.ts`, and `DealAuditHistory.tsx`.

## Ticket / workflow lifecycle (conceptual)

A common mental model (not implemented until you model it in code and DB):

**draft → sent → acknowledged → filled** (with branches for cancel, reject, amend).

The monorepo structure supports evolving those states in **`packages/shared`** while **`apps/web`** and **`apps/api`** stay in lockstep.

---

## Event-driven angle

“Event-driven” here means: important state changes should be observable as **facts** (messages or events) that multiple consumers can react to — blotter, risk, confirmations, ops dashboards — not only as a single synchronous HTTP response. **Phase 4** pushes **`DealEvent`** snapshots over **`/ws/deals`** (live UI). **Phase 6** adds **who** initiated writes via **`req.currentUser`**. **Phase 7** persists **audit facts** separately from the mutable **`Deal`** row (**`GET /deals/:id/events`**). **Phase 12** centralises post-commit notify on an internal **`DealEventBus`** so WebSocket and GraphQL subscriptions are subscribers, not callers from the write path.

---

## How the docs fit together

| Doc | Role |
| --- | ---- |
| **[README](../README.md)** | Shipped behavior, commands, and layout — verify against `git`. |
| **[phase-index.md](phase-index.md)** | Canonical phase numbers (1–19) and where to look in the repo. |
| **[architecture.md](architecture.md)** | Modular monolith, service boundaries, event flow, data ownership, failure notes. |
| **This file** | Desk vocabulary, analogies, and what is still ahead of the current slice. |

Optional longer walkthrough notes may live in `docs/phases/` locally; that folder is **gitignored** — do not link to it from committed docs.

Update this file when your understanding of the desk or target architecture changes; update the README whenever behavior or commands change.
