import type { AuditEvent, Deal, User } from '@otcflow/shared';
import type { AuditEvent as AuditRow, Deal as DealRow } from '@prisma/client';

export function toDeal(row: DealRow): Deal {
  return {
    id: row.id,
    product: row.product,
    counterparty: row.counterparty,
    notional: Number(row.notional),
    currency: row.currency,
    price: Number(row.price),
    status: row.status,
    trader: row.trader,
    broker: row.broker,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  };
}

export function toAuditEvent(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    dealId: row.dealId,
    type: row.type,
    timestamp: row.timestamp.toISOString(),
    user: {
      id: row.userId,
      name: row.userName,
      role: row.userRole,
    },
    summary: row.summary,
    previousValue: row.previousValue,
    newValue: row.newValue,
    version: row.version,
  };
}

export function toUser(row: { id: string; name: string; role: User['role'] }): User {
  return { id: row.id, name: row.name, role: row.role };
}
