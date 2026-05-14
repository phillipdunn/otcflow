import { randomUUID } from 'node:crypto';
import type { Deal, DealStatus } from '@otcflow/shared';
import { dealStore } from '../data/deal.store.js';
import { HttpError } from '../middleware/error.middleware.js';
import type { CreateDealBody } from '../validation/deal.validation.js';
import { broadcastDealEvent } from '../ws/dealsWs.js';

export function listDeals(): Deal[] {
  return dealStore.getAll();
}

export function getDealById(id: string): Deal {
  const deal = dealStore.getById(id);
  if (!deal) {
    throw new HttpError(404, 'Deal not found');
  }
  return deal;
}

export function createDeal(body: CreateDealBody): Deal {
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
  dealStore.insert(deal);
  broadcastDealEvent({ type: 'DEAL_CREATED', deal });
  return deal;
}

export function updateDealStatus(id: string, status: DealStatus): Deal {
  const existing = dealStore.getById(id);
  if (!existing) {
    throw new HttpError(404, 'Deal not found');
  }
  const updated: Deal = {
    ...existing,
    status,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };
  const ok = dealStore.replace(updated);
  if (!ok) {
    throw new HttpError(500, 'Failed to persist deal');
  }
  broadcastDealEvent({ type: 'DEAL_STATUS_CHANGED', deal: updated });
  return updated;
}
