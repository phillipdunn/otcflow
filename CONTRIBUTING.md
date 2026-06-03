# Contributing to OTCFlow

## Branch and pull request workflow

Build each phase (or meaningful chunk of work) on a **short-lived branch** and merge via **pull request** into `main`. That is how you see GitHub Actions CI run and stay green before code lands on `main`.

```text
main (protected, always deployable-ish)
  │
  ├── phase-15-something    →  open PR  →  CI runs  →  review  →  merge
  │
  └── fix/short-description →  open PR  →  CI runs  →  merge
```

### Suggested branch names

| Pattern | Example |
| ------- | ------- |
| Phase work | `phase-15-topic` |
| Small fix | `fix/deal-status-chip` |
| CI/docs only | `chore/readme-ci` |

Avoid long-lived branches that drift far from `main` — rebase or merge `main` in often so CI stays relevant.

### Opening a pull request

1. Push your branch: `git push -u origin phase-15-topic`
2. Open a PR targeting **`main`** on GitHub.
3. Wait for the **CI** workflow (`.github/workflows/ci.yml`) — all steps must pass.
4. Merge when green (squash or merge commit — your preference).

Direct pushes to `main` also run CI, but **PRs are the default path** so you review diffs and checks before merge.

### Optional: require CI before merge

In the repo **Settings → Branches → Branch protection rules** for `main`:

- Require a pull request before merging
- Require status checks to pass → select **Lint, typecheck, test, build** (the job name from `ci.yml`)

Then merges are blocked until CI is green.

### Optional e2e

Full browser tests are **not** on every PR. After merge (or before a release), run **Actions → E2E → Run workflow**, or locally:

```bash
npm run test:e2e:install   # once per machine
npm run test:e2e
```

---

## Run CI checks before you push

GitHub runs the same commands as local **`npm run ci`** (see root `package.json`).

### Full pipeline (matches Actions)

Requires **Postgres** (native or `docker compose up postgres -d`).

```bash
npm ci
npm run ci
```

Uses `TEST_DATABASE_URL` / `DATABASE_URL` from the environment, or defaults in `apps/api/src/test/setIntegrationDatabaseUrl.ts` (Docker Compose: port **5433**; CI uses **5432**).

Example with explicit URL (matches GitHub Actions locally on 5432):

```bash
export TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/otcflow
export DATABASE_URL="$TEST_DATABASE_URL"
npm run ci
```

### Fast checks (no database)

When you are only changing web UI, types, or unit-tested logic:

```bash
npm run ci:fast
```

Runs: lint → typecheck → unit tests → build. Skips integration tests and Prisma migrate.

### Day-to-day habit

| When | Run |
| ---- | --- |
| Before opening a PR | `npm run ci` (or `ci:fast` then `ci` before merge) |
| While editing | `npm run test:unit`, `npm run typecheck` |
| Touching API + DB | `npm run test:integration` with Postgres up |
| Touching blotter flows | `npm run test:e2e` occasionally |

---

## What CI enforces

| Step | Fails if |
| ---- | -------- |
| Lint | ESLint errors |
| Typecheck | TypeScript errors in `shared`, `api`, or `web` |
| Unit tests | Vitest failures (api + web) |
| Migrate + integration | Prisma or Supertest/DB failures |
| Build | `tsc` / Vite production build fails |

Details: [README — Continuous integration](README.md#continuous-integration-github-actions).

---

## Monorepo conventions

- Add scripts at the **root** when CI and developers both need them; use **`-w @otcflow/package`** to delegate to workspaces.
- Shared types and Zod live in **`packages/shared`** — build runs on `npm install` via `prepare`.
- New API behaviour: prefer **services** + tests; keep REST/GraphQL as thin adapters.
- Do not commit secrets (`.env`, credentials). CI uses env vars in the workflow, not repo files.
