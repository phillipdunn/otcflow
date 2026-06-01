import { expect, test, vi } from 'vitest';
import { InMemoryDealEventBus } from './inMemoryDealEventBus.js';
import { wireDealEventBusToWebSocket } from './wireDealEventBusToWebSocket.js';
import { makeDeal } from '../test/fixtures.js';

vi.mock('../ws/dealsWs.js', () => ({
  broadcastDealEventToClients: vi.fn(),
}));

import { broadcastDealEventToClients } from '../ws/dealsWs.js';

test('wireDealEventBusToWebSocket forwards domain events to WebSocket clients', () => {
  const bus = new InMemoryDealEventBus();
  const unsubscribe = wireDealEventBusToWebSocket(bus);
  const deal = makeDeal({ id: 'deal-wire-1' });

  bus.publish({ type: 'DEAL_CREATED', deal });

  expect(broadcastDealEventToClients).toHaveBeenCalledWith({ type: 'DEAL_CREATED', deal });
  unsubscribe();
});
