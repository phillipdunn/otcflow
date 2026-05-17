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
  DealCreatedEventSchema,
  DealEventSchema,
  DealStatusChangedEventSchema,
  type DealCreatedEvent,
  type DealEvent,
  type DealStatusChangedEvent,
} from './dealEvents.js';

export {
  DEFAULT_MOCK_USER_ID,
  MOCK_USERS,
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
