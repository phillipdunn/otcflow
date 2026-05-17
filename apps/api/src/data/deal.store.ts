import { DealsArraySchema, type Deal } from '@otcflow/shared';
import { seedAuditCreatedEventsFromDeals } from '../services/audit.service.js';

/**
 * Initial rows for the in-memory API store (validated like production payloads).
 * Kept in the API package so the web mock and API seed can diverge later.
 */
const SEED_DEALS = DealsArraySchema.parse([
  {
    id: 'api-seed-01',
    product: 'IRS',
    counterparty: 'Northbridge Asset Mgmt',
    notional: 50_000_000,
    currency: 'USD',
    price: 3.8425,
    status: 'MATCHED',
    trader: 'A. Chen',
    broker: 'M. Okonkwo',
    createdAt: '2026-05-12T09:00:00.000Z',
    updatedAt: '2026-05-12T14:22:00.000Z',
    version: 3,
  },
  {
    id: 'api-seed-02',
    product: 'CDS',
    counterparty: 'Helvetia Capital',
    notional: 25_000_000,
    currency: 'EUR',
    price: 48.5,
    status: 'PENDING',
    trader: 'J. Rivera',
    broker: 'S. Patel',
    createdAt: '2026-05-12T11:00:00.000Z',
    updatedAt: '2026-05-12T13:55:00.000Z',
    version: 2,
  },
  {
    id: 'api-seed-03',
    product: 'FX_OPTION',
    counterparty: 'Tokyo Star Bank',
    notional: 12_000_000,
    currency: 'USD',
    price: 0.4215,
    status: 'BOOKED',
    trader: 'K. Yamada',
    broker: 'L. Foster',
    createdAt: '2026-05-10T10:00:00.000Z',
    updatedAt: '2026-05-11T16:40:00.000Z',
    version: 5,
  },
  {
    id: 'api-seed-04',
    product: 'OIS',
    counterparty: 'Crescent Pension',
    notional: 80_000_000,
    currency: 'GBP',
    price: 4.0225,
    status: 'NEW',
    trader: 'P. Hughes',
    broker: 'L. Foster',
    createdAt: '2026-05-12T11:15:00.000Z',
    updatedAt: '2026-05-12T11:15:00.000Z',
    version: 1,
  },
  {
    id: 'api-seed-05',
    product: 'CDX',
    counterparty: 'Northbridge Asset Mgmt',
    notional: 100_000_000,
    currency: 'USD',
    price: 58.75,
    status: 'PENDING',
    trader: 'A. Chen',
    broker: 'M. Okonkwo',
    createdAt: '2026-05-12T07:00:00.000Z',
    updatedAt: '2026-05-12T15:00:00.000Z',
    version: 2,
  },
  {
    id: 'api-seed-06',
    product: 'BOND',
    counterparty: 'Limehouse Trading',
    notional: 12_000_000,
    currency: 'GBP',
    price: 98.625,
    status: 'MATCHED',
    trader: 'P. Hughes',
    broker: 'L. Foster',
    createdAt: '2026-05-12T13:00:00.000Z',
    updatedAt: '2026-05-12T14:05:00.000Z',
    version: 2,
  },
  {
    id: 'api-seed-07',
    product: 'FX_SWAP',
    counterparty: 'Baltic Reinsurance',
    notional: 45_000_000,
    currency: 'USD',
    price: 0.125,
    status: 'MATCHED',
    trader: 'A. Chen',
    broker: 'S. Patel',
    createdAt: '2026-05-11T14:00:00.000Z',
    updatedAt: '2026-05-12T09:45:00.000Z',
    version: 3,
  },
  {
    id: 'api-seed-08',
    product: 'EQUITY_OPTION',
    counterparty: 'Helvetia Capital',
    notional: 9_000_000,
    currency: 'EUR',
    price: 8.9025,
    status: 'MATCHED',
    trader: 'J. Rivera',
    broker: 'M. Okonkwo',
    createdAt: '2026-05-11T16:00:00.000Z',
    updatedAt: '2026-05-12T10:10:00.000Z',
    version: 3,
  },
]);

/** In-memory deal table (process-local; resets on restart). */
export class DealStore {
  private deals: Deal[];

  constructor(initial: Deal[] = SEED_DEALS) {
    this.deals = [...initial];
  }

  getAll(): Deal[] {
    // shallow copy of deals returned to avoid accidental mutation 
    return [...this.deals];
  }

  getById(id: string): Deal | undefined {
    return this.deals.find((deal) => deal.id === id);
  }

  insert(deal: Deal): void {
    this.deals.push(deal);
  }

  /** Replace a deal with the same `id`, or no-op if missing. */
  replace(updated: Deal): boolean {
    const index = this.deals.findIndex((deal) => deal.id === updated.id);
    if (index === -1) return false;
    this.deals[index] = updated;
    return true;
  }
}

export const dealStore = new DealStore();

seedAuditCreatedEventsFromDeals(dealStore.getAll());
