import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger.js';
import { recordRequest } from './metrics.js';

function routeKey(req: Request): string {
  if (req.route?.path !== undefined) {
    const base = req.baseUrl ?? '';
    return `${req.method} ${base}${req.route.path}`;
  }
  return `${req.method} ${req.path}`;
}

/** Log each HTTP request when the response finishes. */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  const key = routeKey(req);
  recordRequest(key);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info('http_request', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      route: key,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}
