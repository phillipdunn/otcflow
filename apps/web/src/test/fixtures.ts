import type { Deal } from '@otcflow/shared';

export function makeDeal(overrides: Partial<Deal> = {}): Deal {
  const now = '2025-05-19T12:00:00.000Z';
  return {
    id: 'deal-web-001',
    product: 'IRS',
    counterparty: 'Barclays',
    notional: 25_000_000,
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

export function makeAuditEvent(overrides: Partial<import('@otcflow/shared').AuditEvent> = {}) {
  return {
    id: 'audit-web-001',
    dealId: 'deal-web-001',
    type: 'DEAL_CREATED' as const,
    timestamp: '2025-05-19T12:00:00.000Z',
    user: { id: 'user-broker-01', name: 'M. Okonkwo', role: 'BROKER' as const },
    summary: 'Trade created with status NEW',
    previousValue: null,
    newValue: 'NEW',
    version: 1,
    ...overrides,
  };
}
