import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Deal, DealEvent } from '@otcflow/shared';
import { createTestQueryClient } from '../test/testUtils.js';
import { makeDeal } from '../test/fixtures.js';
import { dealQueryKeys } from './queryKeys.js';
import { useDealEventsWebSocket } from './useDealEventsWebSocket.js';

const simulatorStatus = {
  running: false,
  dealCount: 1,
  configuredDealCount: 2000,
  eventsEmitted: 0,
  lastSequenceNumber: 0,
  streamEpoch: 0,
  intervalMs: 1000,
};

vi.mock('../api/simulatorClient.js', () => ({
  fetchSimulatorStatus: vi.fn(() => Promise.resolve(simulatorStatus)),
}));

vi.mock('../api/requestJson.js', () => ({
  getDealsWebSocketUrl: () => 'ws://test.local/ws/deals',
}));

type MockWebSocketInstance = {
  onopen: ((ev: Event) => void) | null;
  onmessage: ((ev: MessageEvent) => void) | null;
  onclose: ((ev: CloseEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  close: ReturnType<typeof vi.fn>;
};

let latestSocket: MockWebSocketInstance | null = null;

function registerLatestMockSocket(socket: MockWebSocketInstance): void {
  latestSocket = socket;
}

class MockWebSocket {
  onopen: MockWebSocketInstance['onopen'] = null;
  onmessage: MockWebSocketInstance['onmessage'] = null;
  onclose: MockWebSocketInstance['onclose'] = null;
  onerror: MockWebSocketInstance['onerror'] = null;
  close = vi.fn();

  constructor(...args: unknown[]) {
    void args;
    registerLatestMockSocket(this);
    queueMicrotask(() => latestSocket?.onopen?.(new Event('open')));
  }
}

function sendDealEvent(event: DealEvent): void {
  if (!latestSocket?.onmessage) {
    throw new Error('WebSocket onmessage handler not registered');
  }
  latestSocket.onmessage({ data: JSON.stringify(event) } as MessageEvent);
}

function makeDealEvent(overrides: Partial<DealEvent> & Pick<DealEvent, 'sequenceNumber' | 'deal'>): DealEvent {
  return {
    type: 'DEAL_STATUS_CHANGED',
    ...overrides,
  };
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDealEventsWebSocket', () => {
  beforeEach(() => {
    latestSocket = null;
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('applies a newer deal version from an incoming WebSocket event', async () => {
    const queryClient = createTestQueryClient();
    const baseDeal = makeDeal({ id: 'deal-ws-1', version: 1, status: 'NEW' });
    queryClient.setQueryData<Deal[]>(dealQueryKeys.all, [baseDeal]);

    renderHook(() => useDealEventsWebSocket(), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(latestSocket).not.toBeNull());

    sendDealEvent(
      makeDealEvent({
        sequenceNumber: 1,
        deal: { ...baseDeal, version: 2, status: 'PENDING', updatedAt: '2025-06-01T11:00:00.000Z' },
      })
    );

    await waitFor(() => {
      const deals = queryClient.getQueryData<Deal[]>(dealQueryKeys.all);
      expect(deals).toHaveLength(1);
      expect(deals![0].version).toBe(2);
      expect(deals![0].status).toBe('PENDING');
    });
  });

  test('ignores stale deal version for an existing id', async () => {
    const queryClient = createTestQueryClient();
    const currentDeal = makeDeal({ id: 'deal-ws-2', version: 3, status: 'MATCHED' });
    queryClient.setQueryData<Deal[]>(dealQueryKeys.all, [currentDeal]);

    renderHook(() => useDealEventsWebSocket(), { wrapper: wrapper(queryClient) });
    await waitFor(() => expect(latestSocket).not.toBeNull());

    sendDealEvent(
      makeDealEvent({
        sequenceNumber: 2,
        deal: { ...currentDeal, version: 2, status: 'NEW' },
      })
    );

    const deals = queryClient.getQueryData<Deal[]>(dealQueryKeys.all);
    expect(deals![0]).toEqual(currentDeal);
  });

  test('ignores events with a lower or equal sequence number', async () => {
    const queryClient = createTestQueryClient();
    const baseDeal = makeDeal({ id: 'deal-ws-3', version: 1 });
    queryClient.setQueryData<Deal[]>(dealQueryKeys.all, [baseDeal]);

    renderHook(() => useDealEventsWebSocket(), { wrapper: wrapper(queryClient) });
    await waitFor(() => expect(latestSocket).not.toBeNull());

    sendDealEvent(
      makeDealEvent({
        sequenceNumber: 5,
        deal: { ...baseDeal, version: 2, status: 'PENDING' },
      })
    );

    await waitFor(() => {
      expect(queryClient.getQueryData<Deal[]>(dealQueryKeys.all)![0].version).toBe(2);
    });

    sendDealEvent(
      makeDealEvent({
        sequenceNumber: 4,
        deal: { ...baseDeal, version: 99, status: 'BOOKED' },
      })
    );

    const deals = queryClient.getQueryData<Deal[]>(dealQueryKeys.all);
    expect(deals![0].version).toBe(2);
    expect(deals![0].status).toBe('PENDING');
  });
});
