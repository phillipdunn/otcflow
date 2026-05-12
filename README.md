# OTCFlow

Event-driven OTC trading workflow platform — **npm workspaces** monorepo (one lockfile, shared TypeScript packages).

This README describes **what is in the repo today**. For **what each part means on a real OTC desk**, how it maps to workflows, and **where the stack is headed** (not all built yet), see [docs/platform-context.md](docs/platform-context.md).

## What exists right now

| Area                  | Implemented                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Monorepo**          | `apps/web`, `apps/api`, `packages/shared`; root scripts in `package.json`.                                                                                                                                                                                                                                                                                               |
| **`apps/web`**        | React 18 + Vite 6 + TypeScript. **Phase 1 OTC deal blotter** (mock data only): filterable/sortable table, counterparty search, row selection, detail side panel (Escape to close), toolbar state via React context. Lives under `apps/web/src/blotter/`. No API calls yet.                                                                                               |
| **`apps/api`**        | Express (default port **3000**). **Phase 2 REST deals API**: in-memory store with seed deals; **`GET /`**, **`GET /health`**, **`GET /deals`**, **`GET /deals/:id`**, **`POST /deals`**, **`PATCH /deals/:id/status`**. Zod validation on create and status update; shared **`Deal`** shape from `@otcflow/shared`. CORS for `http://localhost:5173` (includes `PATCH`). |
| **`packages/shared`** | **`Deal`** (`ProductType`, `Currency`, `DealStatus`, timestamps, `version`, …) and **`DealsArraySchema`** for seed/mock lists; **`HealthResponseSchema`**. Builds to `dist/` on `npm install` (`prepare`).                                                                                                                                                               |
| **Tooling**           | ESLint (flat config, root), Prettier (root), TypeScript per package.                                                                                                                                                                                                                                                                                                     |

## Repository layout

| Path              | Role                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`        | Browser UI (Vite dev server, default `:5173`). Blotter code in `src/blotter/`.                                                                                    |
| `apps/api`        | HTTP API (Express, default `:3000`). Source is split into `routes/`, `controllers/`, `services/`, `data/` (in-memory store + seed), `validation/`, `middleware/`. |
| `packages/shared` | Shared Zod schemas and inferred types consumed by web and API (`Deal`, health, …).                                                                                |

### Web blotter (`apps/web/src/blotter/`)

| File / area                  | Role                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `BlotterScreen.tsx`          | Composes hook, toolbar provider, table, conditional detail panel.                     |
| `blotterToolbarContext.ts`   | Toolbar context value + `useBlotterToolbar` hook.                                     |
| `BlotterToolbarProvider.tsx` | Context `Provider` (keeps Fast Refresh happy).                                        |
| `useBlotterView.ts`          | Filters, sort, selection, derived `visibleDeals` / `selectedDeal` from the deal list. |
| `mockDeals.ts`               | `MOCK_DEALS` validated with `DealsArraySchema.parse` at load time.                    |
| `BlotterToolbar.tsx`         | Search + product/status filters + sort controls (reads context).                      |
| `DealTable.tsx`              | Accessible table (`role`, `aria-selected`, keyboard row activation).                  |
| `DealDetailPanel.tsx`        | Side panel for selected deal; Escape closes.                                          |
| `formatDealDisplay.ts`       | Shared display formatting (notional, dates, price, status badge class).               |
| `sortChevron.ts`             | Sort direction indicator for toolbar labels.                                          |
| `blotter.css`                | Blotter layout and styling.                                                           |

## Why it is structured this way

1. **npm workspaces** — Local packages link with `"workspace": "*"` style deps (`"@otcflow/shared": "*"`) without publishing.

2. **Vite** — Dev server and production bundle for the React app.

3. **`tsx watch` on the API** — Run and reload TypeScript without a separate compile step in dev.

4. **`packages/shared` → `dist/`** — Compiled output + declarations; `prepare` runs `build` after install so dependents resolve real files.

5. **Zod in shared** — Health and deal payloads share one pattern: runtime validation plus `z.infer` types for TypeScript.

6. **Root ESLint + Prettier** — One config tree; React-specific lint only under `apps/web`.

7. **CORS** — Allows the Vite origin to call the API in local development only.

8. **Toolbar context** — Avoids a long prop list from screen → toolbar; value is `useMemo`’d so consumers do not re-render unnecessarily.

**Not in this repo:** AWS, Docker, GraphQL, WebSockets, PostgreSQL, Prisma, TanStack Query (by design until you add them).

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

**Web (primary for Phase 1 blotter)**

```bash
npm run dev:web
```

Open the URL Vite prints (usually `http://localhost:5173`). You should see the **deal blotter** with mock rows; filters, sort, row click, detail panel, and Escape-to-close work **without** the API.

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

Invalid JSON bodies or Zod validation failures return **400** with error detail from the error middleware. The web blotter still uses mock data only; wiring it to this API is a later step.

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

When the web app calls the API again, you can point it with `VITE_API_URL` if the API is not at `http://localhost:3000`.
