import { randomUUID } from 'node:crypto';
import {
  CURRENCY_VALUES,
  PRODUCT_TYPE_VALUES,
  type Deal,
  type DealStatus,
  type ProductType,
} from '@otcflow/shared';

const COUNTERPARTIES = [
  'Northbridge Asset Mgmt',
  'Helvetia Capital',
  'Tokyo Star Bank',
  'Crescent Pension',
  'Limehouse Trading',
  'Baltic Reinsurance',
  'Meridian Macro Fund',
  'Atlas Structured Credit',
  'Pacific Rim Securities',
  'Sterling Grove LLP',
  'Vanguard Street Partners',
  'Orion Fixed Income',
  'Summit Re Ltd',
  'Harbour View Capital',
  'Granite Hill Trading',
];

const TRADERS = [
  'A. Chen',
  'J. Rivera',
  'K. Yamada',
  'P. Hughes',
  'M. Sato',
  'E. Walsh',
  'R. Okada',
  'T. Brennan',
  'L. Kim',
  'N. Osei',
];

const BROKERS = ['M. Okonkwo', 'S. Patel', 'L. Foster', 'C. Dubois', 'H. Nielsen', 'F. Rossi'];

/** Weighted pick — earlier entries more common. */
function pick<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * Math.random() * items.length);
  return items[Math.min(index, items.length - 1)]!;
}

function pickStatus(): DealStatus {
  const roll = Math.random();
  if (roll < 0.22) return 'NEW';
  if (roll < 0.45) return 'PENDING';
  if (roll < 0.72) return 'MATCHED';
  if (roll < 0.88) return 'BOOKED';
  return 'CANCELLED';
}

function priceForProduct(product: ProductType): number {
  switch (product) {
    case 'IRS':
    case 'OIS':
      return round(2 + Math.random() * 3.5, 4);
    case 'CDS':
    case 'CDX':
      return round(20 + Math.random() * 80, 2);
    case 'FX_OPTION':
    case 'FX_SWAP':
    case 'FX_NDF':
      return round(0.05 + Math.random() * 1.2, 4);
    case 'BOND':
      return round(92 + Math.random() * 8, 3);
    case 'EQUITY_OPTION':
    case 'EQUITY_SWAP':
      return round(1 + Math.random() * 25, 4);
    default:
      return round(1 + Math.random() * 10, 4);
  }
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function randomNotional(): number {
  const tiers = [500_000, 2_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000];
  const base = pick(tiers);
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.round(base * jitter);
}

function randomPastIso(maxDaysAgo: number): string {
  const ms = Date.now() - Math.floor(Math.random() * maxDaysAgo * 86_400_000);
  return new Date(ms).toISOString();
}

export function generateDeal(partial?: Partial<Deal>): Deal {
  const product = partial?.product ?? pick(PRODUCT_TYPE_VALUES);
  const createdAt = partial?.createdAt ?? randomPastIso(14);
  const updatedAt = partial?.updatedAt ?? createdAt;
  const version = partial?.version ?? 1 + Math.floor(Math.random() * 4);

  return {
    id: partial?.id ?? randomUUID(),
    product,
    counterparty: partial?.counterparty ?? pick(COUNTERPARTIES),
    notional: partial?.notional ?? randomNotional(),
    currency: partial?.currency ?? pick(CURRENCY_VALUES),
    price: partial?.price ?? priceForProduct(product),
    status: partial?.status ?? pickStatus(),
    trader: partial?.trader ?? pick(TRADERS),
    broker: partial?.broker ?? pick(BROKERS),
    createdAt,
    updatedAt,
    version,
  };
}

export function generateDeals(count: number): Deal[] {
  const deals: Deal[] = [];
  for (let i = 0; i < count; i++) {
    deals.push(generateDeal());
  }
  return deals;
}

export function pickRandomDealIndex(dealCount: number): number {
  return Math.floor(Math.random() * dealCount);
}

export function nextStatus(current: DealStatus): DealStatus {
  const transitions: Record<DealStatus, DealStatus[]> = {
    NEW: ['PENDING', 'CANCELLED'],
    PENDING: ['MATCHED', 'CANCELLED', 'NEW'],
    MATCHED: ['BOOKED', 'PENDING', 'CANCELLED'],
    BOOKED: ['MATCHED'],
    CANCELLED: ['NEW', 'PENDING'],
  };
  const options = transitions[current];
  return pick(options);
}

export function jitterPrice(product: ProductType, current: number): number {
  const pct = 0.002 + Math.random() * 0.015;
  const direction = Math.random() < 0.5 ? -1 : 1;
  const next = current * (1 + direction * pct);
  const decimals = product === 'BOND' || product === 'CDS' || product === 'CDX' ? 2 : 4;
  return round(Math.max(0.0001, next), decimals);
}

export type AmendableField = 'counterparty' | 'trader' | 'broker' | 'notional';

export function pickAmendField(): AmendableField {
  const fields: AmendableField[] = ['counterparty', 'trader', 'broker', 'notional'];
  return pick(fields);
}

export function amendValue(field: AmendableField, deal: Deal): string | number {
  switch (field) {
    case 'counterparty':
      return pick(COUNTERPARTIES);
    case 'trader':
      return pick(TRADERS);
    case 'broker':
      return pick(BROKERS);
    case 'notional':
      return randomNotional();
    default:
      return deal.notional;
  }
}

export function fieldLabel(field: AmendableField): string {
  switch (field) {
    case 'counterparty':
      return 'Counterparty';
    case 'trader':
      return 'Trader';
    case 'broker':
      return 'Broker';
    case 'notional':
      return 'Notional';
    default:
      return field;
  }
}

export function formatAuditValue(field: AmendableField, value: string | number): string {
  if (field === 'notional' && typeof value === 'number') {
    return value.toLocaleString('en-US');
  }
  return String(value);
}
