import type { AuditEvent, Deal, User } from '@otcflow/shared';
import type { Prisma } from '@prisma/client';
import * as auditRepo from '../repositories/audit.repository.js';
import * as dealRepo from '../repositories/deal.repository.js';
import { HttpError } from '../middleware/error.middleware.js';

export async function appendAuditEvent(
  input: auditRepo.CreateAuditInput,
  tx?: Prisma.TransactionClient
): Promise<AuditEvent> {
  return auditRepo.insertAuditEvent(input, tx);
}

export async function recordDealCreated(
  deal: Deal,
  user: User,
  tx?: Prisma.TransactionClient
): Promise<AuditEvent> {
  return appendAuditEvent(auditRepo.buildDealCreatedAuditInput(deal, user), tx);
}

export async function recordDealStatusChanged(
  deal: Deal,
  user: User,
  previousStatus: string,
  newStatus: string,
  tx?: Prisma.TransactionClient
): Promise<AuditEvent> {
  return appendAuditEvent(
    {
      deal,
      type: 'DEAL_STATUS_CHANGED',
      user,
      summary: `Status changed from ${previousStatus} to ${newStatus}`,
      previousValue: previousStatus,
      newValue: newStatus,
    },
    tx
  );
}

export async function recordDealPriceChanged(
  deal: Deal,
  user: User,
  previousPrice: string,
  newPrice: string,
  tx?: Prisma.TransactionClient
): Promise<AuditEvent> {
  return appendAuditEvent(
    {
      deal,
      type: 'DEAL_PRICE_CHANGED',
      user,
      summary: `Price changed from ${previousPrice} to ${newPrice}`,
      previousValue: previousPrice,
      newValue: newPrice,
    },
    tx
  );
}

export async function recordDealAmended(
  deal: Deal,
  user: User,
  fieldLabel: string,
  previousValue: string,
  newValue: string,
  tx?: Prisma.TransactionClient
): Promise<AuditEvent> {
  return appendAuditEvent(
    {
      deal,
      type: 'DEAL_AMENDED',
      user,
      summary: `${fieldLabel} amended from ${previousValue} to ${newValue}`,
      previousValue,
      newValue,
    },
    tx
  );
}

export async function listDealAuditEvents(dealId: string): Promise<AuditEvent[]> {
  const deal = await dealRepo.findDealById(dealId);
  if (!deal) {
    throw new HttpError(404, 'Deal not found');
  }
  return auditRepo.listAuditEventsForDealNewestFirst(dealId);
}

export async function clearAllAuditEvents(tx?: Prisma.TransactionClient): Promise<void> {
  await auditRepo.deleteAllAuditEvents(tx);
}

export async function seedAuditCreatedEventsFromDeals(
  deals: Deal[],
  user: User,
  tx?: Prisma.TransactionClient
): Promise<void> {
  await auditRepo.createManyAuditEvents(
    deals.map((deal) => auditRepo.buildDealCreatedAuditInput(deal, user)),
    tx
  );
}
