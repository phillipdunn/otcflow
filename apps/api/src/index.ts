import cors from 'cors';
import express from 'express';
import { HealthResponseSchema } from '@otcflow/shared';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'otcflow-api',
    message: 'REST API — use GET /health for a readiness probe.',
  });
});

app.get('/health', (_req, res) => {
  const payload = HealthResponseSchema.parse({
    status: 'ok',
    service: 'otcflow-api',
  });
  res.json(payload);
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`OTCFlow API listening on http://localhost:${port}`);
});
