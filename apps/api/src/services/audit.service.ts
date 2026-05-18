import { randomUUID } from 'node:crypto';
import type { AuditEvent, AuditEventType, Deal, User } from '@otcflow/shared';
import { auditEventStore } from '../data/audit.store.js';
import { dealStore } from '../data/deal.store.js';
import { getDefaultUser } from '../data/user.store.js';
import { HttpError } from '../middleware/error.middleware.js';

export interface AppendAuditInput {
  deal: Deal;
  type: AuditEventType;
  user: User;
  summary: string;
  previousValue: string | null;
  newValue: string | null;
  timestamp?: string;
}

function toAuditUser(user: User): AuditEvent['user'] {
  return { id: user.id, name: user.name, role: user.role };
}

export function appendAuditEvent(input: AppendAuditInput): AuditEvent {
  const event: AuditEvent = {
    id: randomUUID(),
    dealId: input.deal.id,
    type: input.type,
    timestamp: input.timestamp ?? input.deal.updatedAt,
    user: toAuditUser(input.user),
    summary: input.summary,
    previousValue: input.previousValue,
    newValue: input.newValue,
    version: input.deal.version,
  };
  auditEventStore.append(event);
  return event;
}

export function recordDealCreated(deal: Deal, user: User): AuditEvent {
  return appendAuditEvent({
    deal,
    type: 'DEAL_CREATED',
    user,
    summary: `Trade created with status ${deal.status}`,
    previousValue: null,
    newValue: deal.status,
    timestamp: deal.createdAt,
  });
}

export function recordDealStatusChanged(
  deal: Deal,
  user: User,
  previousStatus: string,
  newStatus: string
): AuditEvent {
  return appendAuditEvent({
    deal,
    type: 'DEAL_STATUS_CHANGED',
    user,
    summary: `Status changed from ${previousStatus} to ${newStatus}`,
    previousValue: previousStatus,
    newValue: newStatus,
  });
}

export function listDealAuditEvents(dealId: string): AuditEvent[] {
  if (!dealStore.getById(dealId)) {
    throw new HttpError(404, 'Deal not found');
  }
  return auditEventStore.getForDealNewestFirst(dealId);
}

/** Synthetic `DEAL_CREATED` per seed deal so existing rows have a trail after restart. */
export function recordDealPriceChanged(
  deal: Deal,
  user: User,
  previousPrice: string,
  newPrice: string
): AuditEvent {
  return appendAuditEvent({
    deal,
    type: 'DEAL_PRICE_CHANGED',
    user,
    summary: `Price changed from ${previousPrice} to ${newPrice}`,
    previousValue: previousPrice,
    newValue: newPrice,
  });
}

export function recordDealAmended(
  deal: Deal,
  user: User,
  fieldLabel: string,
  previousValue: string,
  newValue: string
): AuditEvent {
  return appendAuditEvent({
    deal,
    type: 'DEAL_AMENDED',
    user,
    summary: `${fieldLabel} amended from ${previousValue} to ${newValue}`,
    previousValue,
    newValue,
  });
}

export function clearAllAuditEvents(): void {
  auditEventStore.clear();
}

export function seedAuditCreatedEventsFromDeals(deals: Deal[], user?: User): void {
  const actor = user ?? getDefaultUser();
  for (const deal of deals) {
    recordDealCreated(deal, actor);
  }
}
