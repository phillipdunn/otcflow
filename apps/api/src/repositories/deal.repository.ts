import type { Deal } from '@otcflow/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { toDeal } from '../db/mappers.js';

export function toDealCreateInput(deal: Deal): Prisma.DealCreateInput {
  return {
    id: deal.id,
    product: deal.product,
    counterparty: deal.counterparty,
    notional: deal.notional,
    currency: deal.currency,
    price: deal.price,
    status: deal.status,
    trader: deal.trader,
    broker: deal.broker,
    createdAt: new Date(deal.createdAt),
    updatedAt: new Date(deal.updatedAt),
    version: deal.version,
  };
}

export async function listDeals(): Promise<Deal[]> {
  const rows = await prisma.deal.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(toDeal);
}

export async function findDealById(id: string): Promise<Deal | null> {
  const row = await prisma.deal.findUnique({ where: { id } });
  return row ? toDeal(row) : null;
}

export async function countDeals(): Promise<number> {
  return prisma.deal.count();
}

export async function insertDeal(deal: Deal, tx: Prisma.TransactionClient = prisma): Promise<Deal> {
  const row = await tx.deal.create({ data: toDealCreateInput(deal) });
  return toDeal(row);
}

export async function updateDeal(deal: Deal, tx: Prisma.TransactionClient = prisma): Promise<Deal> {
  const row = await tx.deal.update({
    where: { id: deal.id },
    data: {
      product: deal.product,
      counterparty: deal.counterparty,
      notional: deal.notional,
      currency: deal.currency,
      price: deal.price,
      status: deal.status,
      trader: deal.trader,
      broker: deal.broker,
      updatedAt: new Date(deal.updatedAt),
      version: deal.version,
    },
  });
  return toDeal(row);
}

export async function deleteAllDeals(tx: Prisma.TransactionClient = prisma): Promise<void> {
  await tx.deal.deleteMany();
}

export async function createManyDeals(
  deals: Deal[],
  tx: Prisma.TransactionClient = prisma
): Promise<void> {
  if (deals.length === 0) return;
  await tx.deal.createMany({
    data: deals.map((d) => ({
      id: d.id,
      product: d.product,
      counterparty: d.counterparty,
      notional: d.notional,
      currency: d.currency,
      price: d.price,
      status: d.status,
      trader: d.trader,
      broker: d.broker,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
      version: d.version,
    })),
  });
}

/** Random deal id for simulator ticks (PostgreSQL random row). */
export async function findRandomDealId(): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Deal" ORDER BY RANDOM() LIMIT 1
  `;
  return rows[0]?.id ?? null;
}
