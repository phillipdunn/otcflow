#!/bin/sh
# API container entrypoint: apply migrations, then start Express + WebSocket.
set -e
cd /app/apps/api

echo "→ prisma migrate deploy"
npx prisma migrate deploy

echo "→ starting API on port ${PORT:-3000}"
exec npx tsx src/index.ts
