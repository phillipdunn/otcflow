import { z } from 'zod';

/** Lifecycle-style states for an OTC ticket row (mock blotter). */
export const DEAL_STATUS_VALUES = ['pending', 'quoted', 'live', 'done', 'cancelled'] as const;

export const DealStatusSchema = z.enum(DEAL_STATUS_VALUES);

export type DealStatus = z.infer<typeof DealStatusSchema>;

export const DealSchema = z.object({
  id: z.string(),
  product: z.string(),
  counterparty: z.string(),
  notional: z.number().positive(),
  currency: z.string().length(3),
  price: z.number(),
  status: DealStatusSchema,
  trader: z.string(),
  broker: z.string(),
  /** ISO 8601 (parseable by `Date`) — used for sorting and display. */
  updatedAt: z.string(),
});

export type Deal = z.infer<typeof DealSchema>;

export const DealsArraySchema = z.array(DealSchema);
