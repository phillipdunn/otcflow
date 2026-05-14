import { z } from 'zod';
import { DealSchema } from './deal.js';

/** Emitted when a new deal is persisted (e.g. POST /deals). */
export const DealCreatedEventSchema = z.object({
  type: z.literal('DEAL_CREATED'),
  deal: DealSchema,
});

/** Emitted when a deal's status changes (e.g. PATCH /deals/:id/status). */
export const DealStatusChangedEventSchema = z.object({
  type: z.literal('DEAL_STATUS_CHANGED'),
  deal: DealSchema,
});

export const DealEventSchema = z.discriminatedUnion('type', [
  DealCreatedEventSchema,
  DealStatusChangedEventSchema,
]);

export type DealEvent = z.infer<typeof DealEventSchema>;
export type DealCreatedEvent = z.infer<typeof DealCreatedEventSchema>;
export type DealStatusChangedEvent = z.infer<typeof DealStatusChangedEventSchema>;
