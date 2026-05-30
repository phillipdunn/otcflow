# OTCFlow web — build React app with Vite, serve static files with nginx (Phase 10).
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=@otcflow/web --workspace=@otcflow/shared --include-workspace-root

COPY apps/web ./apps/web

ARG VITE_API_URL=http://localhost:3000
ARG VITE_WS_URL=ws://localhost:3000/ws/deals
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build -w @otcflow/web

FROM nginx:alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
