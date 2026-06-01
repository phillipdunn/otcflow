import { z } from 'zod';
import { DealSchema } from './deal.js';

/** Payload shared by all domain deal events (no stream metadata). */
const DomainDealEventFieldsSchema = z.object({
  deal: DealSchema,
});

/** Domain event: a new deal was persisted. */
export const DomainDealCreatedEventSchema = DomainDealEventFieldsSchema.extend({
  type: z.literal('DEAL_CREATED'),
});

/** Domain event: deal status changed. */
export const DomainDealStatusChangedEventSchema = DomainDealEventFieldsSchema.extend({
  type: z.literal('DEAL_STATUS_CHANGED'),
});

/** Domain event: deal price changed. */
export const DomainDealPriceChangedEventSchema = DomainDealEventFieldsSchema.extend({
  type: z.literal('DEAL_PRICE_CHANGED'),
});

/** Domain event: non-price deal fields amended. */
export const DomainDealAmendedEventSchema = DomainDealEventFieldsSchema.extend({
  type: z.literal('DEAL_AMENDED'),
});

export const DomainDealEventSchema = z.discriminatedUnion('type', [
  DomainDealCreatedEventSchema,
  DomainDealStatusChangedEventSchema,
  DomainDealPriceChangedEventSchema,
  DomainDealAmendedEventSchema,
]);

export type DomainDealEvent = z.infer<typeof DomainDealEventSchema>;
export type DomainDealCreatedEvent = z.infer<typeof DomainDealCreatedEventSchema>;
export type DomainDealStatusChangedEvent = z.infer<typeof DomainDealStatusChangedEventSchema>;
export type DomainDealPriceChangedEvent = z.infer<typeof DomainDealPriceChangedEventSchema>;
export type DomainDealAmendedEvent = z.infer<typeof DomainDealAmendedEventSchema>;

/** Domain event type literals (same vocabulary as wire `DealEvent`). */
export const DOMAIN_DEAL_EVENT_TYPES = [
  'DEAL_CREATED',
  'DEAL_STATUS_CHANGED',
  'DEAL_PRICE_CHANGED',
  'DEAL_AMENDED',
] as const;

export type DomainDealEventType = (typeof DOMAIN_DEAL_EVENT_TYPES)[number];
