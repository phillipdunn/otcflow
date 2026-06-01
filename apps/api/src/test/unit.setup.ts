import { beforeEach, vi } from 'vitest';

/** Silence WebSocket client broadcasts in unit tests. */
vi.mock('../ws/dealsWs.js', () => ({
  broadcastDealEventToClients: vi.fn(),
  attachDealsWebSocket: vi.fn(),
  resetDealEventSequence: vi.fn(),
  getLastDealEventSequence: vi.fn(() => 0),
}));

vi.mock('../events/dealEventBus.js', () => ({
  dealEventBus: {
    publish: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});
