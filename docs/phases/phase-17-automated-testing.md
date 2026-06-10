# Phase 17 — Close automated testing gaps (local notes)

**How phase docs are structured:** **Scope** → **Walkthrough (slow)** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

---

## Scope (what Phase 17 was)

- **Simulator integration tests** — start, stop, reset, status; tick emits domain events.
- **WebSocket integration tests** — real `ws` client receives `DEAL_CREATED` / `DEAL_STATUS_CHANGED` after REST writes.
- **`useDealEventsWebSocket` unit tests** — version merge, sequence guard, stale event ignore.
- **Shared package schema tests** — `DealSchema`, `AuditEventSchema`, `DealEventSchema`, `UserSchema`.
- **Readiness failure unit tests** — `isDatabaseReady` false path; `/health/ready` returns 503 when DB check fails.
- **Integration HTTP server helper** — `startIntegrationHttpServer` mirrors `index.ts` WS wiring for tests.
- **CI hardening** — Postgres image from AWS ECR public mirror (Docker Hub timeout workaround).
- **Docs:** `docs/architecture.md` (initial), `docs/phase-index.md`, platform-context fixes.
- **Not added:** GraphQL subscription E2E (Phase 18), Playwright in default CI, full e2e for simulator.

**Builds on:** [phase-11-testing.md](phase-11-testing.md), [phase-8-market-simulator.md](phase-8-market-simulator.md), [phase-4-websocket-realtime.md](phase-4-websocket-realtime.md).

---

## What problem this solves

| Before | After |
| ------ | ----- |
| Simulator untested | REST control plane + event emission covered |
| WS bridge only unit-tested | End-to-end upgrade + broadcast proven |
| Hook merge logic untested | Regression guard for pulsing/stale UI class |
| Shared Zod only compile-time | Runtime parse success/failure tests |
| `/health/ready` 503 untested | Safe mocked unit coverage |

---

## Walkthrough (slow)

### 1. Integration test stack

**`integration.setup.ts`** — Postgres, `createApp()`, shared **`integrationHttpServer`** (one bus wiring).

**`beforeEach`** — stop simulator, wipe deals and audit.

### 2. Simulator tests

`simulator.integration.test.ts` — Supertest against `/simulator/*`; reset seeds 500 deals + audit rows.

### 3. WebSocket tests

`dealsWs.integration.test.ts` — `ws` client on `integrationHttpServer.wsDealsUrl`.

### 4. Web hook tests

`useDealEventsWebSocket.test.tsx` — mock `WebSocket`, assert TanStack Query cache updates.

### 5. Shared + health unit tests

`packages/shared/src/schemas.test.ts`; `dbHealth.test.ts`, `health.routes.test.ts`.

---

## Diagram

```text
Vitest integration
  → integrationApp (Supertest REST/GraphQL HTTP)
  → integrationHttpServer (real WS upgrade)
  → dealEventBus → /ws/deals clients
```

---

## Key files

- `apps/api/src/routes/simulator.integration.test.ts`
- `apps/api/src/ws/dealsWs.integration.test.ts`
- `apps/api/src/test/integrationHttpServer.ts`, `integration.setup.ts`
- `apps/web/src/blotter/useDealEventsWebSocket.test.tsx`
- `packages/shared/src/schemas.test.ts`, `vitest.config.ts`
- `.github/workflows/ci.yml` — ECR Postgres image

---

## Checklist

- [ ] `npm run test:unit` — shared + api + web
- [ ] `npm run test:integration` — with Postgres
- [ ] `npm run ci` locally before PR

---

## Later

- GraphQL subscription integration (Phase 18)
- Playwright in optional/nightly workflow only
- Optimistic locking / concurrent update tests

---

## Review one-liner

**Phase 17** closes **test confidence gaps** — simulator, WebSocket E2E, hook merge guards, shared Zod schemas, and health readiness failure paths — without new product features.
