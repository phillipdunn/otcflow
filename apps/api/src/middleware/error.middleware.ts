import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../observability/logger.js';
import { recordError } from '../observability/metrics.js';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // Express only treats four-parameter functions as error handlers; `next` is unused here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.requestId;

  if (err instanceof HttpError) {
    if (err.statusCode >= 500) recordError();
    logger.warn('http_error', {
      requestId,
      statusCode: err.statusCode,
      message: err.message,
      name: err.name,
    });
    res.status(err.statusCode).json({ error: err.message, requestId });
    return;
  }
  if (err instanceof ZodError) {
    logger.warn('validation_error', { requestId, issues: err.issues.length });
    res.status(400).json({
      error: 'Validation failed',
      details: err.flatten(),
      requestId,
    });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({ error: 'Record not found', requestId });
    return;
  }

  recordError();
  logger.error('unhandled_error', {
    requestId,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({ error: 'Internal server error', requestId });
}
