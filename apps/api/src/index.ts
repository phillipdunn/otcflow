import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { dealsRouter } from './routes/deals.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { attachDealsWebSocket } from './ws/dealsWs.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'otcflow-api',
    message: 'REST + WS — GET /health, GET /deals, WebSocket path /ws/deals …',
  });
});

/**
 * Browser address bar uses plain HTTP GET (no WebSocket upgrade), so you would otherwise see "Cannot GET /ws/deals".
 * Real clients use `new WebSocket("ws://localhost:3000/ws/deals")` (or wss). WebSocket handshakes are handled by `ws`, not this route.
 */
app.get('/ws/deals', (req, res) => {
  const host = req.get('host') ?? 'localhost:3000';
  res.status(200).type('html').send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>OTCFlow — deal events (WebSocket)</title></head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:2rem;line-height:1.5">
  <h1>Deal events — WebSocket endpoint</h1>
  <p>This path is for a <strong>WebSocket</strong> connection, not a normal browser page.</p>
  <p>Open the <strong>React app</strong> (e.g. <code>http://localhost:5173</code>) — it connects to
  <code>ws://${host}/ws/deals</code> automatically.</p>
  <p>To test from a terminal: <code>npx wscat -c ws://${host}/ws/deals</code> (or any WebSocket client).</p>
</body>
</html>`);
});

app.use(healthRouter);
app.use(dealsRouter);

app.use(errorMiddleware);

const port = Number(process.env.PORT) || 3000;
const httpServer = createServer(app);

attachDealsWebSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`OTCFlow API listening on http://localhost:${port}`);
  console.log(`Deal events WebSocket: ws://localhost:${port}/ws/deals`);
});
