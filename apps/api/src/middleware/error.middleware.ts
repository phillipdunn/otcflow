import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

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
  _req: Request,
  res: Response,
  // Express only treats four-parameter functions as error handlers; `next` is unused here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.flatten(),
    });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
