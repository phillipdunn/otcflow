import { randomUUID } from 'node:crypto';
import type { Deal, DealStatus, User } from '@otcflow/shared';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../middleware/error.middleware.js';
import type { CreateDealBody } from '../validation/deal.validation.js';
import * as auditService from './audit.service.js';
import * as dealRepo from '../repositories/deal.repository.js';
import { dealEventBus } from '../events/dealEventBus.js';

export async function listDeals(): Promise<Deal[]> {
  return dealRepo.listDeals();
}

export async function getDealById(id: string): Promise<Deal> {
  const deal = await dealRepo.findDealById(id);
  if (!deal) {
    throw new HttpError(404, 'Deal not found');
  }
  return deal;
}

export async function createDeal(body: CreateDealBody, user: User): Promise<Deal> {
  const now = new Date().toISOString();
  const status: DealStatus = body.status ?? 'NEW';
  const deal: Deal = {
    id: randomUUID(),
    product: body.product,
    counterparty: body.counterparty,
    notional: body.notional,
    currency: body.currency,
    price: body.price,
    status,
    trader: body.trader,
    broker: body.broker,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const persisted = await prisma.$transaction(async (tx) => {
    const row = await dealRepo.insertDeal(deal, tx);
    await auditService.recordDealCreated(row, user, tx);
    return row;
  });

  dealEventBus.publish({ type: 'DEAL_CREATED', deal: persisted });
  return persisted;
}

export async function updateDealStatus(id: string, status: DealStatus, user: User): Promise<Deal> {
  const existing = await dealRepo.findDealById(id);
  if (!existing) {
    throw new HttpError(404, 'Deal not found');
  }
  const previousStatus = existing.status;
  const updated: Deal = {
    ...existing,
    status,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  const persisted = await prisma.$transaction(async (tx) => {
    const row = await dealRepo.updateDeal(updated, tx);
    await auditService.recordDealStatusChanged(row, user, previousStatus, status, tx);
    return row;
  });

  dealEventBus.publish({ type: 'DEAL_STATUS_CHANGED', deal: persisted });
  return persisted;
}
