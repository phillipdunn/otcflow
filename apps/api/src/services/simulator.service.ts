import {
  SIMULATOR_DEAL_COUNT_DEFAULT,
  SIMULATOR_DEAL_COUNT_MAX,
  SIMULATOR_DEFAULT_INTERVAL_MS,
  type Deal,
  type DealEvent,
  type SimulatorStatus,
} from '@otcflow/shared';
import { dealStore } from '../data/deal.store.js';
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
  pickRandomDealIndex,
} from '../simulator/dealGenerator.js';
import {
  clearAllAuditEvents,
  recordDealAmended,
  recordDealCreated,
  recordDealPriceChanged,
  recordDealStatusChanged,
  seedAuditCreatedEventsFromDeals,
} from './audit.service.js';
import { broadcastDealEvent, getLastDealEventSequence, resetDealEventSequence } from '../ws/dealsWs.js';

/** ~1 tick/s; ~35% of ticks are quiet (no event). */
const TICK_SKIP_PROBABILITY = 0.35;

let running = false;
let timer: ReturnType<typeof setInterval> | null = null;
let intervalMs = SIMULATOR_DEFAULT_INTERVAL_MS;
let configuredDealCount = SIMULATOR_DEAL_COUNT_DEFAULT;
let eventsEmitted = 0;
let streamEpoch = 0;

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

function emitCreate(): void {
  if (dealStore.count() >= SIMULATOR_DEAL_COUNT_MAX) return;
  const user = getSimulatorUser();
  const now = new Date().toISOString();
  const deal = generateDeal({ createdAt: now, updatedAt: now, version: 1 });
  dealStore.insert(deal);
  recordDealCreated(deal, user);
  persistAndBroadcast({ type: 'DEAL_CREATED', deal });
}

function emitStatusChange(): void {
  const all = dealStore.getAll();
  if (all.length === 0) return;
  const existing = all[pickRandomDealIndex(all.length)]!;
  const previousStatus = existing.status;
  const newStatus = nextStatus(previousStatus);
  if (newStatus === previousStatus) return;

  const user = getSimulatorUser();
  const updated = bumpDeal(existing, { status: newStatus });
  if (!dealStore.replace(updated)) return;

  recordDealStatusChanged(updated, user, previousStatus, newStatus);
  persistAndBroadcast({ type: 'DEAL_STATUS_CHANGED', deal: updated });
}

function emitPriceChange(): void {
  const all = dealStore.getAll();
  if (all.length === 0) return;
  const existing = all[pickRandomDealIndex(all.length)]!;
  const previousPrice = String(existing.price);
  const newPrice = jitterPrice(existing.product, existing.price);
  if (newPrice === existing.price) return;

  const user = getSimulatorUser();
  const updated = bumpDeal(existing, { price: newPrice });
  if (!dealStore.replace(updated)) return;

  recordDealPriceChanged(updated, user, previousPrice, String(newPrice));
  persistAndBroadcast({ type: 'DEAL_PRICE_CHANGED', deal: updated });
}

function emitAmend(): void {
  const all = dealStore.getAll();
  if (all.length === 0) return;
  const existing = all[pickRandomDealIndex(all.length)]!;
  const field = pickAmendField();
  const nextVal = amendValue(field, existing);
  const prevStr = formatAuditValue(field, existing[field]);
  const nextStr = formatAuditValue(field, nextVal);

  if (prevStr === nextStr) return;

  const user = getSimulatorUser();
  const updated = bumpDeal(existing, { [field]: nextVal } as Partial<Deal>);
  if (!dealStore.replace(updated)) return;

  recordDealAmended(updated, user, fieldLabel(field), prevStr, nextStr);
  persistAndBroadcast({ type: 'DEAL_AMENDED', deal: updated });
}

function tick(): void {
  if (!running) return;
  if (Math.random() < TICK_SKIP_PROBABILITY) return;

  const roll = Math.random();
  if (roll < 0.12) {
    emitCreate();
  } else if (roll < 0.47) {
    emitStatusChange();
  } else if (roll < 0.77) {
    emitPriceChange();
  } else {
    emitAmend();
  }
}

export function getSimulatorStatus(): SimulatorStatus {
  return {
    running,
    dealCount: dealStore.count(),
    configuredDealCount,
    eventsEmitted,
    lastSequenceNumber: getLastDealEventSequence(),
    streamEpoch,
    intervalMs,
  };
}

export function startSimulator(options?: { intervalMs?: number }): SimulatorStatus {
  if (options?.intervalMs !== undefined) {
    intervalMs = options.intervalMs;
  }
  if (running) {
    return getSimulatorStatus();
  }
  running = true;
  timer = setInterval(tick, intervalMs);
  return getSimulatorStatus();
}

export function stopSimulator(): SimulatorStatus {
  running = false;
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  return getSimulatorStatus();
}

export function resetSimulatorData(dealCount = SIMULATOR_DEAL_COUNT_DEFAULT): SimulatorStatus {
  stopSimulator();
  const count = Math.min(Math.max(dealCount, 500), SIMULATOR_DEAL_COUNT_MAX);
  configuredDealCount = count;

  clearAllAuditEvents();
  const deals = generateDeals(count);
  dealStore.replaceAll(deals);
  resetDealEventSequence(0);
  eventsEmitted = 0;
  streamEpoch += 1;

  const simulatorUser = getSimulatorUser();
  seedAuditCreatedEventsFromDeals(deals, simulatorUser);

  return getSimulatorStatus();
}
