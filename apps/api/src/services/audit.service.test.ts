import { beforeEach, expect, test, vi } from 'vitest';
import * as auditService from './audit.service.js';
import * as auditRepo from '../repositories/audit.repository.js';
import * as dealRepo from '../repositories/deal.repository.js';
import { makeDeal, testBrokerUser, testTraderUser } from '../test/fixtures.js';

vi.mock('../repositories/audit.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/audit.repository.js')>();
  return {
    ...actual,
    insertAuditEvent: vi.fn(actual.insertAuditEvent),
  };
});

beforeEach(() => {
  vi.mocked(auditRepo.insertAuditEvent).mockImplementation(async (input) => {
    const deal = input.deal;
    return {
      id: 'audit-1',
      dealId: deal.id,
      type: input.type,
      timestamp: input.timestamp ?? deal.updatedAt,
      user: input.user,
      summary: input.summary,
      previousValue: input.previousValue,
      newValue: input.newValue,
      version: deal.version,
    };
  });
});

test('recordDealCreated writes DEAL_CREATED audit with acting user and deal version', async () => {
  const deal = makeDeal({ status: 'NEW', version: 1 });

  const event = await auditService.recordDealCreated(deal, testBrokerUser);

  expect(event.type).toBe('DEAL_CREATED');
  expect(event.user).toEqual(testBrokerUser);
  expect(event.version).toBe(1);
  expect(event.summary).toBe('Trade created with status NEW');
  expect(event.previousValue).toBeNull();
  expect(event.newValue).toBe('NEW');
  expect(auditRepo.insertAuditEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'DEAL_CREATED',
      user: testBrokerUser,
      deal,
    }),
    undefined
  );
});

test('recordDealStatusChanged writes status-change audit with previous and new values', async () => {
  const deal = makeDeal({ status: 'PENDING', version: 2 });

  const event = await auditService.recordDealStatusChanged(deal, testTraderUser, 'NEW', 'PENDING');

  expect(event.type).toBe('DEAL_STATUS_CHANGED');
  expect(event.user).toEqual(testTraderUser);
  expect(event.summary).toBe('Status changed from NEW to PENDING');
  expect(event.previousValue).toBe('NEW');
  expect(event.newValue).toBe('PENDING');
  expect(event.version).toBe(2);
});

test('buildDealCreatedAuditInput uses deal.createdAt as the audit timestamp', () => {
  const deal = makeDeal({ createdAt: '2025-01-15T09:30:00.000Z' });

  const input = auditRepo.buildDealCreatedAuditInput(deal, testBrokerUser);

  expect(input.timestamp).toBe('2025-01-15T09:30:00.000Z');
  expect(input.type).toBe('DEAL_CREATED');
  expect(input.user.id).toBe(testBrokerUser.id);
});

test('listDealAuditEvents throws 404 when the deal does not exist', async () => {
  vi.spyOn(dealRepo, 'findDealById').mockResolvedValue(null);

  await expect(auditService.listDealAuditEvents('missing-deal')).rejects.toMatchObject({
    statusCode: 404,
    message: 'Deal not found',
  });
});
