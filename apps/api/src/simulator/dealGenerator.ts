import { randomUUID } from 'node:crypto';
import {
  CURRENCY_VALUES,
  PRODUCT_TYPE_VALUES,
  type Deal,
  type DealStatus,
  type ProductType,
} from '@otcflow/shared';

/** OTC desk counterparties — bulge-bracket banks and macro / multi-strat hedge funds. */
const COUNTERPARTIES = [
  // Investment banks (earlier entries skew more common via pick())
  'Goldman Sachs',
  'J.P. Morgan',
  'Morgan Stanley',
  'Barclays',
  'BNP Paribas',
  'Deutsche Bank',
  'Citigroup',
  'Bank of America',
  'UBS',
  'HSBC',
  'Nomura',
  // Hedge funds
  'Citadel',
  'Millennium Management',
  'Point72',
  'Bridgewater Associates',
  'Two Sigma',
  'D. E. Shaw',
  'Marshall Wace',
  'Balyasny Asset Management',
  'Man Group',
  'Elliott Management',
  'Rokos Capital',
  'ExodusPoint Capital',
  'Capula Investment Management',
  'Schonfeld Strategic Advisors',
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

/** Desk quotes: at most 3 sig figs (2 for |price| ≥ 10, e.g. bond clean). */
function roundToSigFigs(n: number, sigFigs: number): number {
  if (!Number.isFinite(n) || n === 0) return n;
  const sign = Math.sign(n);
  const abs = Math.abs(n);
  const power = Math.floor(Math.log10(abs));
  const scale = 10 ** (sigFigs - 1 - power);
  return (sign * Math.round(abs * scale)) / scale;
}

function roundPrice(n: number): number {
  return roundToSigFigs(n, Math.abs(n) >= 10 ? 2 : 3);
}

function priceForProduct(product: ProductType): number {
  let raw: number;
  switch (product) {
    case 'IRS':
    case 'OIS':
      raw = 2 + Math.random() * 3.5;
      break;
    case 'CDS':
    case 'CDX':
      raw = 20 + Math.random() * 80;
      break;
    case 'FX_OPTION':
    case 'FX_SWAP':
    case 'FX_NDF':
      raw = 0.05 + Math.random() * 1.2;
      break;
    case 'BOND':
      raw = 92 + Math.random() * 8;
      break;
    case 'EQUITY_OPTION':
    case 'EQUITY_SWAP':
      raw = 1 + Math.random() * 25;
      break;
    default:
      raw = 1 + Math.random() * 10;
  }
  return roundPrice(raw);
}

function randomNotional(): number {
  /** Desk-style round notionals (USD equivalent; no odd lots). */
  const tiers = [
    1_000_000, 2_000_000, 5_000_000, 10_000_000, 15_000_000, 20_000_000, 25_000_000,
    50_000_000, 75_000_000, 100_000_000, 150_000_000, 200_000_000, 250_000_000,
  ];
  return pick(tiers);
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

export function jitterPrice(_product: ProductType, current: number): number {
  const pct = 0.002 + Math.random() * 0.015;
  const direction = Math.random() < 0.5 ? -1 : 1;
  const next = current * (1 + direction * pct);
  return roundPrice(Math.max(0.0001, next));
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
