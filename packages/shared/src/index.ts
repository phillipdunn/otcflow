import { z } from 'zod';

export {
  CURRENCY_VALUES,
  CurrencySchema,
  DEAL_STATUS_VALUES,
  DealSchema,
  DealsArraySchema,
  DealStatusSchema,
  PRODUCT_TYPE_VALUES,
  ProductTypeSchema,
  type Currency,
  type Deal,
  type DealStatus,
  type ProductType,
} from './deal.js';

export {
  DealAmendedEventSchema,
  DealCreatedEventSchema,
  DealEventSchema,
  DealPriceChangedEventSchema,
  DealStatusChangedEventSchema,
  type DealAmendedEvent,
  type DealCreatedEvent,
  type DealEvent,
  type DealPriceChangedEvent,
  type DealStatusChangedEvent,
} from './dealEvents.js';

export {
  SIMULATOR_DEAL_COUNT_DEFAULT,
  SIMULATOR_DEAL_COUNT_MAX,
  SIMULATOR_DEAL_COUNT_MIN,
  SIMULATOR_DEFAULT_INTERVAL_MS,
  SimulatorResetBodySchema,
  SimulatorStartBodySchema,
  SimulatorStatusSchema,
  type SimulatorResetBody,
  type SimulatorStartBody,
  type SimulatorStatus,
} from './simulator.js';

export {
  DEFAULT_MOCK_USER_ID,
  MOCK_USERS,
  SIMULATOR_SYSTEM_USER,
  USER_ROLE_VALUES,
  UserRoleSchema,
  UserSchema,
  UsersArraySchema,
  type User,
  type UserRole,
} from './user.js';

export {
  AUDIT_EVENT_TYPE_VALUES,
  AuditEventSchema,
  AuditEventTypeSchema,
  AuditEventsArraySchema,
  type AuditEvent,
  type AuditEventType,
} from './auditEvent.js';

/** Minimal contract used by API + web to prove shared package wiring. */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
