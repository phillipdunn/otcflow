# OTCFlow

Event-driven OTC trading workflow platform — **npm workspaces** monorepo (one lockfile, shared TypeScript packages).

This README describes **what is in the repo today**. For **what each part means on a real OTC desk**, how it maps to workflows, and **where the stack is headed** (not all built yet), see [docs/platform-context.md](docs/platform-context.md).

## What exists right now

| Area                  | Implemented                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Monorepo**          | `apps/web`, `apps/api`, `packages/shared`; root scripts in `package.json`.                                                                                                                                                                                                                                                                                                                                                                             |
| **`apps/web`**        | React 18 + Vite 6 + TypeScript. **Phase 5 blotter**: **MUI** (**`ThemeProvider`**, layout, **`Dialog`** for create, **`Drawer`** for deal detail, toolbar/filters/forms, **`Chip`** for status) + **AG Grid** (**`DealBlotterGrid`**) for the main table — column formatters for notional / price / timestamps, MUI **`Chip`** status cell renderer, row click opens the drawer. **Phase 4** behaviour retained: TanStack Query + REST, **`useDealEventsWebSocket`** on **`/ws/deals`** with version-guarded cache merge and reconnect backoff. **`requestJson.ts`** still supplies **`getDealsWebSocketUrl()`**. |
| **`apps/api`**        | Express on port **3000**; **`node:http`** **`createServer(app)`** shares the port with **`ws`** **`WebSocketServer`** on **`/ws/deals`**. REST: **`GET /`**, **`GET /health`**, **`GET /deals`**, **`GET /deals/:id`**, **`POST /deals`**, **`PATCH /deals/:id/status`**. After create / status update, **`broadcastDealEvent`** sends **`DEAL_CREATED`** / **`DEAL_STATUS_CHANGED`** (shared **`DealEvent`** JSON) to all sockets.                    |
| **`packages/shared`** | **`Deal`**, **`DealEvent`** (`DEAL_CREATED`, `DEAL_STATUS_CHANGED` + Zod), **`DealsArraySchema`**, **`HealthResponseSchema`**. Builds to `dist/` on `npm install` (`prepare`).                                                                                                                                                                                                                                                                         |
| **Tooling**           | ESLint (flat config, root), Prettier (root), TypeScript per package.                                                                                                                                                                                                                                                                                                                                                                                   |

## Repository layout

| Path              | Role                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web`        | Browser UI (Vite `:5173`). Blotter under `src/blotter/`; HTTP helpers under `src/api/`. TanStack Query for server cache.       |
| `apps/api`        | HTTP + WebSocket on **`:3000`** (`src/ws/dealsWs.ts`). Routes / controllers / services / `data` / `validation` / `middleware`. |
| `packages/shared` | Shared Zod schemas and inferred types consumed by web and API (`Deal`, health, …).                                             |

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
| `DealDetailPanel.tsx`        | MUI **`Drawer`**; status buttons call `PATCH /deals/:id/status`.                                                           |
| `formatDealDisplay.ts`       | Notional, dates, price formatters; **`dealStatusMuiColor`** for **`Chip`** colours.                                        |
| `sortChevron.ts`             | Sort direction indicator for toolbar labels.                                                                               |

### Web API client (`apps/web/src/api/`)

| File             | Role                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `dealsClient.ts` | `fetchDeals`, `postDeal`, `patchDealStatus`; Zod-parse responses; re-exports deal helpers from `requestJson.ts`.      |
| `requestJson.ts` | `requestJson`, `getApiBaseUrl`, `getDealsWebSocketUrl`, `ApiRequestError` — shared `fetch` + WS URL for any API path. |

## Why it is structured this way

1. **npm workspaces** — Local packages link with `"workspace": "*"` style deps (`"@otcflow/shared": "*"`) without publishing.

2. **Vite** — Dev server and production bundle for the React app.

3. **`tsx watch` on the API** — Run and reload TypeScript without a separate compile step in dev.

4. **`packages/shared` → `dist/`** — Compiled output + declarations; `prepare` runs `build` after install so dependents resolve real files.

5. **Zod in shared** — Health and deal payloads share one pattern: runtime validation plus `z.infer` types for TypeScript.

6. **Root ESLint + Prettier** — One config tree; React-specific lint only under `apps/web`.

7. **CORS** — Allows the Vite origin to call the API in local development only.

8. **Toolbar context** — Avoids a long prop list from screen → toolbar; value is `useMemo`’d so consumers do not re-render unnecessarily.

9. **TanStack Query (web)** — Server-fetched deals and mutations live in the query cache (`['deals']`); UI filters/sort/selection stay in React state and `useBlotterView`.

10. **WebSocket deal events** — API broadcasts **`DealEvent`** after writes; web **`setQueryData`** merges by **`deal.version`** to ignore stale/out-of-order messages; reconnect with backoff if the socket drops.

**Not in this repo:** AWS, Docker, GraphQL, PostgreSQL, Prisma, auth (by design until you add them).

## Prerequisites

- Node.js 20.x+ (LTS recommended)
- npm 10.x+

## Setup

```bash
npm install
```

Workspaces install; `@otcflow/shared` runs `prepare` and creates `packages/shared/dist/`.

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

Optional: set **`VITE_API_URL`** in **`apps/web/.env`** if the API is not at `http://localhost:3000` (no trailing slash). The WebSocket URL is derived from the same base (**`ws:`** / **`wss:`** + path **`/ws/deals`**).

**API (Phase 4 — REST + deal events WebSocket)**

```bash
npm run dev:api
```

Expect: `OTCFlow API listening on http://localhost:3000` and a line for **`Deal events WebSocket: ws://localhost:3000/ws/deals`** (override with `PORT` if needed).

| Method & path / socket    | Purpose                                                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`                   | Short JSON describing the service and main routes.                                                                                                                                                  |
| `GET /health`             | Liveness; body validated with `HealthResponseSchema` from shared.                                                                                                                                   |
| `GET /deals`              | All deals (seed rows plus any created in this process).                                                                                                                                             |
| `GET /deals/:id`          | One deal; **404** if missing.                                                                                                                                                                       |
| `POST /deals`             | Create a deal; server sets `id` (UUID), `createdAt`, `updatedAt`, `version` (starts at **1**). Optional body field `status`; defaults apply if omitted. Broadcasts **`DEAL_CREATED`** on WebSocket. |
| `PATCH /deals/:id/status` | Set `status`; bumps `version` and updates `updatedAt`. **404** if missing. Broadcasts **`DEAL_STATUS_CHANGED`** on WebSocket.                                                                       |
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
  -d '{"product":"IRS","counterparty":"Acme Corp","notional":1000000,"currency":"USD","price":3.5,"trader":"A. Trader","broker":"B. Broker"}'
```

Update status (replace `<id>` with a real id from `GET /deals` or the POST response):

```bash
curl -s -X PATCH "http://localhost:3000/deals/<id>/status" \
  -H 'Content-Type: application/json' \
  -d '{"status":"BOOKED"}'
```

Invalid JSON bodies or Zod validation failures return **400** with error detail from the error middleware. The web blotter calls REST via **`apps/web/src/api/dealsClient.ts`** and subscribes to **`/ws/deals`** via **`useDealEventsWebSocket`** (see Local development → Web).

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
| `npm run build`        | `shared` then `web`  |
| `npm run lint`         | ESLint               |
| `npm run format`       | Prettier write       |
| `npm run format:check` | Prettier check       |

Set **`VITE_API_URL`** in **`apps/web/.env`** if the API is not at `http://localhost:3000` (no trailing slash).
