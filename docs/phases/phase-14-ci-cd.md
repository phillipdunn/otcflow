# Phase 14 — CI/CD with GitHub Actions (local notes)

**How phase docs are structured:** **Scope** → **Walkthrough (slow)** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

---

## Scope (what Phase 14 was)

- **GitHub Actions** workflows under **`.github/workflows/`**.
- **`ci.yml`** — runs on **`pull_request`** and **push to `main`**.
- **`e2e.yml`** — **manual only** (`workflow_dispatch`); Playwright not on every push.
- **Pipeline steps:** `npm ci` → lint → typecheck → unit tests → Prisma migrate → integration tests → build.
- **Postgres service container** on port **5432** for integration tests; **`TEST_DATABASE_URL`** / **`DATABASE_URL`** set in the job.
- **Root scripts:** **`typecheck`** (shared + api + web); **`test`**, **`test:unit`**, **`test:integration`** (already from Phase 11).
- **Local mirror (optional):** **`npm run ci`** and **`npm run ci:fast`** at repo root — same checks without GitHub.
- **Docs:** README CI section; branch-per-phase PR workflow in **CONTRIBUTING.md** (when present).
- **Small fixes:** GraphQL **`graphql-ws/use/ws`** import + resolver typing for **`tsc`**; ESLint ignore **`scripts/`**; unused import removed from integration setup.
- **Not added:** AWS deploy, Terraform, required status checks on private repos (may need paid GitHub plan), e2e on every commit, Prettier in CI.

**Builds on:** [phase-11-testing.md](phase-11-testing.md) (tests and `createApp()`), [phase-13-graphql.md](phase-13-graphql.md) (GraphQL integration tests in CI).

---

## What problem this solves

| Before (Phase 11) | After (Phase 14) |
| ----------------- | ---------------- |
| Tests only when you run them locally | Same checks run on every PR and push to **`main`** |
| “Works on my machine” before merge | CI Postgres + migrate + integration proves DB path |
| No single **`typecheck`** command | One script fans out to all workspaces |
| E2e too slow/flaky for every push | E2e optional workflow |

**Principle:** **continuous integration** — integrate changes early and prove quality before **`main`**, not **continuous delivery** (no auto-deploy yet).

---

## Walkthrough (slow)

### 1. When workflows run

**`ci.yml`:**

```yaml
on:
  push:
    branches: [main]
  pull_request:
```

- Opening or updating a **PR** → CI runs.
- Pushing directly to **`main`** → CI runs.
- Pushing a feature branch **without** a PR → CI does **not** run (until you open a PR).

**Concurrency:** new pushes on the same ref cancel the previous run (`cancel-in-progress: true`).

### 2. CI job — one linear pipeline

Single job **`quality`** on **`ubuntu-latest`** (~15 min timeout):

| Step | Command | Purpose |
| ---- | ------- | ------- |
| Checkout | `actions/checkout@v4` | Clone commit under test |
| Setup Node 22 | `actions/setup-node@v4` + npm cache | Toolchain |
| Install | `npm ci` | Lockfile install; **`@otcflow/shared`** `prepare` builds |
| Lint | `npm run lint` | ESLint monorepo |
| Typecheck | `npm run typecheck` | `tsc` in shared, api, web |
| Unit tests | `npm run test:unit` | API + web Vitest |
| Prepare DB | `db:generate` + `db:migrate:deploy` | Schema on CI Postgres |
| Integration | `npm run test:integration` | Supertest + real DB |
| Build | `npm run build` | shared + web production build |

### 3. Postgres service container

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
```

Job env:

```text
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/otcflow
```

**`apps/api/src/test/setIntegrationDatabaseUrl.ts`** prefers **`TEST_DATABASE_URL`** — CI uses **5432**; local Docker Compose often uses **5433** on the host. Same tests, different port env.

### 4. E2E workflow — optional

**`e2e.yml`:** `workflow_dispatch` only.

- Same Postgres service + migrate.
- `npx playwright install --with-deps chromium`
- `npm run test:e2e` (starts **`dev:api`** + **`dev:web`** via Playwright config).

Use from GitHub **Actions** tab when you want a full-stack smoke test — not a merge gate by default.

### 5. Monorepo scripts

Root **`package.json`** orchestrates workspaces:

```text
npm run typecheck  →  -w @otcflow/shared, api, web
npm run test:unit    →  -w api, then web
npm run test:integration  →  -w api only
npm run build        →  shared, then web
```

CI never calls workspace scripts directly except Prisma steps — keeps the workflow readable.

### 6. Branch workflow (how to see CI work)

1. `git checkout -b phase-N-topic`
2. Implement + **`npm run ci`** locally (Postgres up)
3. Push + open PR → **`main`**
4. Watch **CI** check on the PR; merge when green

On **free private repos**, GitHub may not **block** merge without green checks — you still enforce by not merging red PRs. **Public** repos often get branch protection for free.

---

## Diagram

```mermaid
flowchart LR
  subgraph dev [Developer]
    BR[feature branch]
    PR[Pull request]
  end
  subgraph gha [GitHub Actions ci.yml]
    L[lint]
    T[typecheck]
    U[unit tests]
    M[migrate]
    I[integration]
    B[build]
  end
  BR --> PR
  PR --> L --> T --> U --> M --> I --> B
  B -->|green| MERGE[merge to main]
```

---

## Key files (Phase 14)

| Path | Role |
| ---- | ---- |
| `.github/workflows/ci.yml` | Main CI pipeline |
| `.github/workflows/e2e.yml` | Manual Playwright |
| `package.json` | `typecheck`, `test*`, `ci`, `ci:fast` |
| `apps/api/vitest.integration.config.ts` | Integration tests + DB |
| `apps/api/src/test/setIntegrationDatabaseUrl.ts` | CI vs local Postgres port |
| `README.md` | CI section |
| `CONTRIBUTING.md` | Branch + local CI habit (if in repo) |

**Three files to know cold:**

1. **`.github/workflows/ci.yml`** — what runs on every PR.  
2. **Root `package.json` scripts** — local parity with CI.  
3. **`setIntegrationDatabaseUrl.ts`** — why CI uses 5432 and Docker uses 5433.

---

## Checklist (review)

1. Open a test PR → **CI** workflow appears and completes.
2. **`npm run typecheck`** passes locally.
3. **`npm run test:integration`** passes with Postgres (or fails clearly without it).
4. Lint passes (`scripts/` ignored if local-only tooling).
5. Optional: run **E2E** workflow manually after merge.

---

## Later

- Branch protection + required checks (when repo plan allows).
- Add **`format:check`** to CI.
- Cache Prisma generate / Playwright in Actions.
- CD: build Docker images and deploy on green **`main`** (future phase).

---

## Review one-liner

Phase 14 adds **GitHub Actions CI**: lint, typecheck, unit + integration tests against a **Postgres service container**, and **web build** on every PR and **`main`** push — optional manual **E2E** — so quality is verified before merge, not deployed yet.

**Builds on:** [phase-11-testing.md](phase-11-testing.md). **Next:** [phase-15-observability.md](phase-15-observability.md) — health, metrics, structured logs, graceful shutdown.
