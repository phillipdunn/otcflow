import { describe, expect, test } from 'vitest';
import { DealSchema } from './deal.js';
import { AuditEventSchema } from './auditEvent.js';
import { DealEventSchema } from './dealEvents.js';
import { UserSchema } from './user.js';

const validDeal = {
  id: 'deal-001',
  product: 'IRS' as const,
  counterparty: 'Counterparty A',
  notional: 1_000_000,
  currency: 'USD' as const,
  price: 3.25,
  status: 'NEW' as const,
  trader: 'Trader One',
  broker: 'Broker One',
  createdAt: '2025-06-01T10:00:00.000Z',
  updatedAt: '2025-06-01T10:00:00.000Z',
  version: 1,
};

const validUser = {
  id: 'user-001',
  name: 'Alex Example',
  role: 'TRADER' as const,
};

describe('DealSchema', () => {
  test('parses a valid deal', () => {
    expect(DealSchema.parse(validDeal)).toEqual(validDeal);
  });

  test('rejects invalid product and non-positive notional', () => {
    expect(() => DealSchema.parse({ ...validDeal, product: 'SWAP' })).toThrow();
    expect(() => DealSchema.parse({ ...validDeal, notional: 0 })).toThrow();
  });
});

describe('UserSchema', () => {
  test('parses a valid user', () => {
    expect(UserSchema.parse(validUser)).toEqual(validUser);
  });

  test('rejects unknown role', () => {
    expect(() => UserSchema.parse({ ...validUser, role: 'ADMIN' })).toThrow();
  });
});

describe('AuditEventSchema', () => {
  const validAudit = {
    id: 'audit-001',
    dealId: 'deal-001',
    type: 'DEAL_CREATED' as const,
    timestamp: '2025-06-01T10:00:00.000Z',
    user: validUser,
    summary: 'Trade created',
    previousValue: null,
    newValue: 'NEW',
    version: 1,
  };

  test('parses a valid audit event', () => {
    expect(AuditEventSchema.parse(validAudit)).toEqual(validAudit);
  });

  test('rejects invalid audit type', () => {
    expect(() => AuditEventSchema.parse({ ...validAudit, type: 'DEAL_DELETED' })).toThrow();
  });
});

describe('DealEventSchema', () => {
  const validDealEvent = {
    type: 'DEAL_CREATED' as const,
    sequenceNumber: 1,
    deal: validDeal,
  };

  test('parses a valid wire deal event', () => {
    expect(DealEventSchema.parse(validDealEvent)).toEqual(validDealEvent);
  });

  test('rejects zero sequence number and unknown event type', () => {
    expect(() => DealEventSchema.parse({ ...validDealEvent, sequenceNumber: 0 })).toThrow();
    expect(() =>
      DealEventSchema.parse({ ...validDealEvent, type: 'DEAL_REMOVED' })
    ).toThrow();
  });
});
