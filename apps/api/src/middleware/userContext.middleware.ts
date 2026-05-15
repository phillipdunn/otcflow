import type { NextFunction, Request, Response } from 'express';
import { resolveRequestUser } from '../context/requestUser.js';

/** Attach `req.currentUser` for every request (default user when header missing/unknown). */
export function userContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.currentUser = resolveRequestUser(req);
  next();
}
