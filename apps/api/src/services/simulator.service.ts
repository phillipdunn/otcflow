import {
  SIMULATOR_DEAL_COUNT_DEFAULT,
  SIMULATOR_DEAL_COUNT_MAX,
  SIMULATOR_DEFAULT_INTERVAL_MS,
  type Deal,
  type DealEvent,
  type SimulatorStatus,
} from '@otcflow/shared';
import { prisma } from '../db/prisma.js';
import { getSimulatorUser } from '../data/user.store.js';
import {
  amendValue,
  fieldLabel,
  formatAuditValue,
  generateDeal,
  generateDeals,
  jitterPrice,
  nextStatus,
  pickAmendField,
} from '../simulator/dealGenerator.js';
import * as auditService from './audit.service.js';
import * as dealRepo from '../repositories/deal.repository.js';
import { broadcastDealEvent, getLastDealEventSequence, resetDealEventSequence } from '../ws/dealsWs.js';

/** ~1 tick/s; ~35% of ticks are quiet (no event). */
const TICK_SKIP_PROBABILITY = 0.35;

let running = false;
let timer: ReturnType<typeof setInterval> | null = null;
let intervalMs = SIMULATOR_DEFAULT_INTERVAL_MS;
let configuredDealCount = SIMULATOR_DEAL_COUNT_DEFAULT;
let eventsEmitted = 0;
let streamEpoch = 0;
let tickInFlight = false;

function bumpDeal(deal: Deal, patch: Partial<Deal>): Deal {
  return {
    ...deal,
    ...patch,
    version: deal.version + 1,
    updatedAt: new Date().toISOString(),
  };
}

function persistAndBroadcast(event: Omit<DealEvent, 'sequenceNumber'>): void {
  broadcastDealEvent(event);
  eventsEmitted += 1;
}

async function emitCreate(): Promise<void> {
  if ((await dealRepo.countDeals()) >= SIMULATOR_DEAL_COUNT_MAX) return;
  const user = getSimulatorUser();
  const now = new Date().toISOString();
  const deal = generateDeal({ createdAt: now, updatedAt: now, version: 1 });

  const persisted = await prisma.$transaction(async (tx) => {
    const row = await dealRepo.insertDeal(deal, tx);
    await auditService.recordDealCreated(row, user, tx);
    return row;
  });

  persistAndBroadcast({ type: 'DEAL_CREATED', deal: persisted });
}

async function emitStatusChange(): Promise<void> {
  const id = await dealRepo.findRandomDealId();
  if (!id) return;
  const existing = await dealRepo.findDealById(id);
  if (!existing) return;

  const previousStatus = existing.status;
  const newStatus = nextStatus(previousStatus);
  if (newStatus === previousStatus) return;

  const user = getSimulatorUser();
  const updated = bumpDeal(existing, { status: newStatus });

  const persisted = await prisma.$transaction(async (tx) => {
    const row = await dealRepo.updateDeal(updated, tx);
    await auditService.recordDealStatusChanged(row, user, previousStatus, newStatus, tx);
    return row;
  });

  persistAndBroadcast({ type: 'DEAL_STATUS_CHANGED', deal: persisted });
}

async function emitPriceChange(): Promise<void> {
  const id = await dealRepo.findRandomDealId();
  if (!id) return;
  const existing = await dealRepo.findDealById(id);
  if (!existing) return;

  const previousPrice = String(existing.price);
  const newPrice = jitterPrice(existing.product, existing.price);
  if (newPrice === existing.price) return;

  const user = getSimulatorUser();
  const updated = bumpDeal(existing, { price: newPrice });

  const persisted = await prisma.$transaction(async (tx) => {
    const row = await dealRepo.updateDeal(updated, tx);
    await auditService.recordDealPriceChanged(row, user, previousPrice, String(newPrice), tx);
    return row;
  });

  persistAndBroadcast({ type: 'DEAL_PRICE_CHANGED', deal: persisted });
}

async function emitAmend(): Promise<void> {
  const id = await dealRepo.findRandomDealId();
  if (!id) return;
  const existing = await dealRepo.findDealById(id);
  if (!existing) return;

  const field = pickAmendField();
  const nextVal = amendValue(field, existing);
  const prevStr = formatAuditValue(field, existing[field]);
  const nextStr = formatAuditValue(field, nextVal);
  if (prevStr === nextStr) return;

  const user = getSimulatorUser();
  const updated = bumpDeal(existing, { [field]: nextVal } as Partial<Deal>);

  const persisted = await prisma.$transaction(async (tx) => {
    const row = await dealRepo.updateDeal(updated, tx);
    await auditService.recordDealAmended(row, user, fieldLabel(field), prevStr, nextStr, tx);
    return row;
  });

  persistAndBroadcast({ type: 'DEAL_AMENDED', deal: persisted });
}

async function tickAsync(): Promise<void> {
  if (!running || tickInFlight) return;
  tickInFlight = true;
  try {
    if (Math.random() < TICK_SKIP_PROBABILITY) return;

    const roll = Math.random();
    if (roll < 0.12) {
      await emitCreate();
    } else if (roll < 0.47) {
      await emitStatusChange();
    } else if (roll < 0.77) {
      await emitPriceChange();
    } else {
      await emitAmend();
    }
  } finally {
    tickInFlight = false;
  }
}

function tick(): void {
  void tickAsync().catch((err) => console.error('Simulator tick failed:', err));
}

export async function getSimulatorStatus(): Promise<SimulatorStatus> {
  return {
    running,
    dealCount: await dealRepo.countDeals(),
    configuredDealCount,
    eventsEmitted,
    lastSequenceNumber: getLastDealEventSequence(),
    streamEpoch,
    intervalMs,
  };
}

export async function startSimulator(options?: { intervalMs?: number }): Promise<SimulatorStatus> {
  if (options?.intervalMs !== undefined) {
    intervalMs = options.intervalMs;
  }
  if (!running) {
    running = true;
    timer = setInterval(tick, intervalMs);
  }
  return getSimulatorStatus();
}

export async function stopSimulator(): Promise<SimulatorStatus> {
  running = false;
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  return getSimulatorStatus();
}

export async function resetSimulatorData(dealCount = SIMULATOR_DEAL_COUNT_DEFAULT): Promise<SimulatorStatus> {
  await stopSimulator();
  const count = Math.min(Math.max(dealCount, 500), SIMULATOR_DEAL_COUNT_MAX);
  configuredDealCount = count;

  const deals = generateDeals(count);
  const simulatorUser = getSimulatorUser();

  await prisma.$transaction(async (tx) => {
    await auditService.clearAllAuditEvents(tx);
    await dealRepo.deleteAllDeals(tx);
    await dealRepo.createManyDeals(deals, tx);
    await auditService.seedAuditCreatedEventsFromDeals(deals, simulatorUser, tx);
  });

  resetDealEventSequence(0);
  eventsEmitted = 0;
  streamEpoch += 1;

  return getSimulatorStatus();
}
