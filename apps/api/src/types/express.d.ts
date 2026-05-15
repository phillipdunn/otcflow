import type { User } from '@otcflow/shared';

declare global {
  namespace Express {
    interface Request {
      /** Mock desk user resolved from `x-user-id` (Step 6 — not auth). */
      currentUser: User;
    }
  }
}

export {};
