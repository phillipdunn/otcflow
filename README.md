# OTCFlow

Event-driven OTC trading workflow platform — **npm workspaces** monorepo (one lockfile, shared TypeScript packages).

This README describes **what is in the repo today**. For **what each part means on a real OTC desk**, how it maps to workflows, and **where the stack is headed** (not all built yet), see [docs/platform-context.md](docs/platform-context.md).

## What exists right now

| Area                  | Implemented                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo**          | `apps/web`, `apps/api`, `packages/shared`; root scripts in `package.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **`apps/web`**        | React 18 + Vite 6 + TypeScript. **Phase 3 OTC deal blotter** wired to the API with **TanStack Query** (`GET /deals`, `POST /deals`, `PATCH /deals/:id/status`), **`src/api/requestJson.ts`** (shared `fetch` + errors) and **`src/api/dealsClient.ts`** (deal paths + Zod), loading/error UI, create form, detail status actions, and **query invalidation** after mutations. **`useBlotterView`** still owns search, filter, sort, and selection (**UI state**). Optional **`VITE_API_URL`** (defaults to `http://localhost:3000`). `mockDeals.ts` remains as validated sample data, not the default source. |
| **`apps/api`**        | Express (default port **3000**). **Phase 2 REST deals API**: in-memory store with seed deals; **`GET /`**, **`GET /health`**, **`GET /deals`**, **`GET /deals/:id`**, **`POST /deals`**, **`PATCH /deals/:id/status`**. Zod validation on create and status update; shared **`Deal`** shape from `@otcflow/shared`. CORS for `http://localhost:5173` (includes `PATCH`).                                                                                                                                                                                                                                      |
| **`packages/shared`** | **`Deal`** (`ProductType`, `Currency`, `DealStatus`, timestamps, `version`, …) and **`DealsArraySchema`** for seed/mock lists; **`HealthResponseSchema`**. Builds to `dist/` on `npm install` (`prepare`).                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Tooling**           | ESLint (flat config, root), Prettier (root), TypeScript per package.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Repository layout

| Path              | Role                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`        | Browser UI (Vite `:5173`). Blotter under `src/blotter/`; HTTP helpers under `src/api/`. TanStack Query for server cache.                                          |
| `apps/api`        | HTTP API (Express, default `:3000`). Source is split into `routes/`, `controllers/`, `services/`, `data/` (in-memory store + seed), `validation/`, `middleware/`. |
| `packages/shared` | Shared Zod schemas and inferred types consumed by web and API (`Deal`, health, …).                                                                                |

### Web blotter (`apps/web/src/blotter/`)

| File / area                  | Role                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BlotterScreen.tsx`          | TanStack Query: `useQuery` for deals, mutations for create/status, loading/error/refresh UI; composes toolbar, table, detail, optional create panel. |
| `blotterToolbarContext.ts`   | Toolbar context value + `useBlotterToolbar` hook.                                                                                                    |
| `BlotterToolbarProvider.tsx` | Context `Provider` (keeps Fast Refresh happy).                                                                                                       |
| `useBlotterView.ts`          | Filters, sort, selection, derived `visibleDeals` / `selectedDeal` from the deal list.                                                                |
| `queryKeys.ts`               | Shared React Query cache keys (`['deals']`).                                                                                                         |
| `mockDeals.ts`               | `MOCK_DEALS` — validated sample list; not wired as the default data source.                                                                          |
| `CreateDealForm.tsx`         | `POST /deals` via `useMutation`; invalidates deals query on success.                                                                                 |
| `BlotterToolbar.tsx`         | Search + product/status filters + sort controls (reads context).                                                                                     |
| `DealTable.tsx`              | Accessible table (`role`, `aria-selected`, keyboard row activation).                                                                                 |
| `DealDetailPanel.tsx`        | Side panel; Escape closes; status buttons call `PATCH /deals/:id/status`.                                                                            |
| `formatDealDisplay.ts`       | Shared display formatting (notional, dates, price, status badge class).                                                                              |
| `sortChevron.ts`             | Sort direction indicator for toolbar labels.                                                                                                         |
| `blotter.css`                | Blotter layout and styling.                                                                                                                          |

### Web API client (`apps/web/src/api/`)

| File             | Role                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `dealsClient.ts` | `fetchDeals`, `postDeal`, `patchDealStatus`; Zod-parse responses; re-exports deal helpers from `requestJson.ts`. |
| `requestJson.ts` | `requestJson`, `getApiBaseUrl`, `ApiRequestError` — shared `fetch` + JSON error handling for any API path.       |

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

**Not in this repo:** AWS, Docker, GraphQL, WebSockets, PostgreSQL, Prisma, auth (by design until you add them).

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

**Web (Phase 3 — blotter + API)**

```bash
npm run dev:web
```

Run **`npm run dev:api`** in another terminal so `GET /deals` succeeds. Open the URL Vite prints (usually `http://localhost:5173`). The blotter loads **live deals**, supports filters/sort/selection/detail as before, and adds **New deal** plus **status** updates from the detail panel.

Optional: set **`VITE_API_URL`** in **`apps/web/.env`** if the API is not at `http://localhost:3000` (no trailing slash).

**API (Phase 2 — deals REST + health)**

```bash
npm run dev:api
```

Expect: `OTCFlow API listening on http://localhost:3000` (override with `PORT` if needed).

| Method & path             | Purpose                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`                   | Short JSON describing the service and main routes.                                                                                                      |
| `GET /health`             | Liveness; body validated with `HealthResponseSchema` from shared.                                                                                       |
| `GET /deals`              | All deals (seed rows plus any created in this process).                                                                                                 |
| `GET /deals/:id`          | One deal; **404** if missing.                                                                                                                           |
| `POST /deals`             | Create a deal; server sets `id` (UUID), `createdAt`, `updatedAt`, `version` (starts at **1**). Optional body field `status`; defaults apply if omitted. |
| `PATCH /deals/:id/status` | Set `status`; bumps `version` and updates `updatedAt`. **404** if missing.                                                                              |

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

Invalid JSON bodies or Zod validation failures return **400** with error detail from the error middleware. The web blotter calls these endpoints via **`apps/web/src/api/dealsClient.ts`** (built on **`requestJson.ts`** for HTTP; see Local development → Web).

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
