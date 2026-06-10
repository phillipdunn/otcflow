# OTCFlow architecture (modular monolith)

OTCFlow ships as **one API process** and **one web app**, not separate deployable microservices. Code is split into **logical modules** that could be extracted later.

## Runtime layout

```text
Browser
  ├── apps/web (Vite/React) ── REST + WebSocket ──┐
  └── static build (Compose nginx / future CDN)     │
                                                    ▼
                                          apps/api (Express)
                                            ├── HTTP REST
                                            ├── WebSocket /ws/deals
                                            ├── GraphQL HTTP + /graphql WS
                                            └── PostgreSQL (Prisma)
```

## Logical modules (inside `apps/api`)

| Module | Responsibility | Primary paths |
| ------ | ---------------- | ------------- |
| **Deal** | List, read, create, update status; versioning | `services/deal.service.ts`, `repositories/deal.repository.ts`, `routes/deals.routes.ts` |
| **Audit** | Append-only history; read by deal id | `services/audit.service.ts`, `repositories/audit.repository.ts` |
| **User context** | Resolve acting user for attribution (demo header) | `middleware/userContext.middleware.ts`, `repositories/user.repository.ts`, `data/user.store.ts` |
| **Simulator** | Synthetic deal activity for demos | `services/simulator.service.ts`, `simulator/dealGenerator.ts`, `routes/simulator.routes.ts` |
| **Event / notify** | Post-commit fan-out to WebSocket and GraphQL | `events/dealEventBus.ts`, `ws/dealsWs.ts`, `graphql/wireDealEventBusToGraphQL.ts` |

**Write path:** route → controller → service → Prisma transaction (deal + audit) → `dealEventBus.publish` → subscribers.

**Audit** is written in the service layer before publish; it is not driven by the bus.

## Shared contracts

`packages/shared` holds Zod schemas and types consumed by web and API. It is a **library**, not a network service.

## What this is not (yet)

- Separate deal/audit/user/simulator **processes** or repositories
- Message broker (bus is in-process; see `events/eventBus.types.ts`)
- Production auth — demo `x-user-id` only

For cloud mapping of these components, see [infra/terraform/README.md](../infra/terraform/README.md).
