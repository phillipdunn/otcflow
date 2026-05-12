# OTCFlow

Event-driven OTC trading workflow platform — **npm workspaces** monorepo (one lockfile, shared TypeScript packages).

This README describes **what is in the repo today**. For **what each part means on a real OTC desk**, how it maps to workflows, and **where the stack is headed** (not all built yet), see [docs/platform-context.md](docs/platform-context.md).

## What exists right now

| Area                  | Implemented                                                                                                                                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo**          | `apps/web`, `apps/api`, `packages/shared`; root scripts in `package.json`.                                                                                                                                                                                                 |
| **`apps/web`**        | React 18 + Vite 6 + TypeScript. **Phase 1 OTC deal blotter** (mock data only): filterable/sortable table, counterparty search, row selection, detail side panel (Escape to close), toolbar state via React context. Lives under `apps/web/src/blotter/`. No API calls yet. |
| **`apps/api`**        | Express on port 3000. **`GET /`** — service JSON. **`GET /health`** — Zod-validated body from `@otcflow/shared`. CORS for `http://localhost:5173`.                                                                                                                         |
| **`packages/shared`** | **`Deal`** (`ProductType` multi-asset: rates, FX, credit, bond, equity; `Currency`; `DealStatus`; `createdAt`; `version`; …) via Zod; **`HealthResponseSchema`**. Builds to `dist/` on `npm install` (`prepare`).                                                          |
| **Tooling**           | ESLint (flat config, root), Prettier (root), TypeScript per package.                                                                                                                                                                                                       |

## Repository layout

| Path              | Role                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| `apps/web`        | Browser UI (Vite dev server, default `:5173`). Blotter code in `src/blotter/`. |
| `apps/api`        | HTTP API (Express, default `:3000`).                                           |
| `packages/shared` | Shared Zod schemas and inferred types consumed by web (and API for health).    |

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

**API (optional — health smoke test)**

```bash
npm run dev:api
```

Expect: `OTCFlow API listening on http://localhost:3000`. Try `http://localhost:3000/` and `http://localhost:3000/health` in a browser or curl.

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
