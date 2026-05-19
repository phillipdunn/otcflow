/**
 * Seed Postgres with demo users and a realistic starter book.
 * Run: npm run db:seed -w @otcflow/api
 */
import '../src/loadEnv.js';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { SIMULATOR_SYSTEM_USER } from '@otcflow/shared';
import { generateDeals } from '../src/simulator/dealGenerator.js';
import { buildDealCreatedAuditInput } from '../src/repositories/audit.repository.js';
import { seedUsersIfEmpty } from '../src/repositories/user.repository.js';

const SEED_DEAL_COUNT = 100;

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedUsersIfEmpty();

  const existingDeals = await prisma.deal.count();
  if (existingDeals > 0) {
    console.log(`Skip deal seed — ${existingDeals} deals already in database.`);
    return;
  }

  const simulatorUser =
    (await prisma.user.findUnique({ where: { id: SIMULATOR_SYSTEM_USER.id } })) ??
    (await prisma.user.create({
      data: {
        id: SIMULATOR_SYSTEM_USER.id,
        name: SIMULATOR_SYSTEM_USER.name,
        role: SIMULATOR_SYSTEM_USER.role,
      },
    }));

  const deals = generateDeals(SEED_DEAL_COUNT);

  await prisma.$transaction(async (tx) => {
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

    await tx.auditEvent.createMany({
      data: deals.map((deal) => {
        const input = buildDealCreatedAuditInput(deal, {
          id: simulatorUser.id,
          name: simulatorUser.name,
          role: simulatorUser.role,
        });
        return {
          id: randomUUID(),
          dealId: deal.id,
          type: input.type,
          timestamp: new Date(input.timestamp ?? deal.createdAt),
          userId: simulatorUser.id,
          userName: simulatorUser.name,
          userRole: simulatorUser.role,
          summary: input.summary,
          previousValue: input.previousValue,
          newValue: input.newValue,
          version: deal.version,
        };
      }),
    });
  });

  console.log(`Seeded ${SEED_DEAL_COUNT} deals + audit rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
