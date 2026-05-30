# OTCFlow API — PostgreSQL setup (Phase 9)

OTCFlow uses **Prisma** against a local **PostgreSQL** database. Deals and audit events persist across API restarts; simulator control state (running/stopped) stays in memory.

**Docker (Phase 10):** skip local Postgres install — use `npm run docker:up` from the repo root (see root [README](../../README.md#docker-production-like-local-stack)). Migrations and `DATABASE_URL` are handled by Compose.

## Why Prisma (not Drizzle)

| | **Prisma** (chosen) | Drizzle |
| --- | --- | --- |
| Migrations | `prisma migrate dev` + history in repo | drizzle-kit (extra config) |
| Seed | Built-in `prisma db seed` | Manual script wiring |
| Onboarding | Single `schema.prisma`, generated client | SQL-first, more boilerplate for this repo size |

Shared **Zod** types in `@otcflow/shared` remain the wire contract; Prisma models mirror them in Postgres.

## 1. Install PostgreSQL

`createdb: command not found` means **Postgres is not installed** or its `bin` folder is not on your `PATH`.

### macOS (Homebrew — recommended)

```bash
brew install postgresql@16
brew services start postgresql@16
```

Add CLI tools to your shell (Apple Silicon paths shown; Intel uses `/usr/local` instead of `/opt/homebrew`):

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Create the database:

```bash
createdb otcflow
```

**`DATABASE_URL` for Homebrew default** (often your Mac username, empty password):

```env
DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/otcflow?schema=public"
```

Replace `YOUR_MAC_USERNAME` with `whoami` output. If that fails, try:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/otcflow?schema=public"
```

### macOS (Postgres.app — GUI)

1. Download [Postgres.app](https://postgresapp.com/) and open it.  
2. Click **Initialize** if prompted.  
3. Add its binaries to `PATH` (Postgres.app menu → Install Command Line Tools).  
4. `createdb otcflow`

### Linux

Use your distro’s `postgresql` package, start the service, then `createdb otcflow`.

**Connection string (default):**

```text
postgresql://postgres:postgres@localhost:5432/otcflow?schema=public
```

Adjust user/password/port to match your install.

## 2. Configure the API

Create **`apps/api/.env`** (required — Prisma and `tsx` read it from here):

```bash
cp apps/api/.env.example apps/api/.env
# Edit DATABASE_URL if your Postgres user/password differ
```

If you see **`Environment variable not found: DATABASE_URL`**, this file is missing or empty.

## 3. Install dependencies & generate client

From repo root:

```bash
npm install
npm run db:generate -w @otcflow/api
```

## 4. Apply schema

```bash
npm run db:migrate -w @otcflow/api
```

Creates tables: `User`, `Deal`, `AuditEvent`.

## 5. Seed realistic starter data

```bash
npm run db:seed -w @otcflow/api
```

- Upserts demo **users** (mock desk + Market Simulator).
- Inserts **100** generated deals + `DEAL_CREATED` audit rows (skipped if deals already exist).

## 6. Run the API

```bash
npm run dev:api
```

Expect: `PostgreSQL connected (Prisma)`.

## Useful commands

| Command | Purpose |
| ------- | ------- |
| `npm run db:generate -w @otcflow/api` | Regenerate Prisma client after schema change |
| `npm run db:migrate -w @otcflow/api` | Apply migrations (dev) |
| `npm run db:push -w @otcflow/api` | Push schema without migration (prototyping only) |
| `npm run db:seed -w @otcflow/api` | Run seed script |
| `npx prisma studio -w @otcflow/api` | Browse data (optional) |

## Tables

| Table | Role |
| ----- | ---- |
| `User` | Demo actors (`x-user-id` lookup) |
| `Deal` | Current trade state |
| `AuditEvent` | Append-only history (user snapshot columns) |

Simulator **reset** replaces all deals + audit in one transaction; **start/stop** does not use the database.
