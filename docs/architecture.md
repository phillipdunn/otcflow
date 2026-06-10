# OTCFlow architecture

OTCFlow is a **modular monolith**: one deployable API process and one web app, with code organised into **logical service boundaries** that could be extracted into independent services later. This document describes how the system is structured today, how events flow, who owns which data, and what would change in a multi-service deployment.

For desk vocabulary and product direction, see [platform-context.md](platform-context.md). For cloud resource mapping, see [infra/terraform/README.md](../infra/terraform/README.md).

---

## 1. System overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / client                         │
│  apps/web — React blotter (REST + /ws/deals; GraphQL optional)   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP / WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    apps/api — single Node process                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ REST routes │  │ GraphQL HTTP │  │ WebSocket upgrade router │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘  │
│         │                │                       │               │
│         └────────────────┼───────────────────────┘               │
│                          ▼                                       │
│              Logical services (deal, audit, user, …)             │
│                          │                                       │
│              ┌───────────┴───────────┐                           │
│              ▼                       ▼                           │
│     InMemoryDealEventBus      Prisma → PostgreSQL                │
│              │                                                   │
│     ┌────────┴────────┐                                          │
│     ▼                 ▼                                          │
│  /ws/deals        GraphQL dealUpdated                            │
└─────────────────────────────────────────────────────────────────┘

packages/shared — Zod schemas + types (library, not a runtime service)
```

The monorepo separates **delivery** (`apps/web`, `apps/api`) from **contracts** (`packages/shared`). Runtime coupling is through HTTP, WebSocket, and shared types — not through separate network services yet.

---

## 2. Main runtime components

| Component | Role today | Primary location |
| --------- | ---------- | ---------------- |
| **Web app** | Blotter UI; TanStack Query cache; live updates via `/ws/deals` | `apps/web` |
| **API app** | HTTP edge, business logic, persistence, event fan-out | `apps/api` |
| **Shared package** | Wire contracts (`Deal`, `AuditEvent`, `DealEvent`, `User`, health) | `packages/shared` |
| **Database** | Authoritative store for deals, audit rows, seeded users | PostgreSQL via Prisma (`apps/api/prisma/`) |
| **Event bus** | Post-commit domain event fan-out (in-process) | `events/dealEventBus.ts`, `events/inMemoryDealEventBus.ts` |
| **WebSocket layer** | Raw deal event stream with `sequenceNumber` | `ws/dealsWs.ts`, `ws/routeWebSocketUpgrades.ts` |
| **GraphQL layer** | Queries, mutations, `dealUpdated` subscription | `graphql/` (HTTP + `graphql-ws` at `/graphql`) |
| **Simulator** | Synthetic deal activity for demos | `services/simulator.service.ts`, `routes/simulator.routes.ts` |

### Web app (`apps/web`)

- Serves the dealing-desk **blotter** (MUI + AG Grid).
- Reads deals via REST (`dealsClient.ts`); optional GraphQL client is not wired into the blotter today.
- Subscribes to **`ws://host/ws/deals`** via `useDealEventsWebSocket` — merges by `sequenceNumber` then `deal.version`.
- Sends **`x-user-id`** on mutations for demo attribution (Phase 6).

### API app (`apps/api`)

- **Express** application created in `app.ts`; HTTP server and WebSocket upgrades wired in `index.ts`.
- **REST** — `routes/deals.routes.ts`, `routes/simulator.routes.ts`, health, metrics.
- **GraphQL HTTP** — `POST /graphql` via `mountGraphQLHttp.ts`.
- **WebSockets** — upgrade router dispatches `/ws/deals` and `/graphql` to separate `ws` servers (avoids conflicting handlers on one listener).
- **Observability** — structured logs, `/health/live`, `/health/ready`, `/metrics`, graceful shutdown.

### Shared package (`packages/shared`)

- Compiled TypeScript library consumed by web and API.
- **Zod** schemas enforce runtime shape at boundaries (API responses, WebSocket payloads, bus events).
- Not a network service — in a split architecture it becomes versioned API contracts (OpenAPI, protobuf, or shared npm package).

### Database

- Single PostgreSQL database, single Prisma schema.
- Tables: `Deal`, `AuditEvent`, `User` (see `prisma/schema.prisma`).
- Migrations and seed via `apps/api` scripts; Compose runs `prisma migrate deploy` on API container start.

### Event bus

- **`DealEventBus`** interface (`events/eventBus.types.ts`) — `publish` / `subscribe`.
- **`InMemoryDealEventBus`** — synchronous, in-process fan-out; validates with `DomainDealEventSchema` before dispatch.
- Singleton **`dealEventBus`** used by deal service, simulator, and subscriber bridges.

### WebSocket layer

- **`/ws/deals`** — JSON messages matching **`DealEventSchema`** (domain event + monotonic **`sequenceNumber`**).
- **`broadcastDealEventToClients`** assigns sequence numbers and pushes to all OPEN clients.
- Bridge: `wireDealEventBusToWebSocket.ts`.

### GraphQL layer

- HTTP: queries (`deals`, `deal`, `dealEvents`), mutations (`createDeal`, `updateDealStatus`).
- Subscriptions: **`dealUpdated`** over **`graphql-ws`** at `ws://host/graphql`.
- Payload is **`DealDomainEvent`** — `type` + `deal` only (no `sequenceNumber`).
- Bridge: `wireDealEventBusToGraphQL.ts` → `graphQLPubSub` (`graphql-subscriptions` in-memory pub/sub).

### Simulator

- Background tick loop generating creates, status changes, price changes, and amends.
- Uses the **same write path** as REST/GraphQL (Prisma transaction + audit + `dealEventBus.publish`).
- Control state (`running`, `streamEpoch`, `eventsEmitted`) is **in-memory** in the API process, not persisted.

---

## 3. Logical service boundaries

These are **modules inside the monolith**, not separate deployables. Each maps to a folder convention you could lift into its own service.

| Boundary | Responsibility | Key modules |
| -------- | -------------- | ----------- |
| **Deal Service** | CRUD-ish deal operations; optimistic versioning on status updates | `services/deal.service.ts`, `repositories/deal.repository.ts`, `routes/deals.routes.ts`, GraphQL deal resolvers |
| **Audit Service** | Append-only compliance history per deal | `services/audit.service.ts`, `repositories/audit.repository.ts` |
| **User Context / Identity Service** | Resolve acting user; demo header → `req.currentUser` | `middleware/userContext.middleware.ts`, `data/user.store.ts`, `repositories/user.repository.ts` |
| **Simulator Service** | Synthetic market activity; reset/seed | `services/simulator.service.ts`, `simulator/dealGenerator.ts` |
| **Event / Notification Service** | Post-commit fan-out to subscribers | `events/dealEventBus.ts`, `wireDealEventBusToWebSocket.ts`, `wireDealEventBusToGraphQL.ts`, `ws/dealsWs.ts` |
| **API Composition Layer** | HTTP routing, CORS, auth header plumbing, error mapping | `app.ts`, `routes/`, `controllers/`, `graphql/`, `middleware/` |
| **Persistence Layer** | Prisma client, transactions, schema migrations | `db/prisma.ts`, `repositories/`, `prisma/` |

**Dependency rule (today):** Composition → Services → Repositories → Prisma. Services call audit and publish to the bus **after** a successful transaction. Subscribers never write deal or audit state.

---

## 4. Current state

| Property | Today |
| -------- | ----- |
| Deployment unit | One API container/process + one web static build |
| Process model | Modular monolith — logical boundaries, shared memory |
| Database | One PostgreSQL instance, one schema |
| Event bus | In-process `InMemoryDealEventBus` (synchronous handlers) |
| GraphQL pub/sub | In-process `graphql-subscriptions` `PubSub` |
| Auth | Demo `x-user-id` header — not production identity |
| Blotter transport | REST + `/ws/deals` (not GraphQL subscriptions) |

This keeps local development and CI simple: `docker compose up`, one migration set, one integration test database.

---

## 5. Future extractable state

A plausible evolution without rewriting business rules:

| Today (monolith) | Extracted (platform-style) |
| ---------------- | -------------------------- |
| `deal.service` module | **Deal Service** — own API + DB (deals table only) |
| `audit.service` module | **Audit Service** — append-only store; subscribe to deal events or receive explicit audit commands |
| `userContext` module | **Identity Service** — JWT/session validation; issues trusted actor claims |
| `simulator.service` | **Simulator worker** — publishes commands or calls Deal Service API |
| `InMemoryDealEventBus` | **External broker** — SNS/SQS, Kafka, RabbitMQ, Solace, EventBridge |
| `wireDealEventBusToWebSocket` | **Notification / gateway service** — WebSocket edge scaled separately |
| GraphQL in API process | **GraphQL gateway** or **BFF** federating downstream services |
| `packages/shared` | Versioned contract package or schema registry |

**Separate databases per service** where boundaries are clear:

- **Deal DB** — current `Deal` rows (mutable state).
- **Audit DB** — `AuditEvent` rows (immutable log); often fed by events rather than shared transactions.
- **Identity store** — users, roles, sessions (today: seeded `User` table in the same DB).

Cross-service consistency moves from **single Prisma transaction** to **outbox pattern** or **event-carried state transfer** — publish after commit to a durable broker.

The Terraform skeleton under `infra/terraform/` illustrates a first cloud split: static web, one API service on Fargate, one RDS — still monolith-shaped, but the same files show where a second ECS service or queue would attach.

---

## 6. Event flow

Typical **command** path (REST `POST /deals`, GraphQL `createDeal`, or simulator tick):

```text
1. Command received
   REST / GraphQL / simulator → controller or resolver → service

2. Service mutates state (transaction)
   prisma.$transaction:
     - insert or update Deal
     - append AuditEvent (attributed to req.currentUser or simulator user)

3. Domain event published (after commit)
   dealEventBus.publish({ type, deal })   // DomainDealEvent — no sequenceNumber

4. Subscribers notified (synchronous in-process today)
   ├── wireDealEventBusToWebSocket
   │     → broadcastDealEventToClients (adds sequenceNumber)
   │     → all /ws/deals clients
   └── wireDealEventBusToGraphQL
         → graphQLPubSub.publish('DEAL_UPDATED', { dealUpdated: event })
         → dealUpdated subscription clients
```

**Important:** Audit is **not** produced by the bus. It is written inside the service transaction **before** `publish`. The bus carries **notification** snapshots for live UIs, not the compliance record.

**Read path** (blotter load): `GET /deals` → TanStack Query cache; live updates merge WebSocket events on top.

---

## 7. Data ownership

| Data | Owner (logical) | Stored today | Mutable? |
| ---- | ----------------- | ------------ | -------- |
| **Current deal state** | Deal Service | `Deal` table | Yes — version increments on each write |
| **Audit history** | Audit Service | `AuditEvent` table | Append-only (no updates/deletes in app code) |
| **User identity** | User Context Service | `User` table (seeded demo users) | Rarely; snapshot copied onto each `AuditEvent` |
| **Simulator control state** | Simulator Service | In-memory only (`running`, `streamEpoch`, `intervalMs`, counters) | Yes — lost on process restart |
| **WebSocket stream cursor** | Event / Notification (server) | In-memory `nextSequenceNumber` in `dealsWs.ts` | Reset on simulator data reset |
| **Client cache** | Web app | Browser memory (TanStack Query) | Merged from REST + WebSocket; not authoritative |

**Source of truth** for deals and audit is always PostgreSQL. WebSocket and GraphQL payloads are **derived views** for subscribers.

---

## 8. Failure considerations

### Database unavailable

- **`/health/ready`** and **`/health`** return **503** when `SELECT 1` fails (`observability/dbHealth.ts`).
- **`/health/live`** still returns 200 — process is up but not ready for traffic.
- Mutations fail; no partial publish (transaction never commits).
- Web clients see failed fetches; WebSocket may stay connected but no new persisted events arrive.

### Event bus failure

- **Today:** `InMemoryDealEventBus` runs handlers synchronously in the same thread. A throwing subscriber can disrupt dispatch (handlers should stay thin).
- **Future broker:** Producer uses outbox or transactional publish; consumers retry with idempotency keys. Deal and audit remain committed even if notification lags.

### Subscriber failure

- **WebSocket client disconnected:** Server drops from client set; no retry to that socket. Client reconnects and refetches (`useDealEventsWebSocket` invalidates `['deals']` on reconnect).
- **GraphQL subscription client gone:** `graphql-ws` cleans up; no durable subscription backlog in-process.
- **Partial fan-out:** In monolith, WS and GraphQL bridges are separate subscribers — one could theoretically fail while the other succeeds if error handling differed; today both are lightweight forwards.

### Stale / out-of-order events

- **WebSocket:** Server assigns monotonic **`sequenceNumber`** per broadcast. Client ignores `sequenceNumber <= lastApplied`, then merges by **`deal.version`** per id.
- **GraphQL:** No stream sequence — clients rely on **`deal.version`** in the payload or refetch queries.
- **REST cache:** TanStack Query invalidates audit keys on WS updates; mutations invalidate on success.
- **Simulator reset:** Bumps **`streamEpoch`** and resets sequence counter so clients realign guards.

---

## 9. Why this design is useful for platform-style systems

1. **Clear seams without premature distribution** — Deal, audit, and notification code already sit in separate modules with explicit ports (`DealEventBus`). You can run one process locally and still reason about service boundaries.

2. **Event notification separated from source of truth** — Audit is transactional; live feeds are subscriptions. That mirrors production desks where compliance storage and blotter updates have different consistency requirements.

3. **Contract-first integration** — `packages/shared` forces web and API to agree on enums and payload shapes before you split repos or add a broker.

4. **Two notification channels, one domain event** — REST blotter uses `/ws/deals`; GraphQL clients use `dealUpdated`. Same `DomainDealEvent`, different wire formats — a pattern common in gateways that must support legacy and modern clients.

5. **Incremental extraction path** — Swap `InMemoryDealEventBus` for a broker adapter (see comments in `inMemoryDealEventBus.ts` and `eventBus.types.ts`) without rewriting deal or audit services. Terraform skeleton shows the next hop (single API on Fargate) before multi-service ECS.

6. **Testability** — Integration tests exercise REST, WebSocket, and GraphQL subscription paths against one real Postgres instance, proving the monolith wiring before you pay the operational cost of multiple deployables.

---

## Related docs

| Doc | Contents |
| --- | -------- |
| [platform-context.md](platform-context.md) | OTC desk vocabulary and target product shape |
| [phase-index.md](phase-index.md) | Delivery phases 1–19 and code pointers |
| [infra/terraform/README.md](../infra/terraform/README.md) | Illustrative AWS layout for the monolith |
| [README.md](../README.md) | Commands, endpoints, and what ships today |
| [runbook.md](runbook.md) | Incident response, debugging commands, remediation |
