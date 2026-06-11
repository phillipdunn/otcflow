# OTCFlow deployment checklist

Pre-deploy verification, post-deploy smoke tests, and rollback guidance for a **generic modern platform** (containers, managed Postgres, static frontend, load balancer).

**Not sure if you are “done”?** Jump to [§10 Deployment readiness summary](#10-deployment-readiness-summary), [§11 What is not deployment-ready](#11-what-is-not-deployment-ready), and [§12 What still needs addressing](#12-what-still-needs-addressing).

Related: [runbook.md](runbook.md) (incidents), [platform-mapping.md](platform-mapping.md) (platform dry-run), [architecture.md](architecture.md), [infra/terraform/README.md](../infra/terraform/README.md).

---

## 1. Environment configuration

### API (`apps/api`)

| Variable | Required | Default | Notes |
| -------- | -------- | ------- | ----- |
| `DATABASE_URL` | Yes | — | Postgres connection string. Compose sets this internally. |
| `PORT` | No | `3000` | HTTP + WebSocket listener port. |
| `CORS_ORIGIN` | No | `http://localhost:5173` | **Must match** the browser origin of the web app. |
| `NODE_ENV` | No | — | `production` in deployed API; affects Prisma log level. |

Template: [apps/api/.env.example](../apps/api/.env.example). Native dev: copy to `apps/api/.env`.

### Web (`apps/web`)

| Variable | Required | Default | Notes |
| -------- | -------- | ------- | ----- |
| `VITE_API_URL` | No | `http://localhost:3000` | Public REST base URL **as seen by the browser**. |
| `VITE_WS_URL` | No | derived from API URL | `ws://` or `wss://` + `/ws/deals`. Set explicitly behind split hosts. |

Template: [apps/web/.env.example](../apps/web/.env.example). Docker/CI: passed as **build args** — rebuild web after changing.

### Docker Compose (repo root)

Copy [docker.env.example](../docker.env.example) → `.env` at repo root. Covers `VITE_*`, `CORS_ORIGIN`, ports, and Postgres credentials.

**Rules:**

- No secrets in git. Use `.env` locally and a secrets manager in cloud.
- `VITE_*` and `CORS_ORIGIN` must align: same host scheme the user opens in the browser.
- Inside Compose, API → Postgres uses hostname `postgres:5432`; the browser never uses that hostname.

---

## 2. Build and test gates

Run from a fresh clone before tagging a release:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

With Postgres available (integration + full CI):

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/otcflow?schema=public"
export TEST_DATABASE_URL="$DATABASE_URL"
npm run db:generate
npm run db:migrate:deploy
npm run test:integration
npm run ci          # full pipeline: lint → typecheck → unit → migrate → integration → build
```

| Script | Purpose |
| ------ | ------- |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`shared`, `api`, `web`) |
| `npm run test` | Unit + integration (Postgres required for integration) |
| `npm run build` | `shared` + production web bundle |
| `npm run ci` | Full local CI (needs Postgres) |
| `npm run ci:fast` | Lint, typecheck, unit, build — no DB |

---

## 3. Database deployment

### Migrations

| Environment | Command | When |
| ----------- | ------- | ---- |
| **Local development** | `npm run db:migrate` (`prisma migrate dev`) | Creating/applying migrations during development |
| **CI / Docker / production** | `npm run db:migrate:deploy` (`prisma migrate deploy`) | Apply committed migrations only — no interactive prompts |

Docker API container runs `prisma migrate deploy` on start ([docker-entrypoint.sh](../apps/api/docker-entrypoint.sh)). Manual: `npm run docker:migrate`.

### Migration order

Migrations live in `apps/api/prisma/migrations/` and apply in timestamp order:

1. `20250515120000_init_postgres` — `User`, `Deal`, `AuditEvent` tables

Check status: `npx prisma migrate status` in `apps/api`.

### Seed data (demo / non-production only)

```bash
npm run db:seed          # native
npm run docker:seed      # Compose
```

- Inserts demo users and **100 synthetic deals** if the database is empty.
- **Idempotent:** skips deal insert if any deals exist.
- **Do not run in production** unless you explicitly want demo data in a throwaway environment.
- Seed is **not** run automatically on API container start.

Details: [apps/api/DATABASE.md](../apps/api/DATABASE.md).

---

## 4. Docker deployment

### Fresh clone — Compose stack

```bash
git clone <repo-url> otcflow && cd otcflow
cp docker.env.example .env    # optional — defaults work for localhost
npm run docker:up             # build + start postgres, api, web (foreground)
# In another terminal (first time only):
npm run docker:seed
```

Open `http://localhost:5173`. API: `http://localhost:3000`.

### Health checks

```bash
curl -s http://localhost:3000/health/live    # 200 — process up
curl -s http://localhost:3000/health/ready   # 200 — Postgres reachable
curl -s http://localhost:3000/metrics        # JSON ops snapshot
```

### Rebuild after URL changes

`VITE_API_URL` and `VITE_WS_URL` are baked at **web image build** time:

```bash
docker compose up --build web
```

Align `CORS_ORIGIN` in root `.env` with the URL you open in the browser, then restart API if changed.

---

## 5. WebSocket deployment

The API serves WebSocket upgrades on the **same HTTP listener** as REST:

| Path | Purpose |
| ---- | ------- |
| `/ws/deals` | Blotter deal events (used by the web app) |
| `/graphql` | GraphQL subscriptions (`graphql-ws`) |

### Platform / proxy requirements

- Load balancer or reverse proxy must support **HTTP `Upgrade: websocket`** and pass through `Connection` headers.
- Route WebSocket traffic to the **same API target** as HTTP (or a dedicated WS path on that target).
- Set **idle timeout** above expected quiet periods (e.g. 60s+; ALB default 60s). Longer for always-on blotter tabs.
- **Sticky sessions** are not required for `/ws/deals` (stateless broadcast) but may help during rolling deploys.
- Terminate TLS at the edge; browser should use `wss://` when the page is `https://`.

### Frontend URL alignment

| Mistake | Symptom |
| ------- | ------- |
| `VITE_WS_URL` uses Docker internal hostname (`api:3000`) | WS fails in browser — use public host |
| `VITE_WS_URL` uses `http://` instead of `ws://` | Connection fails |
| API on HTTPS but `VITE_WS_URL` is `ws://` | Mixed content blocked — use `wss://` |
| Proxy strips `Upgrade` header | WS handshake fails (502/400) |

Troubleshooting: [runbook.md §4.3](runbook.md) and [runbook.md §7](runbook.md).

---

## 6. CORS and frontend origins

1. Set `CORS_ORIGIN` on the API to the **exact** frontend origin (scheme + host + port), e.g. `https://otcflow.example.com`.
2. Set `VITE_API_URL` / `VITE_WS_URL` to the **public** API origin the browser will call.
3. Rebuild/redeploy the web app after changing `VITE_*`.
4. Restart/redeploy the API after changing `CORS_ORIGIN`.

No wildcard CORS is configured — each deployed environment needs an explicit origin.

---

## 7. Health and readiness

| Endpoint | Probe type | DB check | Use |
| -------- | ---------- | -------- | --- |
| `GET /health/live` | Liveness | No | Restart if process dead |
| `GET /health/ready` | Readiness | Yes (`SELECT 1`) | Route traffic only when DB up |
| `GET /health` | Legacy readiness | Yes | Same as ready + shared schema body |

Do **not** use `/health/live` to gate traffic that requires the database.

---

## 8. Post-deploy smoke test

Run after every deploy to a new environment.

| # | Check | How | Pass |
| - | ----- | --- | ---- |
| 1 | App loads | Open web URL in browser | Blotter shell renders |
| 2 | Deals load | Grid populates (seed or existing data) | Rows visible, no CORS errors |
| 3 | Create deal | **New deal** form → submit | Row appears; `POST /deals` 201 |
| 4 | Update status | Select deal → change status | Status chip updates |
| 5 | Audit appears | Open deal detail → Audit History | Timeline shows create/status events |
| 6 | WebSocket update | Create/update in another tab or via `curl` | First tab updates without full refresh |
| 7 | GraphQL query | `curl -s -X POST http://<api>/graphql -H 'Content-Type: application/json' -d '{"query":"{ deals { id } }"}'` | JSON `data.deals` array |
| 8 | Metrics | `curl -s http://<api>/metrics` | JSON with `uptimeSeconds`, `totalRequests` |
| 9 | Readiness | `curl -s -o /dev/null -w "%{http_code}" http://<api>/health/ready` | `200` |

Optional GraphQL subscription smoke: see `apps/api/src/graphql/graphqlSubscriptions.integration.test.ts`.

---

## 9. Rollback guidance

### API container

1. Identify the **previous image tag** or task definition revision.
2. Deploy that revision to the API service.
3. Confirm `/health/live` and `/health/ready` return 200.
4. Run smoke tests (§8).

Rolling back the API is safe when the **database schema is unchanged** or backward compatible with the older code.

### Frontend

1. Redeploy the **previous static build** (prior CDN invalidation / object version / Compose image).
2. Confirm `VITE_API_URL` in that build still points at the live API.
3. Hard-refresh browser or clear CDN cache if needed.

### Database migrations

| Situation | Guidance |
| --------- | -------- |
| Deploy failed **before** migrate ran | Fix forward; no rollback needed |
| New migration applied, API rolled back | **Dangerous** if old code expects old schema — test in staging first |
| Destructive migration (drop column/table) | **Never** blindly roll back API without a DB restore plan |
| Failed migration mid-deploy | Do not re-run `migrate dev` on production — inspect `prisma migrate status`, fix SQL, restore from backup if needed |

**Rule:** prefer **forward-fix** migrations over reversing schema in production. Take a DB backup before any production migration.

### WebSocket clients during rollback

Clients may disconnect during API rollout. The web app reconnects with backoff; a full page refresh is acceptable after rollback.

---

## 10. Deployment readiness summary

OTCFlow is **deployable as a demo / platform validation stack** — not as a production trading system. Use this table before calling an environment “ready”.

| Area | Ready for demo deploy? | Ready for production? |
| ---- | ---------------------- | --------------------- |
| Static web + API container + Postgres | Yes (Compose or equivalent) | Needs hardening (see §11–12) |
| `prisma migrate deploy` on API start | Yes | Yes — with backup + staging drill |
| Health probes (`/health/live`, `/health/ready`) | Yes | Yes — wire readiness to traffic gating |
| CORS + configurable `VITE_*` URLs | Yes | Yes — per-environment rebuild |
| WebSocket `/ws/deals` through same API host | Yes (if proxy supports upgrade) | Needs ALB/proxy tuning + `wss://` |
| Structured logs + request IDs | Yes | Needs log aggregation (CloudWatch, etc.) |
| CI on PR (`lint`, `typecheck`, unit, migrate, integration, build) | Yes | Add e2e + format gates if desired |
| Real authentication / RBAC | No | **Blocker** |
| Multi-instance API scale-out | No | **Blocker** (in-memory event bus) |
| Regulatory / market-data / risk controls | No | Out of scope for this repo |

**Bottom line:** you can prove **platform mechanics** (build, migrate, serve, stream, observe, roll back images). You cannot yet claim **production trading** or **untrusted multi-tenant** readiness.

---

## 11. What is not deployment-ready

Grouped by concern. These are **current limitations**, not a backlog order.

### Security and identity

| Limitation | Impact |
| ---------- | ------ |
| Demo **`x-user-id`** header only | Any client can impersonate any user — no login, JWT, SSO, or RBAC |
| No session hardening | No token expiry, refresh, or revocation |
| No WAF / rate limiting / abuse controls | Simulator and write endpoints can be driven hard in shared demos |
| Secrets in env vars only | No documented rotation workflow beyond “use a secrets manager” |
| DB credentials in Compose defaults | Fine for local Docker; must change for shared/staging/prod |

### Runtime and packaging

| Limitation | Impact |
| ---------- | ------ |
| API runs via **`tsx`** (TypeScript direct) | No compiled `dist/` bundle; larger image, no separate compile gate |
| Single Node process | One crash takes down REST + both WebSocket paths |
| In-memory **`DealEventBus`** | Events do not survive restart; **cannot scale API horizontally** without missed WS/GraphQL notifications |
| Simulator state in memory | `running` / `streamEpoch` lost on restart; not suitable as production workload |
| Web **`VITE_*` baked at build** | Each environment needs its own web image or build step |

### Infrastructure and resilience

| Limitation | Impact |
| ---------- | ------ |
| **Terraform not applied** from repo | No automated cloud deploy; skeleton only — see [infra/terraform/README.md](../infra/terraform/README.md) |
| No remote Terraform state / CI for IaC | Team `apply` is manual and risky |
| Single Postgres instance (Compose) | No HA, failover, or backup/restore runbook in repo |
| RDS skeleton: single-AZ, no autoscaling | Illustrative only |
| ALB WebSocket tuning not codified | Idle timeout, sticky sessions, `wss://` termination left to operator |
| No CDN cache invalidation pipeline | Frontend rollback/deploy is manual |

### Observability and operations

| Limitation | Impact |
| ---------- | ------ |
| **`/metrics` is JSON**, not Prometheus | No drop-in Grafana/Datadog scrape without an adapter |
| No OpenTelemetry / distributed tracing | Cross-service debugging not applicable yet (monolith) but no trace IDs beyond request ID |
| No alerting rules | Runbook describes ideas; nothing pages on-call |
| E2E tests **not in default CI** | Playwright workflow is manual (`e2e.yml`) |
| `format:check` not in CI | Style drift possible |

### Data and compliance

| Limitation | Impact |
| ---------- | ------ |
| Demo seed data uses synthetic counterparties | Acceptable for demos; not a real book of record |
| No backup/restore procedure | Beyond “take a backup before migrate” guidance |
| No data retention / PII policy | Audit log grows unbounded in schema design |
| Not a regulated trading system | No confirmations, settlements, entitlements, or market-data feeds |

### Product scope (intentionally thin)

| Limitation | Impact |
| ---------- | ------ |
| Blotter slice only | No RFQ, axes, negotiation, risk, or downstream integrations |
| GraphQL exists but blotter uses REST | Secondary surface; subscriptions tested in integration tests only |
| No feature flags / gradual rollout | Deploy is all-or-nothing per image |

See also [platform-mapping.md §6](platform-mapping.md) and [platform-context.md](platform-context.md).

---

## 12. What still needs addressing

Prioritized work to move from **demo deploy** toward **production-shaped** deploy. None of these are implemented in this repo today.

### P0 — Before any internet-facing or multi-user environment

| Item | Why | Suggested direction |
| ---- | --- | ------------------- |
| **Replace demo auth** | `x-user-id` is trivially spoofable | JWT/session at gateway; map to `req.currentUser` |
| **Lock down CORS + secrets** | Misconfiguration exposes API | Per-env secrets manager; deny default Postgres passwords |
| **Staging migrate drill** | Failed migrate blocks deploy | CI job or init container that fails deploy on migrate error |
| **DB backup before migrate** | Rollback without backup is unsafe | Automated snapshot + documented restore |

### P1 — Before horizontal scale or SLA

| Item | Why | Suggested direction |
| ---- | --- | ------------------- |
| **Broker-backed event bus** | In-memory bus breaks multi-instance WS | Redis pub/sub, SNS, or Kafka; subscribers on each API replica |
| **Compiled API production entry** | `tsx` in container is dev-shaped | `tsc` build + `node dist/index.js` or bundler |
| **Connection pooling** | RDS + multiple tasks need PgBouncer/RDS Proxy | Document `DATABASE_URL` with pooler |
| **ALB/proxy WebSocket config** | Silent WS drops under load | Document idle timeout ≥ 60s; test `wss://` end-to-end |
| **Prometheus or OTel metrics** | JSON `/metrics` does not integrate with standard stacks | Exporter sidecar or `/metrics` text format |

### P2 — Platform automation and ops maturity

| Item | Why | Suggested direction |
| ---- | --- | ------------------- |
| **Apply Terraform (or equivalent) with remote state** | Manual infra drifts | S3 backend + DynamoDB lock; separate env workspaces |
| **CI: build/push API image + sync web to S3** | No deploy pipeline in repo | GitHub Actions → ECR + `aws s3 sync` |
| **E2E in CI** (or nightly) | Regressions in full stack | Run Playwright after `docker compose up` in Actions |
| **Log aggregation + dashboards** | stdout JSON alone is hard to operate | CloudWatch subscription or log shipper; chart `errorCount` |
| **Alerting** | Incidents discovered by users | Alert on `/health/ready` != 200, error rate, WS client drop |

### P3 — Product and compliance (out of current repo scope)

| Item | Why | Suggested direction |
| ---- | --- | ------------------- |
| Rate limits on simulator/writes | Demo abuse / load | Gateway throttling |
| HA Postgres (multi-AZ) | DB SPOF | RDS multi-AZ + restore drill |
| WAF / mTLS | Edge security | CloudFront + WAF or API gateway |
| Formal SLOs and on-call runbooks | Production operations | Define SLOs; tie to metrics |
| Full desk workflows | Business readiness | Separate product phases |

### Quick reference — repo vs cloud

| Compose today | Still to do for cloud |
| ------------- | --------------------- |
| `docker compose up` | `terraform apply` (or your IaC) + populate secrets |
| `npm run docker:seed` | Decide: no seed in prod, or isolated demo env only |
| Browser → `localhost:3000` WS | ALB + `wss://` + correct `VITE_WS_URL` in web build |
| `CORS_ORIGIN=http://localhost:5173` | Set to `https://<your-cdn-domain>` |
| API liveness on `/health/live` | Consider readiness-based traffic only (not live) for ECS |

Track progress against [platform-mapping.md §5](platform-mapping.md) (readiness checklist) and [platform-mapping.md §7](platform-mapping.md) (validation exercises).

---

## Related docs

| Doc | Role |
| --- | ---- |
| [README.md](../README.md) | Setup, Docker, scripts |
| [runbook.md](runbook.md) | Incident response |
| [architecture.md](architecture.md) | Service boundaries |
| [platform-mapping.md](platform-mapping.md) | Platform validation mapping |
| [apps/api/DATABASE.md](../apps/api/DATABASE.md) | Prisma and Postgres |
| [infra/terraform/README.md](../infra/terraform/README.md) | Cloud skeleton |
