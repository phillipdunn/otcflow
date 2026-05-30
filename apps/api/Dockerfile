# OTCFlow API — production-like container (Phase 10).
# Monorepo install: @otcflow/api + @otcflow/shared. Migrations run in docker-entrypoint.sh.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci --workspace=@otcflow/api --workspace=@otcflow/shared --include-workspace-root

COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN npx prisma generate

RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
