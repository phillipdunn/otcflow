import { z } from 'zod';
import { UserSchema } from './user.js';

/**
 * Immutable append-only record of an action on a deal.
 * Distinct from {@link DealEvent}: WebSocket messages carry the latest deal snapshot;
 * audit rows are the compliance-oriented history trail.
 */
export const AUDIT_EVENT_TYPE_VALUES = [
  'DEAL_CREATED',
  'DEAL_STATUS_CHANGED',
  'DEAL_AMENDED',
  'DEAL_PRICE_CHANGED',
] as const;

export const AuditEventTypeSchema = z.enum(AUDIT_EVENT_TYPE_VALUES);
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

export const AuditEventSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  type: AuditEventTypeSchema,
  /** ISO 8601 — when the action occurred (server clock). */
  timestamp: z.string(),
  /** Actor at time of event (snapshot from `req.currentUser`). */
  user: UserSchema,
  summary: z.string(),
  previousValue: z.string().nullable(),
  newValue: z.string().nullable(),
  /** Deal `version` after this action. */
  version: z.number().int().nonnegative(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const AuditEventsArraySchema = z.array(AuditEventSchema);
