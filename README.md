# OTCFlow

Event-driven OTC trading workflow platform — **npm workspaces** monorepo (one lockfile, shared TypeScript packages).

This README describes **what is in the repo today**. For **what each part means on a real OTC desk**, how it maps to workflows, and **where the stack is headed** (not all built yet), see [docs/platform-context.md](docs/platform-context.md).

## What exists right now

| Area                  | Implemented                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo**          | `apps/web`, `apps/api`, `packages/shared`; root scripts in `package.json`.                                                                         |
| **`apps/web`**        | React 18 + Vite 6 + TypeScript. Home page calls `GET /health` via `fetch`.                                                                         |
| **`apps/api`**        | Express on port 3000. **`GET /`** — service JSON. **`GET /health`** — Zod-validated body from `@otcflow/shared`. CORS for `http://localhost:5173`. |
| **`packages/shared`** | `HealthResponseSchema` / `HealthResponse`; builds to `dist/` on `npm install` (`prepare`).                                                         |
| **Tooling**           | ESLint (flat config, root), Prettier (root), TypeScript per package.                                                                               |

## Repository layout

| Path              | Role                                           |
| ----------------- | ---------------------------------------------- |
| `apps/web`        | Browser UI (Vite dev server, default `:5173`). |
| `apps/api`        | HTTP API (Express, default `:3000`).           |
| `packages/shared` | Shared Zod schemas and inferred types.         |

## Why it is structured this way

1. **npm workspaces** — Local packages link with `"workspace": "*"` style deps (`"@otcflow/shared": "*"`) without publishing.

2. **Vite** — Dev server and production bundle for the React app.

3. **`tsx watch` on the API** — Run and reload TypeScript without a separate compile step in dev.

4. **`packages/shared` → `dist/`** — Compiled output + declarations; `prepare` runs `build` after install so dependents resolve real files.

5. **Zod in shared** — `/health` response is parsed/validated with the same schema the frontend types use (`z.infer`).

6. **Root ESLint + Prettier** — One config tree; React-specific lint only under `apps/web`.

7. **CORS** — Allows the Vite origin to call the API in local development only.

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

**API (terminal 1)**

```bash
npm run dev:api
```

Expect: `OTCFlow API listening on http://localhost:3000`.

**Web (terminal 2)**

```bash
npm run dev:web
```

Open the URL Vite prints (usually `http://localhost:5173`). With the API running, the page shows the `/health` JSON; if the API is down, an error message is shown.

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

Optional: `VITE_API_URL` for the web app if the API is not at `http://localhost:3000`.
