# OTCFlow phase index

**Canonical map of delivery phases** used in README, branch names, and commit messages.

This file is **committed** and safe to link from docs. Optional longer walkthrough notes may live in `docs/phases/` on your machine — that folder is **gitignored** and is not required to use the repo.

| Phase | Topic | Shipped in repo | Where to look |
| ----- | ----- | --------------- | ------------- |
| 1 | Monorepo + shared `Deal` types + mock blotter slice | Yes | `packages/shared`, early blotter patterns |
| 2 | REST API (in-memory deals) | Superseded | Replaced by Phase 9 persistence; routes unchanged |
| 3 | Web ↔ API with TanStack Query | Yes | `apps/web/src/main.tsx`, `dealsClient.ts`, `BlotterScreen.tsx` |
| 4 | WebSocket deal events (`/ws/deals`) | Yes | `apps/api/src/ws/`, `useDealEventsWebSocket.ts` |
| 5 | MUI + AG Grid blotter | Yes | `apps/web/src/blotter/`, `grid/` |
| 6 | Acting user (`x-user-id` → `req.currentUser`) | Yes | `userContext.middleware.ts`, `AppBarUserSelect.tsx` |
| 7 | Audit trail per deal | Yes | `audit.service.ts`, `DealAuditHistory.tsx`, `GET /deals/:id/events` |
| 8 | Market simulator (live deltas) | Yes | `simulator.service.ts`, `BlotterSimulatorControls.tsx` |
| 9 | PostgreSQL + Prisma persistence | Yes | `apps/api/prisma/`, [DATABASE.md](../apps/api/DATABASE.md) |
| 10 | Docker Compose (web + api + postgres) | Yes | [docker-compose.yml](../docker-compose.yml), README § Docker |
| 11 | Automated tests (API + web unit) | Yes | `*.test.ts`, `*.test.tsx`, `e2e/` |
| 12 | In-memory domain event bus | Yes | `events/dealEventBus.ts`, `wireDealEventBusToWebSocket.ts` |
| 13 | GraphQL + subscriptions | Yes | `apps/api/src/graphql/`, blotter still REST |
| 14 | GitHub Actions CI | Yes | `.github/workflows/ci.yml`, [CONTRIBUTING.md](../CONTRIBUTING.md) |
| 15 | Observability (logs, health, metrics, shutdown) | Yes | `apps/api/src/observability/`, README § Operations |
| 16 | Terraform skeleton (not deployed) | Yes | [infra/terraform/README.md](../infra/terraform/README.md) |
| 17 | Test coverage gaps (simulator, WS, shared schemas) | Yes | `*.integration.test.ts`, `packages/shared/src/schemas.test.ts`, `useDealEventsWebSocket.test.tsx` |
| 18 | GraphQL subscription integration tests | Yes | `graphqlSubscriptions.integration.test.ts`, `graphqlWsTestClient.ts` |
| 19 | Architecture and service boundaries docs | Yes | [architecture.md](architecture.md) |

## README section names vs phase numbers

The **“Why it is structured this way”** list in the root README is numbered for readability (1–12). Those numbers are **not** phase IDs — e.g. item 10 there is “WebSocket deal events” (Phase **4**), not Phase 10 (Docker).

## Branch naming

Use `phase-N-short-topic` (e.g. `phase-19-architecture`) per [CONTRIBUTING.md](../CONTRIBUTING.md).

## Related docs

| Doc | Role |
| --- | ---- |
| [architecture.md](architecture.md) | Modular monolith boundaries (Phase 19) |
| [platform-context.md](platform-context.md) | Desk vocabulary and target shape |
