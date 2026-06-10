# Phase 15 — Observability and production-support basics (local notes)

**How phase docs are structured:** **Scope** → **Walkthrough (slow)** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

---

## Scope (what Phase 15 was)

- **Structured JSON logging** — one line per event on stdout (`logger.info`, `warn`, `error`).
- **Request IDs** — **`X-Request-Id`** header in/out; **`req.requestId`**; echoed on errors.
- **Middleware:** **`requestIdMiddleware`**, **`requestLoggingMiddleware`**; **`errorMiddleware`** logs with correlation.
- **Health endpoints:**
  - **`GET /health/live`** — liveness (process up, no DB).
  - **`GET /health/ready`** — readiness (**503** if Postgres fails **`SELECT 1`**).
  - **`GET /health`** — legacy readiness + **`HealthResponseSchema`** when OK.
- **`GET /metrics`** — JSON snapshot: uptime, request counts, errors, WebSocket clients, simulator status.
- **Graceful shutdown** — **SIGINT** / **SIGTERM**: stop simulator → close deal + GraphQL WebSockets → close HTTP → **`prisma.$disconnect()`**.
- **Operational logs:** startup, DB connect, simulator start/stop, WS connect/disconnect, uncaught errors / unhandled rejections.
- **Tests:** **`health.integration.test.ts`** (5 cases).
- **README:** health, metrics, debugging table.
- **Not added:** Prometheus format, Datadog, Pino/Winston, distributed tracing, log aggregation infra.

**Builds on:** [phase-9-postgres-persistence.md](phase-9-postgres-persistence.md) (DB readiness), [phase-8-market-simulator.md](phase-8-market-simulator.md) (simulator stop on shutdown), [phase-13-graphql.md](phase-13-graphql.md) (GraphQL WS client count).

---

## What problem this solves

| Before (Phase 14) | After (Phase 15) |
| ----------------- | ---------------- |
| `console.log` only | Searchable JSON logs with **`message`** + fields |
| No request correlation | **`requestId`** across logs and error JSON |
| Single **`GET /health`** (DB + process mixed) | **live** vs **ready** for orchestrators |
| No ops snapshot | **`/metrics`** for traffic, errors, WS, simulator |
| SIGTERM → disconnect DB only | Ordered shutdown of simulator, WS, HTTP, DB |

**Boundary:** still **one Node process**, in-memory metrics — enough for local/Docker ops and README-style runbooks — not full production APM.

---

## Walkthrough (slow)

### 1. Structured logging

**`apps/api/src/observability/logger.ts`:**

```json
{"timestamp":"...","level":"info","message":"http_request","requestId":"...","statusCode":200}
```

- **`message`** = event type (`http_request`, `database_connected`, `simulator_started`, …).
- Extra keys = context (no free-text parsing).

### 2. Request ID flow

**`requestIdMiddleware`** (first in **`createApp()`**):

- Read **`x-request-id`** or generate UUID.
- Set **`req.requestId`** and response header **`X-Request-Id`**.
- CORS exposes header to browser.

**`requestLoggingMiddleware`:** on **`res.finish`**, log **`http_request`** with **`requestId`**, **`durationMs`**, route key.

**`errorMiddleware`:** **`logger.warn`** / **`logger.error`** + **`requestId`** in JSON error body.

### 3. Health endpoints

| Route | DB check | HTTP | Use |
| ----- | -------- | ---- | --- |
| `/health/live` | No | 200 | Liveness probe |
| `/health/ready` | `SELECT 1` via Prisma | 200 / 503 | Readiness / load balancer |
| `/health` | Same as ready | 200 / 503 | Legacy clients + shared schema |

**`isDatabaseReady()`** in **`dbHealth.ts`** — try/catch around **`prisma.$queryRaw\`SELECT 1\``**.

### 4. Metrics

**`GET /metrics`** → **`collectMetrics()`**:

- **`uptimeSeconds`**, **`totalRequests`**, **`requestsByRoute`**, **`errorCount`**
- **`activeDealWebSocketClients`** — **`Set`** size in **`dealsWs.ts`**
- **`activeGraphQLSubscriptionClients`** — counter in **`graphqlWsMetrics.ts`**
- **`simulator`** — **`getSimulatorStatus()`** (same as REST status)

Counters increment in **`requestLoggingMiddleware`**; errors on 5xx in error middleware.

### 5. WebSocket logging and counts

**`/ws/deals`:** `clients` **`Set`** — add/remove on connection/close; log **`deals_websocket_client_connected`**.

**`/graphql`:** increment/decrement **`graphqlWsMetrics`** on connection lifecycle.

### 6. Graceful shutdown

**`registerGracefulShutdown({ httpServer, dealsWss, graphQLWss })`** in **`index.ts`:**

```text
SIGTERM / SIGINT
  → stopSimulator()        (clearInterval)
  → close WS servers       (code 1001 to clients)
  → httpServer.close()
  → prisma.$disconnect()
  → exit 0
```

**`registerProcessErrorHandlers()`** — log **`uncaught_exception`** / **`unhandled_rejection`**.

Startup uses **`logger.info`** (`app_starting`, `database_connected`, `app_listening` with URLs).

---

## Diagram

```text
HTTP request
  → requestIdMiddleware
  → requestLoggingMiddleware (+ metrics)
  → routes / GraphQL / WS (unchanged business logic)
  → errorMiddleware (structured errors)

Ops:  /health/live   /health/ready   /metrics
Stop: SIGTERM → gracefulShutdown.ts
```

---

## Key files (Phase 15)

| Path | Role |
| ---- | ---- |
| `apps/api/src/app.ts` | Middleware order |
| `apps/api/src/observability/logger.ts` | JSON logger |
| `apps/api/src/observability/requestId.middleware.ts` | Correlation id |
| `apps/api/src/observability/requestLogging.middleware.ts` | Access logs + metrics |
| `apps/api/src/observability/metrics.ts` | Counters + snapshot |
| `apps/api/src/routes/health.routes.ts` | live / ready / health |
| `apps/api/src/routes/metrics.routes.ts` | GET /metrics |
| `apps/api/src/observability/gracefulShutdown.ts` | SIGTERM handling |
| `apps/api/src/observability/dbHealth.ts` | DB readiness |
| `apps/api/src/index.ts` | Startup logs + register shutdown |
| `apps/api/src/routes/health.integration.test.ts` | Tests |

**Three files to know cold:**

1. **`app.ts`** — where observability hooks every HTTP request.  
2. **`health.routes.ts`** — live vs ready vs legacy.  
3. **`gracefulShutdown.ts`** — safe restart order.

---

## Complexity note (review)

Phase 15 adds **~10 small files** under **`observability/`** plus thin route/middleware wiring — no new frameworks. Each file has one job (log, id, metrics, shutdown, DB ping). Intentionally boring so ops patterns map to Kubernetes/Docker later without refactoring deals or GraphQL.

---

## Checklist (review)

1. **`curl /health/live`** → 200 without caring about DB.
2. **`curl /health/ready`** → 200 with Postgres; 503 if DB stopped.
3. **`curl /metrics`** → JSON with uptime and simulator block.
4. Response includes **`X-Request-Id`**; pass custom id and see it echoed.
5. Ctrl+C / **`docker stop`** → structured shutdown logs; no hung simulator timer.
6. **`npm run test:integration`** — health tests pass.

---

## Later

- Prometheus **`/metrics`** exposition format.
- OpenTelemetry traces (span per **`requestId`**).
- Wire Docker/K8s probes to **`/health/live`** and **`/health/ready`**.
- Central log shipping (not stdout only).

---

## Review one-liner

Phase 15 makes OTCFlow **operable**: JSON logs, **request IDs**, **live/ready** health, JSON **metrics**, and **graceful shutdown** of simulator, WebSockets, HTTP, and Prisma — business logic unchanged.

**Builds on:** [phase-14-ci-cd.md](phase-14-ci-cd.md).
