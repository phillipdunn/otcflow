# OTCFlow platform mapping

How OTCFlow maps to a **generic modern application platform** and how it can serve as a **dry-run / reference application** for onboarding, deployment, observability, and operational readiness exercises.

Related: [architecture.md](architecture.md) (internal boundaries), [runbook.md](runbook.md) (incidents), [infra/terraform/README.md](../infra/terraform/README.md) (cloud skeleton).

---

## 1. Why OTCFlow is a useful platform validation app

OTCFlow is a **small but complete vertical slice** — not a toy hello-world, not a production trading system. It exercises the same platform capabilities a real product team would need, in one repo:

| Capability in repo | What it validates on a platform |
| ------------------ | ------------------------------- |
| **Frontend app** (`apps/web`) | Static hosting, CDN, build pipelines, env-injected API URLs |
| **Backend API** (`apps/api`) | Container deploy, load balancer, process health, graceful shutdown |
| **Database** | Managed Postgres, connectivity, backups, connection strings |
| **WebSockets** (`/ws/deals`) | Upgrade routing, sticky sessions or stateless fan-out, client reconnect |
| **GraphQL** (HTTP + subscriptions) | Secondary API surface, `graphql-ws` on same host |
| **Event bus** | Internal pub/sub pattern; future broker attachment point |
| **Audit trail** | Append-only persistence, attributed writes, read APIs |
| **Simulator** | Background workload, synthetic traffic, operator controls |
| **CI/CD** (GitHub Actions) | Lint, typecheck, tests, migrate, build gates before deploy |
| **Docker** (Compose) | Multi-service local stack, image build, migrate-on-start |
| **Terraform skeleton** | IaC review, network/secret/logging layout (educational) |
| **Observability** | Liveness/readiness, JSON metrics snapshot, structured logs, request IDs |

Teams can use OTCFlow to **prove the platform path** before onboarding a larger application: if OTCFlow deploys, connects, migrates, streams events, and surfaces logs — the platform basics work.

---

## 2. Local component → platform capability mapping

| OTCFlow component | Platform capability being validated | Notes |
| ----------------- | ----------------------------------- | ----- |
| **React web app** | Frontend registration, static asset pipeline, cache headers | Vite build → nginx (Compose) or CDN (Terraform skeleton) |
| **API service** | Backend service deploy, port exposure, horizontal scale readiness | Single Express process today; Dockerfile in `apps/api` |
| **REST endpoints** | HTTP routing, JSON APIs, CORS, error contracts | Primary blotter transport; Supertest integration tests |
| **GraphQL endpoint** | Alternate API gateway pattern on same service | `POST /graphql`; shares deal/audit services with REST |
| **GraphQL subscriptions** | Long-lived subscription connections (`graphql-ws`) | `ws://host/graphql`; integration-tested `dealUpdated` |
| **WebSocket deal stream** | Raw WebSocket upgrade on shared HTTP listener | `ws://host/ws/deals`; sequence numbers + `DealEvent` schema |
| **Postgres database** | Managed relational store, connectivity from app tier | RDS-shaped in Terraform; Compose `postgres:16-alpine` locally |
| **Prisma migrations** | Schema migration job / init container pattern | `migrate deploy` on API container start; CI runs migrate before tests |
| **Event bus** | Event-driven notification path (in-process today) | `InMemoryDealEventBus`; swap for broker without changing services |
| **Audit service** | Compliance-oriented append-only writes | Same DB today; extractable logical boundary |
| **Simulator** | Synthetic load generator, operator API | `POST /simulator/start|stop|reset`; in-memory control state |
| **Docker Compose** | Local multi-service orchestration | web + api + postgres; host vs internal DNS patterns |
| **GitHub Actions** | CI gates, Postgres service container, artifact build | `ci.yml` on every PR; optional manual `e2e.yml` |
| **Terraform skeleton** | Infrastructure plan/apply dry-run | Not applied from repo; maps Compose → AWS building blocks |
| **Health endpoints** | Liveness vs readiness probes | `/health/live` (no DB), `/health/ready` (DB `SELECT 1`) |
| **Metrics endpoint** | Ops telemetry export (JSON today) | `/metrics` — requests, errors, WS client counts, simulator |
| **Structured logs** | Centralised log ingestion (stdout JSON) | One line per event; `message` + context fields |
| **Request IDs** | Distributed tracing correlation (minimal) | `X-Request-Id` header; echoed in logs and error JSON |

---

## 3. Example dry-run questions

Use these when onboarding a new platform environment or testing a platform change:

**Frontend & API**

- Can a new frontend app be registered and served (static host or CDN)?
- Can an API service be deployed and reached from the browser network?
- Can CORS and build-time `VITE_*` URLs be configured correctly?

**Data**

- Can the service connect to managed database infrastructure?
- Can migrations run safely on deploy (and fail the deploy if migrate fails)?
- Can seed or smoke data be loaded for demo validation?

**Realtime**

- Can WebSocket upgrade traffic be routed correctly through the load balancer?
- Can GraphQL subscription connections stay open and receive post-mutation events?
- Do reconnect and refetch behaviours work after a brief API restart?

**Observe & operate**

- Can logs be collected and searched (by `requestId`, `message`)?
- Can metrics or health endpoints be scraped or polled?
- Can request IDs be traced from browser → API logs?
- Can operational runbooks diagnose common failures ([runbook.md](runbook.md))?

**Supply chain & config**

- Can secrets and config be injected safely (not committed to git)?
- Can CI gates (lint, test, build) run before deployment?
- Can rollback be tested (previous image/task definition, DB backward compatibility)?

---

## 4. Generic deployment flow

Reference flow for deploying OTCFlow (or any similar monorepo) to a generic platform:

```text
1. Code pushed
      → feature branch / main via pull request

2. CI runs
      → lint, typecheck, unit tests, migrate (against CI Postgres), integration tests, build
      → fail fast blocks merge

3. Image built (API)
      → docker build apps/api/Dockerfile → push to registry (ECR in Terraform skeleton)

4. Frontend built
      → vite build with VITE_API_URL / VITE_WS_URL for target environment
      → upload static assets to object storage + CDN

5. Infrastructure planned / applied (optional)
      → terraform plan / apply for VPC, ALB, RDS, secrets placeholders
      → educational only in this repo today

6. Database migrations run
      → init job or API entrypoint: prisma migrate deploy
      → verify migrate status before traffic

7. API deployed
      → new task/container behind load balancer
      → readiness probe: GET /health/ready

8. Frontend deployed
      → CDN invalidation or versioned asset path
      → smoke: open UI origin

9. Health / readiness checked
      → /health/live (liveness), /health/ready (traffic gate)
      → /metrics baseline snapshot

10. Smoke tests run
      → GET /deals, POST /deals, WS message received, optional GraphQL mutation + subscription
      → Playwright e2e optional (manual workflow in repo)

11. Logs / metrics checked
      → app_listening, database_connected, no errorCount spike
      → confirm requestId in sample request
```

---

## 5. Platform readiness checklist

### Build

- [ ] `npm ci` / workspace install succeeds
- [ ] `npm run build` produces web bundle and shared package
- [ ] API Docker image builds without error

### Test

- [ ] `npm run ci` or equivalent pipeline green on target branch
- [ ] Integration tests pass against platform Postgres (or equivalent)
- [ ] WebSocket and GraphQL subscription integration tests pass

### Package

- [ ] API image tagged and pushed to registry
- [ ] Web static assets versioned and uploaded
- [ ] No secrets in image layers or committed tfvars

### Configure

- [ ] `DATABASE_URL` / secrets manager values set
- [ ] `CORS_ORIGIN` matches UI origin
- [ ] `VITE_API_URL` and `VITE_WS_URL` baked for browser-accessible hostnames
- [ ] Port and probe paths documented for load balancer

### Deploy

- [ ] Migrations applied before or during roll-out
- [ ] API tasks pass `/health/ready` before receiving traffic
- [ ] Frontend served from expected URL

### Observe

- [ ] Logs visible in platform log sink (JSON lines parseable)
- [ ] `/metrics` or exporter reachable by ops
- [ ] Request ID present on sample API call

### Operate

- [ ] [runbook.md](runbook.md) scenarios understood by on-call
- [ ] Simulator stop procedure known for shared demos
- [ ] Graceful shutdown verified (SIGTERM drains WS)

### Secure

- [ ] Demo `x-user-id` not treated as production auth
- [ ] DB credentials rotated via secrets manager (when cloud)
- [ ] Network: DB in private subnets; API egress controlled

### Roll back

- [ ] Previous API image/task definition identified
- [ ] Rollback does not require destructive DB migration revert
- [ ] Frontend prior asset version or CDN rollback path documented

---

## 6. Boundaries and caveats

Read these before treating OTCFlow as production-ready infrastructure proof:

| Statement | Detail |
| --------- | ------ |
| **Not a production trading system** | Thin blotter slice; no market data feeds, risk, settlements, or regulatory controls |
| **Not real authentication** | Demo `x-user-id` header only — no JWT, SSO, RBAC, or session hardening |
| **In-process event bus** | `InMemoryDealEventBus` — notifications do not survive API restart or scale-out until replaced with a broker |
| **Synthetic simulator** | Generates fake deals; can load DB and WS; not representative of production traffic shape |
| **Terraform is a skeleton** | Illustrative AWS layout; **not deployed** from this repo; requires review before any `apply` |
| **Security, entitlements, resilience** | Would need WAF, rate limits, mTLS, HA Postgres, multi-AZ, backup/restore drills, and formal SLOs for production |
| **Metrics format** | JSON snapshot, not Prometheus/OpenTelemetry — dashboard integration is manual |
| **Single API process** | Modular monolith — not yet split into independently scaled services |

OTCFlow validates **platform mechanics**, not **business or regulatory readiness**.

---

## 7. Recommended next validation exercises

Hands-on drills after a first successful deploy:

| Exercise | Validates |
| -------- | --------- |
| **Deploy API only** | Container, ALB target group, readiness probe, DB connectivity |
| **Deploy web only** | Static hosting, env-specific API URLs, CORS from live origin |
| **Connect API to managed Postgres** | Security groups, secrets, connection pooling, migrate deploy |
| **Route WebSocket traffic** | ALB/proxy upgrade headers, idle timeout, client reconnect |
| **Test GraphQL subscriptions** | `graphql-ws` through same host; `dealUpdated` after mutation |
| **Run migration failure drill** | Deploy blocked when migrate fails; no partial schema |
| **Run database outage drill** | `/health/ready` → 503; runbook remediation; recovery |
| **Test observability dashboard** | Ingest stdout logs; chart `errorCount` and request rate |
| **Test rollback** | Revert API image; confirm web still works; DB schema backward compatible |

Document outcomes in your platform team's run log — pass/fail per checklist row in §5.

---

## Related docs

| Doc | Role |
| --- | ---- |
| [platform-context.md](platform-context.md) | Product / desk vocabulary |
| [architecture.md](architecture.md) | Service boundaries and event flow |
| [runbook.md](runbook.md) | Incident response |
| [phase-index.md](phase-index.md) | Build phases 1–21 |
| [README.md](../README.md) | Local commands and layout |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | CI and PR workflow |
