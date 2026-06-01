import { beforeEach, vi } from 'vitest';

/** Silence deal WebSocket broadcasts in unit tests. */
vi.mock('../ws/dealsWs.js', () => ({
  broadcastDealEvent: vi.fn(),
  attachDealsWebSocket: vi.fn(),
  resetDealEventSequence: vi.fn(),
  getLastDealEventSequence: vi.fn(() => 0),
}));

beforeEach(() => {
  vi.clearAllMocks();
});
