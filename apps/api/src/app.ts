import cors from 'cors';
import express from 'express';
import { dealsRouter } from './routes/deals.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { metricsRouter } from './routes/metrics.routes.js';
import { simulatorRouter } from './routes/simulator.routes.js';
import { mountGraphQLHttp } from './graphql/mountGraphQLHttp.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { userContextMiddleware } from './middleware/userContext.middleware.js';
import { requestIdMiddleware } from './observability/requestId.middleware.js';
import { requestLoggingMiddleware } from './observability/requestLogging.middleware.js';

/** Express app without HTTP listen or WebSocket — used by tests and `index.ts`. */
export function createApp(): express.Application {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  app.use(requestIdMiddleware);
  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'x-user-id', 'x-request-id'],
      exposedHeaders: ['X-Request-Id'],
    })
  );
  app.use(express.json());
  app.use(requestLoggingMiddleware);
  app.use(userContextMiddleware);

  app.get('/', (_req, res) => {
    res.json({
      service: 'otcflow-api',
      message:
        'REST + GraphQL + WS + Postgres — GET /health/live, GET /health/ready, GET /metrics, WebSocket /ws/deals …',
    });
  });

  app.get('/ws/deals', (req, res) => {
    const host = req.get('host') ?? 'localhost:3000';
    res.status(200).type('html').send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>OTCFlow — deal events (WebSocket)</title></head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:2rem;line-height:1.5">
  <h1>Deal events — WebSocket endpoint</h1>
  <p>WebSocket clients connect to <code>ws://${host}/ws/deals</code>.</p>
</body>
</html>`);
  });

  app.use(healthRouter);
  app.use(metricsRouter);
  app.use(dealsRouter);
  app.use(simulatorRouter);
  mountGraphQLHttp(app);
  app.use(errorMiddleware);

  return app;
}
