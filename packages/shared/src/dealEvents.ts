import { z } from 'zod';
import { DealSchema } from './deal.js';

/** Monotonic stream id — clients drop events with `sequenceNumber <= lastApplied`. */
const DealEventFieldsSchema = z.object({
  sequenceNumber: z.number().int().positive(),
  deal: DealSchema,
});

/** Emitted when a new deal is persisted (e.g. POST /deals, simulator). */
export const DealCreatedEventSchema = DealEventFieldsSchema.extend({
  type: z.literal('DEAL_CREATED'),
});

/** Emitted when a deal's status changes. */
export const DealStatusChangedEventSchema = DealEventFieldsSchema.extend({
  type: z.literal('DEAL_STATUS_CHANGED'),
});

/** Emitted when a deal's price changes. */
export const DealPriceChangedEventSchema = DealEventFieldsSchema.extend({
  type: z.literal('DEAL_PRICE_CHANGED'),
});

/** Emitted when non-price economics or party fields change. */
export const DealAmendedEventSchema = DealEventFieldsSchema.extend({
  type: z.literal('DEAL_AMENDED'),
});

export const DealEventSchema = z.discriminatedUnion('type', [
  DealCreatedEventSchema,
  DealStatusChangedEventSchema,
  DealPriceChangedEventSchema,
  DealAmendedEventSchema,
]);

export type DealEvent = z.infer<typeof DealEventSchema>;
export type DealCreatedEvent = z.infer<typeof DealCreatedEventSchema>;
export type DealStatusChangedEvent = z.infer<typeof DealStatusChangedEventSchema>;
export type DealPriceChangedEvent = z.infer<typeof DealPriceChangedEventSchema>;
export type DealAmendedEvent = z.infer<typeof DealAmendedEventSchema>;
