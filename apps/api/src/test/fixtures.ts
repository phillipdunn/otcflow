import type { Deal, User } from '@otcflow/shared';
import { MOCK_USERS } from '@otcflow/shared';

export const testBrokerUser: User = MOCK_USERS.find((u) => u.id === 'user-broker-01')!;
export const testTraderUser: User = MOCK_USERS.find((u) => u.id === 'user-trader-01')!;

export function makeDeal(overrides: Partial<Deal> = {}): Deal {
  const now = '2025-05-19T12:00:00.000Z';
  return {
    id: 'deal-test-001',
    product: 'IRS',
    counterparty: 'Goldman Sachs',
    notional: 10_000_000,
    currency: 'USD',
    price: 3.25,
    status: 'NEW',
    trader: 'A. Chen',
    broker: 'M. Okonkwo',
    createdAt: now,
    updatedAt: now,
    version: 1,
    ...overrides,
  };
}

export const validCreateDealBody = {
  product: 'IRS' as const,
  counterparty: 'JPMorgan',
  notional: 5_000_000,
  currency: 'USD' as const,
  price: 3.5,
  trader: 'A. Chen',
  broker: 'M. Okonkwo',
};
