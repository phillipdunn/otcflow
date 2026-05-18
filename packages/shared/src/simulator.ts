import { z } from 'zod';

export const SIMULATOR_DEAL_COUNT_MIN = 500;
export const SIMULATOR_DEAL_COUNT_MAX = 5000;
export const SIMULATOR_DEAL_COUNT_DEFAULT = 2000;

/** Default delay between simulator ticks (~1 event/s before skip chance). */
export const SIMULATOR_DEFAULT_INTERVAL_MS = 1000;

export const SimulatorStatusSchema = z.object({
  running: z.boolean(),
  dealCount: z.number().int().nonnegative(),
  configuredDealCount: z.number().int().nonnegative(),
  eventsEmitted: z.number().int().nonnegative(),
  lastSequenceNumber: z.number().int().nonnegative(),
  /** Bumps on reset so clients can realign sequence guards. */
  streamEpoch: z.number().int().nonnegative(),
  intervalMs: z.number().int().positive(),
});

export type SimulatorStatus = z.infer<typeof SimulatorStatusSchema>;

export const SimulatorStartBodySchema = z.object({
  intervalMs: z.number().int().min(50).max(5000).optional(),
});

export type SimulatorStartBody = z.infer<typeof SimulatorStartBodySchema>;

export const SimulatorResetBodySchema = z.object({
  dealCount: z
    .number()
    .int()
    .min(SIMULATOR_DEAL_COUNT_MIN)
    .max(SIMULATOR_DEAL_COUNT_MAX)
    .optional(),
});

export type SimulatorResetBody = z.infer<typeof SimulatorResetBodySchema>;
