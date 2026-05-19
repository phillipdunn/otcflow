import { randomUUID } from 'node:crypto';
import type { AuditEvent, AuditEventType, Deal, User } from '@otcflow/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { toAuditEvent } from '../db/mappers.js';

export interface CreateAuditInput {
  deal: Deal;
  type: AuditEventType;
  user: User;
  summary: string;
  previousValue: string | null;
  newValue: string | null;
  timestamp?: string;
}

function toAuditCreateData(input: CreateAuditInput): Prisma.AuditEventCreateInput {
  const timestamp = input.timestamp ?? input.deal.updatedAt;
  return {
    id: randomUUID(),
    type: input.type,
    timestamp: new Date(timestamp),
    summary: input.summary,
    previousValue: input.previousValue,
    newValue: input.newValue,
    version: input.deal.version,
    deal: { connect: { id: input.deal.id } },
    user: { connect: { id: input.user.id } },
    userName: input.user.name,
    userRole: input.user.role,
  };
}

export async function insertAuditEvent(
  input: CreateAuditInput,
  tx: Prisma.TransactionClient = prisma
): Promise<AuditEvent> {
  const row = await tx.auditEvent.create({ data: toAuditCreateData(input) });
  return toAuditEvent(row);
}

export async function listAuditEventsForDealNewestFirst(dealId: string): Promise<AuditEvent[]> {
  const rows = await prisma.auditEvent.findMany({
    where: { dealId },
    orderBy: { timestamp: 'desc' },
  });
  return rows.map(toAuditEvent);
}

export async function deleteAllAuditEvents(tx: Prisma.TransactionClient = prisma): Promise<void> {
  await tx.auditEvent.deleteMany();
}

export async function createManyAuditEvents(
  inputs: CreateAuditInput[],
  tx: Prisma.TransactionClient = prisma
): Promise<void> {
  if (inputs.length === 0) return;
  await tx.auditEvent.createMany({
    data: inputs.map((input) => {
      const timestamp = input.timestamp ?? input.deal.updatedAt;
      return {
        id: randomUUID(),
        dealId: input.deal.id,
        type: input.type,
        timestamp: new Date(timestamp),
        userId: input.user.id,
        userName: input.user.name,
        userRole: input.user.role,
        summary: input.summary,
        previousValue: input.previousValue,
        newValue: input.newValue,
        version: input.deal.version,
      };
    }),
  });
}

export function buildDealCreatedAuditInput(deal: Deal, user: User): CreateAuditInput {
  return {
    deal,
    type: 'DEAL_CREATED',
    user,
    summary: `Trade created with status ${deal.status}`,
    previousValue: null,
    newValue: deal.status,
    timestamp: deal.createdAt,
  };
}
