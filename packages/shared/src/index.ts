import { z } from 'zod';

/** Minimal contract used by API + web to prove shared package wiring. */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
