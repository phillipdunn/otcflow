import { expect, test } from 'vitest';
import { InMemoryDealEventBus } from './inMemoryDealEventBus.js';
import { makeDeal } from '../test/fixtures.js';

test('InMemoryDealEventBus delivers published events to subscribers', () => {
  const bus = new InMemoryDealEventBus();
  const received: unknown[] = [];
  bus.subscribe((event) => {
    received.push(event);
  });

  const deal = makeDeal({ id: 'deal-bus-1' });
  bus.publish({ type: 'DEAL_CREATED', deal });

  expect(received).toHaveLength(1);
  expect(received[0]).toEqual({ type: 'DEAL_CREATED', deal });
});

test('InMemoryDealEventBus supports multiple subscribers', () => {
  const bus = new InMemoryDealEventBus();
  let countA = 0;
  let countB = 0;
  bus.subscribe(() => {
    countA += 1;
  });
  bus.subscribe(() => {
    countB += 1;
  });

  bus.publish({ type: 'DEAL_STATUS_CHANGED', deal: makeDeal() });

  expect(countA).toBe(1);
  expect(countB).toBe(1);
});

test('InMemoryDealEventBus unsubscribe stops delivery', () => {
  const bus = new InMemoryDealEventBus();
  let count = 0;
  const unsubscribe = bus.subscribe(() => {
    count += 1;
  });

  bus.publish({ type: 'DEAL_PRICE_CHANGED', deal: makeDeal() });
  unsubscribe();
  bus.publish({ type: 'DEAL_AMENDED', deal: makeDeal() });

  expect(count).toBe(1);
});

test('InMemoryDealEventBus validates event shape on publish', () => {
  const bus = new InMemoryDealEventBus();
  expect(() =>
    bus.publish({ type: 'DEAL_CREATED', deal: { id: 'bad' } } as never)
  ).toThrow();
});
