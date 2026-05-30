# OTCFlow

Event-driven OTC trading workflow platform — **npm workspaces** monorepo (one lockfile, shared TypeScript packages).

This README describes **what is in the repo today**. For **what each part means on a real OTC desk**, how it maps to workflows, and **where the stack is headed** (not all built yet), see [docs/platform-context.md](docs/platform-context.md).

## What exists right now

| Area                  | Implemented                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Monorepo**          | `apps/web`, `apps/api`, `packages/shared`; root scripts in `package.json`.                                                                                                                                                                                                                                                                                                                                                                             |
| **`apps/web`**        | React 18 + Vite 6 + TypeScript. **Phase 5 blotter**: **MUI** + **AG Grid**; **Phase 6**: **Acting as** user in app bar, **`x-user-id`** on mutations. **Phase 7**: **Audit History** in deal **`Drawer`** (**`DealAuditHistory`**, TanStack Query **`['deals', id, 'auditEvents']`**). **Phase 4** retained: TanStack Query + REST, **`useDealEventsWebSocket`** on **`/ws/deals`** with version-guarded cache merge and reconnect backoff. |
| **`apps/api`**        | Express on **3000** + **`/ws/deals`**. **PostgreSQL** via **Prisma** (deals + audit persist). REST unchanged; simulator + WS as Phase 8. Native dev or **Docker Compose** (Phase 10). See [apps/api/DATABASE.md](apps/api/DATABASE.md). |
| **`packages/shared`** | **`Deal`**, **`DealEvent`**, **`AuditEvent`** (+ Zod), **`User`** / **`MOCK_USERS`**, **`HealthResponseSchema`**. Builds to `dist/` on `npm install` (`prepare`). |
| **Tooling**           | ESLint (flat config, root), Prettier (root), TypeScript per package. **Docker Compose** (Phase 10): `web` + `api` + `postgres`.                                                                                                                                                                                                                                                                                                                                                                                   |

## Repository layout

| Path              | Role                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web`        | Browser UI (Vite `:5173`). Blotter under `src/blotter/`; HTTP helpers under `src/api/`. TanStack Query for server cache.       |
| `apps/api`        | HTTP + WebSocket on **`:3000`** (`src/ws/dealsWs.ts`). Routes / controllers / services / `data` / `validation` / `middleware`. |
| `packages/shared` | Shared Zod schemas and inferred types consumed by web and API (`Deal`, health, …).                                             |
| `docker-compose.yml` | Phase 10: **web** + **api** + **postgres** for a production-like local stack. See [Docker](#docker-production-like-local-stack). |

### Web blotter (`apps/web/src/blotter/`)

| File / area                  | Role                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `BlotterScreen.tsx`          | Query + mutations + **`useDealEventsWebSocket`**; MUI shell; composes toolbar, **`grid/`** (**`DealBlotterGrid`**), **`Drawer`** detail, **`Dialog`** create. |
| `useDealEventsWebSocket.ts`  | WebSocket client: merge events into React Query cache, version guard, exponential backoff reconnect.                       |
| `blotterToolbarContext.ts`   | Toolbar context value + `useBlotterToolbar` hook.                                                                          |
| `BlotterToolbarProvider.tsx` | Context `Provider` (keeps Fast Refresh happy).                                                                             |
| `useBlotterView.ts`          | Filters, sort, selection, derived `visibleDeals` / `selectedDeal` from the deal list.                                      |
| `queryKeys.ts`               | Shared React Query cache keys (`['deals']`).                                                                               |
| `mockDeals.ts`               | `MOCK_DEALS` — validated sample list; not wired as the default data source.                                                |
| `CreateDealForm.tsx`         | `POST /deals` via `useMutation`; MUI form controls; invalidates deals query on success.                                    |
| `BlotterToolbar.tsx`         | MUI text search (counterparty / trader / broker) + product/status filters + sort (reads context).                      |
| `grid/index.ts`              | Re-exports **`DealBlotterGrid`** (import the grid as **`./grid`**).                                                        |
| `grid/DealBlotterGrid.tsx`   | Table shell: AG CSS, theme **`sx`**, **`AgGridReact`** wiring (row click, selection class).                                  |
| `grid/dealBlotterColumnModel.ts` | Column defs + **`defaultColDef`** (cell alignment rules) in one place.                                                   |
| `grid/renderers/DealStatusCellRenderer.tsx` | React cell renderer for the status column (MUI **`Chip`**).                                                    |
| `grid/registerAgGridModules.ts` | One-time **`ModuleRegistry.registerModules([AllCommunityModule])`**.                                                    |
| `DealDetailPanel.tsx`        | MUI **`Drawer`**; status buttons; **Audit History** section.                                                                 |
| `DealAuditHistory.tsx`       | Timeline feed for **`GET /deals/:id/events`**.                                                                               |
| `formatAuditEventType.ts`    | Human labels for audit event types.                                                                                          |
| `formatDealDisplay.ts`       | Notional, dates, price formatters; **`dealStatusMuiColor`** for **`Chip`** colours.                                        |
| `sortChevron.ts`             | Sort direction indicator for toolbar labels.                                                                               |

### Web API client (`apps/web/src/api/`)

| File             | Role                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `dealsClient.ts` | `fetchDeals`, `fetchDealAuditEvents`, `postDeal`, `patchDealStatus`; Zod-parse responses; re-exports deal helpers from `requestJson.ts`. |
| `requestJson.ts` | `requestJson`, `getApiBaseUrl`, `getDealsWebSocketUrl`, `ApiRequestError` — shared `fetch` + WS URL for any API path. |

## Why it is structured this way

1. **npm workspaces** — Local packages link with `"workspace": "*"` style deps (`"@otcflow/shared": "*"`) without publishing.

2. **Vite** — Dev server and production bundle for the React app.

3. **`tsx watch` on the API** — Run and reload TypeScript without a separate compile step in dev.

4. **`packages/shared` → `dist/`** — Compiled output + declarations; `prepare` runs `build` after install so dependents resolve real files.

5. **Zod in shared** — Health and deal payloads share one pattern: runtime validation plus `z.infer` types for TypeScript.

6. **Root ESLint + Prettier** — One config tree; React-specific lint only under `apps/web`.

7. **CORS** — Allows the configured web origin (`CORS_ORIGIN`, default Vite `http://localhost:5173`) to call the API.

8. **Toolbar context** — Avoids a long prop list from screen → toolbar; value is `useMemo`’d so consumers do not re-render unnecessarily.

9. **TanStack Query (web)** — Server-fetched deals and mutations live in the query cache (`['deals']`); UI filters/sort/selection stay in React state and `useBlotterView`.

10. **WebSocket deal events** — API broadcasts **`DealEvent`** after writes; web **`setQueryData`** merges by **`deal.version`** to ignore stale/out-of-order messages; reconnect with backoff if the socket drops.

11. **Audit trail (Phase 7)** — Append-only **`AuditEvent`** log per deal; attributed to **`req.currentUser`** on create/status; **`GET /deals/:id/events`**; drawer timeline; cache invalidated on mutations and WebSocket updates.

12. **Docker Compose (Phase 10)** — `docker compose up` runs nginx-served web, API, and Postgres with migrations on API start. See [Docker](#docker-production-like-local-stack).

**Not in this repo:** AWS, GraphQL, real auth/RBAC (by design until you add them).

## Prerequisites

**Native dev (npm):**

- Node.js 20.x+ (LTS recommended)
- npm 10.x+
- PostgreSQL 14+ (local — see [apps/api/DATABASE.md](apps/api/DATABASE.md))

**Docker (optional):**

- Docker Engine 24+ with Compose V2 (`docker compose`)

## Setup

```bash
npm install
```

Workspaces install; `@otcflow/shared` runs `prepare` and creates `packages/shared/dist/`.

**Database (API):**

```bash
cp apps/api/.env.example apps/api/.env
# create DB: createdb otcflow
npm run db:generate
npm run db:migrate
npm run db:seed
```

Details: [apps/api/DATABASE.md](apps/api/DATABASE.md).

```bash
npm run lint
```

ESLint should exit cleanly (warnings depend on rule versions).

```bash
npm run format:check
```

Prettier should report all files OK.

## Local development

**Web (Phase 4 — blotter + REST + WebSocket)**

```bash
npm run dev:web
```

Run **`npm run dev:api`** in another terminal so `GET /deals` and **`ws://localhost:3000/ws/deals`** succeed. Open the URL Vite prints (usually `http://localhost:5173`). The blotter loads **live deals**, keeps filters/sort/selection/detail, **New deal**, and **status** updates; other tabs or clients updating deals appear in near real time via the socket.

Optional: set **`VITE_API_URL`** and optionally **`VITE_WS_URL`** in **`apps/web/.env`** if the API is not at `http://localhost:3000`. If `VITE_WS_URL` is omitted, the WebSocket URL is derived from the API base (**`ws:`** / **`wss:`** + path **`/ws/deals`**).

**API (Phase 4 — REST + deal events WebSocket)**

```bash
npm run dev:api
```

Expect: `PostgreSQL connected (Prisma)`, `OTCFlow API listening on http://localhost:3000`, and **`Deal events WebSocket: ws://localhost:3000/ws/deals`** (override with `PORT` if needed).

| Method & path / socket    | Purpose                                                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`                   | Short JSON describing the service and main routes.                                                                                                                                                  |
| `GET /health`             | Liveness; body validated with `HealthResponseSchema` from shared.                                                                                                                                   |
| `GET /deals`              | All deals (seed rows plus any created in this process).                                                                                                                                             |
| `GET /deals/:id`          | One deal; **404** if missing.                                                                                                                                                                       |
| `GET /deals/:id/events`   | Audit history for a deal (**`AuditEvent[]`**, newest first); **404** if deal missing.                                                                                                              |
| `POST /deals`             | Create a deal; server sets `id` (UUID), `createdAt`, `updatedAt`, `version` (starts at **1**). Optional body field `status`; defaults apply if omitted. Appends **`DEAL_CREATED`** audit row; broadcasts **`DEAL_CREATED`** on WebSocket. Send **`x-user-id`** (Phase 6) for attribution. |
| `PATCH /deals/:id/status` | Set `status`; bumps `version` and updates `updatedAt`. **404** if missing. Appends **`DEAL_STATUS_CHANGED`** audit row; broadcasts **`DEAL_STATUS_CHANGED`** on WebSocket. **`x-user-id`** for actor. |
| **`WS /ws/deals`**        | Browser WebSocket; JSON messages match **`DealEvent`** in **`@otcflow/shared`** (`DEAL_CREATED` / `DEAL_STATUS_CHANGED`, each with a full **`deal`**).                                              |

Example requests with **curl** (after `npm run dev:api`):

```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/deals
curl -s http://localhost:3000/deals/api-seed-01
```

Create a deal (`product` must be a valid `ProductType` from shared, e.g. `IRS`; `currency` must match `CurrencySchema`):

```bash
curl -s -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{"product":"IRS","counterparty":"Goldman Sachs","notional":1000000,"currency":"USD","price":3.5,"trader":"A. Trader","broker":"B. Broker"}'
```

Update status (replace `<id>` with a real id from `GET /deals` or the POST response):

```bash
curl -s -X PATCH "http://localhost:3000/deals/<id>/status" \
  -H 'Content-Type: application/json' \
  -d '{"status":"BOOKED"}'
```

Invalid JSON bodies or Zod validation failures return **400** with error detail from the error middleware. The web blotter calls REST via **`apps/web/src/api/dealsClient.ts`** and subscribes to **`/ws/deals`** via **`useDealEventsWebSocket`** (see Local development → Web).

## Docker (production-like local stack)

Use Docker when you want **Postgres + API + web** running together without installing Postgres on the host. Native dev (`npm run dev:*`) is still fine for day-to-day coding.

### Quick start

```bash
cp docker.env.example .env   # optional — defaults work
npm run docker:up            # build + start (foreground)
npm run docker:seed          # first time only — 100 sample deals
```

Open **`http://localhost:5173`**. API: **`http://localhost:3000`**. WebSocket: **`ws://localhost:3000/ws/deals`**.

Background mode: `npm run docker:up:detached`. Stop: `npm run docker:down`.

### What each container does

| Service | Image | Role |
| ------- | ----- | ---- |
| **postgres** | `postgres:16-alpine` | Database; data in Docker volume `otcflow_postgres_data` |
| **api** | `apps/api/Dockerfile` | Runs **`prisma migrate deploy`**, then Express + WebSocket |
| **web** | `apps/web/Dockerfile` | Vite production build served by **nginx** on port 80 |

### Startup order

1. Postgres starts → healthcheck passes  
2. API connects using hostname **`postgres`**, runs migrations, listens on **`API_PORT`**  
3. Web serves static JS (API URLs were baked in at **build** time)

### Two networks (don’t mix them up)

| Traffic | URL / hostname | Why |
| ------- | -------------- | --- |
| Browser → API / WS | `http://localhost:3000` | Your browser runs on the **host** |
| Browser → web UI | `http://localhost:5173` | nginx in the web container |
| API → Postgres | `postgres:5432` | Docker **internal** DNS — only works inside Compose |

So **`VITE_API_URL`** and **`VITE_WS_URL`** must use **`localhost`**, not `http://api:3000`. Rebuild web after changing them: `docker compose up --build web`.

### Environment variables

Copy **`docker.env.example`** → **`.env`** at the repo root. Key vars:

| Variable | Default | Role |
| -------- | ------- | ---- |
| `VITE_API_URL` | `http://localhost:3000` | Baked into web at **build** — browser REST |
| `VITE_WS_URL` | `ws://localhost:3000/ws/deals` | Baked into web at **build** — browser WebSocket |
| `API_PORT` | `3000` | Published host port for API |
| `WEB_PORT` | `5173` | Published host port for web (→ nginx :80) |
| `CORS_ORIGIN` | `http://localhost:5173` | API CORS — must match where you open the UI |
| `POSTGRES_*` | `postgres` / `otcflow` | DB credentials (api `DATABASE_URL` is derived) |

Migrations run automatically when the **api** container starts. Use **`npm run docker:migrate`** to run them manually; **`npm run docker:seed`** for sample data (skips if deals already exist).

## Build

```bash
npm run build
```

Builds `@otcflow/shared`, then `@otcflow/web` (`tsc -b` + `vite build` → `apps/web/dist/`). The API has no `build` script yet.

## Scripts

| Command                | Purpose              |
| ---------------------- | -------------------- |
| `npm run dev:web`      | Vite dev server      |
| `npm run dev:api`      | API with `tsx watch` |
| `npm run db:migrate`   | Apply Prisma migrations |
| `npm run db:seed`      | Seed users + sample deals |
| `npm run docker:up`    | Docker Compose: build + start full stack |
| `npm run docker:up:detached` | Docker Compose in background |
| `npm run docker:down`  | Stop Docker stack |
| `npm run docker:migrate` | `prisma migrate deploy` in api container |
| `npm run docker:seed`  | Seed DB via api container |
| `npm run build`        | `shared` then `web`  |
| `npm run lint`         | ESLint               |
| `npm run format`       | Prettier write       |
| `npm run format:check` | Prettier check       |

**Env files:** native web → `apps/web/.env` (`VITE_*`). Docker → root `.env` from `docker.env.example`.
