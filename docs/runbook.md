# OTCFlow operations runbook

Production-style **incident response and debugging guide** for the API and web stack as shipped in this repo. Assumes Docker Compose or native dev unless noted.

For architecture and service boundaries, see [architecture.md](architecture.md). For local setup commands, see the root [README.md](../README.md).

---

## 1. Purpose of this runbook

This runbook helps you:

- **Detect** when the platform is unhealthy (health endpoints, metrics, logs).
- **Diagnose** common failure modes (database, WebSockets, simulator, migrations).
- **Remediate** safely in local, Compose, or a future cloud deployment without guessing at behaviour.

OTCFlow today runs as a **modular monolith** (one API process, one Postgres). Most incidents reduce to: **process down**, **database unreachable**, **wrong URLs/CORS**, **event notification path broken**, or **client-side cache/ordering**.

---

## 2. Useful endpoints

Default API base: `http://localhost:3000` (Compose: published `API_PORT`, default 3000).

| Endpoint | Role | Success | Failure |
| -------- | ---- | ------- | ------- |
| **`GET /health/live`** | **Liveness** — is the Node process up? | **200** `{ status: "ok", check: "live" }` | Connection refused / timeout → process not listening |
| **`GET /health/ready`** | **Readiness** — can the API serve traffic (DB up)? | **200** `{ status: "ok", check: "ready", requestId }` | **503** `{ status: "unavailable", ... }` → Postgres probe failed |
| **`GET /health`** | **Legacy readiness** — same DB check as `/health/ready`; adds `HealthResponseSchema` when OK | **200** / **503** | Same as ready |
| **`GET /metrics`** | **Ops snapshot** (JSON, not Prometheus yet) | **200** — see §3 | Rarely fails independently of process |

**Orchestrator mapping (Kubernetes-style):**

- Liveness probe → `/health/live`
- Readiness probe → `/health/ready`
- Do **not** use `/health/live` to gate traffic that needs the database.

**Quick checks:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/health/live
curl -s http://localhost:3000/health/ready | jq .
curl -s http://localhost:3000/metrics | jq .
```

Send a correlation id through the stack:

```bash
curl -s -H 'X-Request-Id: debug-001' http://localhost:3000/deals
# Response header X-Request-Id: debug-001
```

---

## 3. Useful logs and metrics

### Structured logs (API stdout)

One **JSON object per line**. Filter with `jq` or your log platform on `message` and `requestId`.

| `message` | Meaning | Typical fields |
| --------- | ------- | -------------- |
| **`http_request`** | Request completed | `requestId`, `method`, `path`, `route`, `statusCode`, `durationMs` |
| **`http_error`** | Handled HTTP error (4xx/5xx) | `requestId`, `statusCode`, `name` |
| **`validation_error`** | Zod/body validation failed | `requestId`, `issues` |
| **`unhandled_error`** | Unexpected exception in handler | `requestId`, `error`, `stack` |
| **`database_connected`** | Prisma connected at startup | — |
| **`app_listening`** | HTTP + WS URLs | `port`, `dealsWebSocket`, `graphQLWebSocket`, `healthReady`, `metrics` |
| **`app_start_failed`** | Bootstrap failed (often DB) | `error`, `stack` |
| **`deals_websocket_client_connected`** / **`_disconnected`** | `/ws/deals` client | `activeClients` |
| **`graphql_subscription_client_connected`** / **`_disconnected`** | GraphQL WS client | `activeClients` |
| **`simulator_started`** / **`simulator_stopped`** | Simulator control | `intervalMs` (on start) |
| **`simulator_tick_failed`** | Simulator tick threw | `error` |
| **`shutdown_started`** / **`shutdown_complete`** | Graceful shutdown | `signal` on receive |

### Request ID

- Middleware sets **`req.requestId`** and response header **`X-Request-Id`**.
- Pass your own: `curl -H 'X-Request-Id: my-trace-id' ...`
- Error JSON bodies include **`requestId`** when available.
- **Grep logs:** `grep '"requestId":"my-trace-id"'` on API container/process logs.

### Metrics snapshot (`GET /metrics`)

| Field | Use |
| ----- | --- |
| `uptimeSeconds` | Process age since metrics module loaded |
| `totalRequests` / `requestsByRoute` | Traffic shape |
| `errorCount` | Monotonic counter of recorded errors |
| `activeDealWebSocketClients` | `/ws/deals` connections |
| `activeGraphQLSubscriptionClients` | `graphql-ws` connections |
| `simulator` | Same as `GET /simulator/status` (`running`, `dealCount`, `eventsEmitted`, `streamEpoch`, …) |

---

## 4. Incident scenarios

### 4.1 Database unavailable

| | |
| --- | --- |
| **Symptoms** | `/health/ready` and `/health` return **503**; mutations fail; blotter empty or errors on `GET /deals`; `app_start_failed` on boot |
| **Likely causes** | Postgres not running; wrong `DATABASE_URL` (host port **5433** on Compose host vs **5432** inside network); credentials; RDS/security group in cloud |
| **Checks** | `curl /health/ready`; `docker compose ps` (postgres healthy?); `echo $DATABASE_URL` / `apps/api/.env`; native: `pg_isready -h 127.0.0.1 -p 5433` |
| **Logs/metrics** | No `database_connected`; readiness 503; Prisma errors in `unhandled_error` / `simulator_tick_failed` |
| **Remediation** | Start Postgres (`docker compose up postgres -d` or local service); fix `DATABASE_URL`; restart API after DB is healthy; verify `curl /health/ready` → 200 |
| **Escalate when** | DB is up but API still 503; data corruption suspected; managed RDS failover in progress |

---

### 4.2 Failed migration

| | |
| --- | --- |
| **Symptoms** | API container exits on start (Compose runs `prisma migrate deploy`); schema mismatch errors; missing tables in logs |
| **Likely causes** | Migration not applied; conflicting migration history; wrong DB targeted; manual schema drift |
| **Checks** | `docker compose logs api` (migrate output); `npm run db:migrate:deploy -w @otcflow/api`; `npx prisma migrate status` in `apps/api` |
| **Logs/metrics** | Migrate stderr before `app_listening`; Prisma `P20xx` codes |
| **Remediation** | Fix `DATABASE_URL`; run `npm run docker:migrate` or `db:migrate:deploy`; **do not** `migrate reset` on shared/prod without backup; redeploy API |
| **Escalate when** | Migration fails repeatedly; production data at risk; need DBA review of failed migration SQL |

---

### 4.3 WebSocket clients not receiving updates (`/ws/deals`)

| | |
| --- |
| **Symptoms** | Blotter stale until manual refresh; browser WS shows connected but no messages; `activeDealWebSocketClients` > 0 but UI frozen |
| **Likely causes** | API not running; wrong `VITE_WS_URL` (must be `ws://localhost:3000/ws/deals` from browser, not `ws://api:3000`); event bus not wired; upgrade routed to wrong path; firewall/proxy stripping upgrades |
| **Checks** | Browser devtools → Network → WS → messages; `curl -i http://localhost:3000/ws/deals` (HTML info page OK); create deal via `curl POST /deals` while WS client connected; `/metrics` → `activeDealWebSocketClients` |
| **Logs/metrics** | `deals_websocket_client_connected`; `http_request` on `POST /deals`; absence of connect logs → client never reached server |
| **Remediation** | Ensure `npm run dev:api` or api container up; rebuild web if `VITE_WS_URL` changed (`docker compose up --build web`); verify single upgrade router (no duplicate WS servers on same HTTP listener); client refresh / reconnect |
| **Escalate when** | REST works, WS connects, but no messages after writes (possible bus bridge regression); ALB not configured for WebSocket upgrade in cloud |

---

### 4.4 GraphQL subscriptions not receiving updates

| | |
| --- |
| **Symptoms** | `dealUpdated` subscription silent; GraphQL mutations succeed; HTTP GraphQL works |
| **Likely causes** | Client on wrong URL (`ws://host/graphql`, not HTTP `/graphql`); subscription not started before mutation; `wireDealEventBusToGraphQL` not registered; graphql-ws handshake failure |
| **Checks** | Integration test pattern: `graphqlSubscriptions.integration.test.ts`; `/metrics` → `activeGraphQLSubscriptionClients`; logs `graphql_subscription_client_connected` |
| **Logs/metrics** | `graphql_subscription_client_connected` / `_disconnected`; compare with `eventsEmitted` on simulator or after mutations |
| **Remediation** | Confirm graphql-ws client uses `connectionParams` / headers for `x-user-id` if needed; restart API; verify same event bus feeds both WS and GraphQL bridges |
| **Escalate when** | Blotter REST/WS fine but GraphQL subs broken in all clients — pubsub or schema deployment issue |

---

### 4.5 Simulator runaway or excessive load

| | |
| --- |
| **Symptoms** | High CPU; rapid `http_request` / DB writes; `simulator.running: true` with low `intervalMs`; deal count climbing toward cap (5000); UI flickering |
| **Likely causes** | Simulator left started (`POST /simulator/start`); very aggressive `intervalMs` (min 50ms); many ticks not skipped |
| **Checks** | `GET /simulator/status` or `/metrics` → `simulator`; `POST /simulator/stop`; `GET /deals` count |
| **Logs/metrics** | `simulator_started` with `intervalMs`; `simulator_tick_failed`; `eventsEmitted` climbing quickly |
| **Remediation** | `POST /simulator/stop`; optional `POST /simulator/reset` (stops, clears, reseeds — **destructive** to demo data); restart API (simulator state in-memory, stopped on shutdown) |
| **Escalate when** | Stop fails; DB saturation; need rate limits on simulator endpoints in shared environments |

---

### 4.6 High error count

| | |
| --- |
| **Symptoms** | `/metrics` → `errorCount` rising; many 4xx/5xx in logs; users see error toasts |
| **Likely causes** | Validation failures (400); `Deal not found` (404); DB errors (503 on ready); unhandled exceptions (500) |
| **Checks** | `curl /metrics`; sample `http_error` / `validation_error` / `unhandled_error` logs; break down `requestsByRoute` |
| **Logs/metrics** | `errorCount`, `http_error.statusCode`, `validation_error.issues` |
| **Remediation** | Fix upstream cause (DB, bad client payload); roll back bad deploy; if spike from abuse, throttle at gateway (future) |
| **Escalate when** | Sustained 500s; `unhandled_error` with stack traces indicating code bug; error rate SLO breach |

---

### 4.7 Stale or out-of-order deal events

| | |
| --- |
| **Symptoms** | Blotter shows old status briefly then corrects; duplicate rows; status “jumps backward”; pulsing loading (historically reconnect loop) |
| **Likely causes** | WS messages arrived out of order; stale snapshot (`incoming.version <= cached`); reconnect without refetch; simulator `streamEpoch` bump not aligned on client |
| **Checks** | Browser: WS message `sequenceNumber` and `deal.version`; compare with `GET /deals`; `GET /simulator/status` → `streamEpoch`, `lastSequenceNumber` |
| **Logs/metrics** | Rapid `deals_websocket_client_connected` / `_disconnected` (reconnect storm); client ignores `sequenceNumber <= lastApplied` by design |
| **Remediation** | Refresh page; ensure single WS connection (React StrictMode-safe hook); after simulator reset, clients should refetch or realign epoch; fix API if sequence not monotonic |
| **Escalate when** | Persistent wrong state after full refresh; data in DB correct but UI wrong — front-end cache bug; sequence regression in API |

---

### 4.8 Audit events missing

| | |
| --- |
| **Symptoms** | Deal detail drawer shows empty audit timeline; `GET /deals/:id/events` returns `[]` but deal exists |
| **Likely causes** | Deal created before audit wiring; failed transaction (deal rolled back); simulator reset cleared audit; wrong deal id |
| **Checks** | `curl /deals/{id}/events`; GraphQL `dealEvents(dealId)`; DB: `AuditEvent` rows for `dealId`; mutation used valid `x-user-id` |
| **Logs/metrics** | Successful `POST /deals` / `PATCH` without subsequent audit query errors; `validation_error` on write |
| **Remediation** | Re-run seed if demo environment; create new deal and confirm audit row; fix actor header for mutations |
| **Escalate when** | New writes consistently lack audit — service layer or migration bug; compliance requirement violated |

---

### 4.9 Frontend cannot reach API

| | |
| --- |
| **Symptoms** | Blotter loading forever; CORS errors in browser console; network failed on `GET /deals` |
| **Likely causes** | API down; wrong `VITE_API_URL` (baked at web **build** time in Docker); `CORS_ORIGIN` mismatch; mixed http/https |
| **Checks** | `curl http://localhost:3000/health/live`; browser URL vs `CORS_ORIGIN`; Compose: web built with `http://localhost:3000` not `http://api:3000` |
| **Logs/metrics** | No `http_request` from browser origin; CORS preflight failures in browser only |
| **Remediation** | Start API; align `CORS_ORIGIN` with UI origin (e.g. `http://localhost:5173`); rebuild web after `VITE_*` change |
| **Escalate when** | Internal network/DNS issues in cloud; CDN serving stale bundle with wrong API URL |

---

## 5. Local debugging commands

### Docker Compose

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f postgres
docker compose logs --tail=100 web
```

### Health and metrics

```bash
curl -s http://localhost:3000/health/live
curl -s http://localhost:3000/health/ready
curl -s http://localhost:3000/metrics | jq .
```

### Database migrate and seed

```bash
# Native
npm run db:migrate -w @otcflow/api
npm run db:seed -w @otcflow/api
npx prisma migrate status -w @otcflow/api

# Compose
npm run docker:migrate
npm run docker:seed
```

### API + web dev (no Compose)

```bash
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
npm run test:integration -w @otcflow/api   # needs Postgres
```

### Simulator control

```bash
curl -s http://localhost:3000/simulator/status | jq .
curl -s -X POST http://localhost:3000/simulator/stop
```

### Full CI-shaped check

```bash
npm run ci        # needs Postgres
npm run ci:fast   # no DB
```

---

## 6. WebSocket and proxy deployment

The API handles WebSocket upgrades on the **same HTTP server** as REST (`apps/api/src/index.ts` → `routeWebSocketUpgrades`).

| Path | Client |
| ---- | ------ |
| `/ws/deals` | Web blotter (`VITE_WS_URL` or derived from `VITE_API_URL`) |
| `/graphql` | GraphQL subscriptions (`graphql-ws`) |

### Platform requirements

- Reverse proxy / load balancer must forward **`Upgrade: websocket`** and **`Connection`** headers to the API.
- Route WS to the same API target as HTTP (or an equivalent path rule on that target).
- Set **idle timeout** high enough for quiet blotter tabs (60s+; increase if connections drop silently).
- Use **`wss://`** when the frontend is served over HTTPS.
- **Sticky sessions** are optional for `/ws/deals` (broadcast is stateless) but can reduce churn during rolling deploys.

### Common misconfigurations

| Config | Problem |
| ------ | ------- |
| `VITE_WS_URL=ws://api:3000/...` in Docker | Browser cannot resolve Docker internal DNS — use public host (`localhost` or your domain) |
| `VITE_*` changed without web rebuild | Stale bundle points at old API — `docker compose up --build web` |
| `CORS_ORIGIN` ≠ browser origin | REST fails; WS may connect but mutations fail |
| Proxy idle timeout too low | WS disconnects periodically; client reconnects (backoff in hook) |
| TLS termination strips upgrade | Handshake fails — check proxy WebSocket support |

### Verify after deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://<api-host>/health/live
# Browser devtools → Network → WS → /ws/deals → messages after POST /deals
curl -s http://<api-host>/metrics | jq '.activeDealWebSocketClients'
```

Full smoke checklist: [deployment-checklist.md](deployment-checklist.md).

---

## 7. Rollback

| Component | Action |
| --------- | ------ |
| **API** | Redeploy previous container image / task revision; confirm `/health/ready` → 200 |
| **Web** | Redeploy prior static build; confirm baked `VITE_API_URL` matches live API |
| **Database** | **Do not** blindly revert schema after destructive migrations — restore from backup or forward-fix |

API rollback is safe when the DB schema is unchanged or backward compatible with the older binary. After rollback, run smoke tests in [deployment-checklist.md §8](deployment-checklist.md). WebSocket clients will reconnect automatically; a page refresh is fine.

---

## 8. Prevention and hardening ideas

Not all are implemented today; they map naturally from the modular monolith layout.

| Area | Idea |
| ---- | ---- |
| **Alerts** | Page on `/health/ready` != 200 for N minutes; `errorCount` rate threshold; `simulator.running` in prod (if undesired) |
| **Dashboards** | Chart `requestsByRoute`, `errorCount`, WS client counts, `simulator.eventsEmitted` |
| **Broker-backed event bus** | Replace `InMemoryDealEventBus` with SNS/Kafka/RabbitMQ — survives API restarts, enables horizontal scale |
| **Dead-letter queues** | Failed notification deliveries (WS gateway workers) → DLQ for replay |
| **Retry policies** | Idempotent consumers; exponential backoff on broker subscribers (client WS already backoff-reconnects) |
| **Stronger auth** | Replace demo `x-user-id` with verified JWT/session; RBAC on mutations |
| **Migration checks** | Run `prisma migrate deploy` in init container; fail deploy if migrate fails; backup before migrate in prod |
| **Probes** | Liveness vs readiness split (already in repo); add startup probe if migrate on boot is slow |
| **Prometheus** | Export `/metrics` as Prometheus text or sidecar scrape of JSON |
| **Rate limits** | Simulator and write endpoints behind gateway throttling in shared demos |

---

## Related docs

| Doc | Contents |
| --- | -------- |
| [architecture.md](architecture.md) | Event flow, failure modes, service boundaries |
| [deployment-checklist.md](deployment-checklist.md) | Pre/post-deploy smoke tests and rollback |
| [phase-index.md](phase-index.md) | Delivery phases |
| [README.md](../README.md) | Setup, endpoints, Docker |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | CI and branch workflow |
| [apps/api/DATABASE.md](../apps/api/DATABASE.md) | Prisma and local DB |
| [platform-mapping.md](platform-mapping.md) | Platform validation mapping |
