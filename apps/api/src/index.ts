import cors from 'cors';
import express from 'express';
import { dealsRouter } from './routes/deals.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  })
);
app.use(express.json());

// '/' route registered inline 
app.get('/', (_req, res) => {
  res.json({
    service: 'otcflow-api',
    message: 'REST API — use GET /health, GET /deals, POST /deals, …',
  });
});

// the routes in here are registered at the route of the app, so the
// paths inside are the real paths e.g. /deals/:id/status
app.use(healthRouter);
app.use(dealsRouter);

app.use(errorMiddleware);

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`OTCFlow API listening on http://localhost:${port}`);
});
