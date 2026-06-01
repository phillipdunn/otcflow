import { beforeEach, expect, test, vi } from 'vitest';
import { HttpError } from '../middleware/error.middleware.js';
import * as auditService from './audit.service.js';
import * as dealRepo from '../repositories/deal.repository.js';
import { prisma } from '../db/prisma.js';
import { dealEventBus } from '../events/dealEventBus.js';
import { createDeal, getDealById, updateDealStatus } from './deal.service.js';
import { makeDeal, testBrokerUser, testTraderUser, validCreateDealBody } from '../test/fixtures.js';

vi.mock('../repositories/deal.repository.js');
vi.mock('../services/audit.service.js');
vi.mock('../db/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'generated-deal-id'),
}));

beforeEach(() => {
  vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
    const tx = {} as Parameters<typeof fn>[0];
    return fn(tx);
  });
});

test('getDealById returns the deal when found', async () => {
  const deal = makeDeal();
  vi.mocked(dealRepo.findDealById).mockResolvedValue(deal);

  await expect(getDealById(deal.id)).resolves.toEqual(deal);
});

test('getDealById throws 404 when the deal is missing', async () => {
  vi.mocked(dealRepo.findDealById).mockResolvedValue(null);

  await expect(getDealById('missing')).rejects.toBeInstanceOf(HttpError);
  await expect(getDealById('missing')).rejects.toMatchObject({ statusCode: 404 });
});

test('createDeal persists at version 1, records audit, and publishes domain event', async () => {
  const persisted = makeDeal({ id: 'generated-deal-id', version: 1 });
  vi.mocked(dealRepo.insertDeal).mockResolvedValue(persisted);

  const result = await createDeal(validCreateDealBody, testBrokerUser);

  expect(result.version).toBe(1);
  expect(result.id).toBe('generated-deal-id');
  expect(dealRepo.insertDeal).toHaveBeenCalledWith(
    expect.objectContaining({ version: 1, status: 'NEW' }),
    expect.anything()
  );
  expect(auditService.recordDealCreated).toHaveBeenCalledWith(persisted, testBrokerUser, expect.anything());
  expect(dealEventBus.publish).toHaveBeenCalledWith({ type: 'DEAL_CREATED', deal: persisted });
});

test('createDeal honours an explicit initial status', async () => {
  const persisted = makeDeal({ id: 'generated-deal-id', status: 'PENDING', version: 1 });
  vi.mocked(dealRepo.insertDeal).mockResolvedValue(persisted);

  await createDeal({ ...validCreateDealBody, status: 'PENDING' }, testBrokerUser);

  expect(dealRepo.insertDeal).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'PENDING' }),
    expect.anything()
  );
});

test('updateDealStatus increments version, records audit, and publishes domain event', async () => {
  const existing = makeDeal({ id: 'deal-1', status: 'NEW', version: 1 });
  const updated = makeDeal({ id: 'deal-1', status: 'PENDING', version: 2 });
  vi.mocked(dealRepo.findDealById).mockResolvedValue(existing);
  vi.mocked(dealRepo.updateDeal).mockResolvedValue(updated);

  const result = await updateDealStatus('deal-1', 'PENDING', testTraderUser);

  expect(result.version).toBe(2);
  expect(dealRepo.updateDeal).toHaveBeenCalledWith(
    expect.objectContaining({ version: 2, status: 'PENDING' }),
    expect.anything()
  );
  expect(auditService.recordDealStatusChanged).toHaveBeenCalledWith(
    updated,
    testTraderUser,
    'NEW',
    'PENDING',
    expect.anything()
  );
  expect(dealEventBus.publish).toHaveBeenCalledWith({ type: 'DEAL_STATUS_CHANGED', deal: updated });
});

test('updateDealStatus throws 404 when the deal is missing', async () => {
  vi.mocked(dealRepo.findDealById).mockResolvedValue(null);

  await expect(updateDealStatus('missing', 'BOOKED', testTraderUser)).rejects.toMatchObject({
    statusCode: 404,
  });
});
