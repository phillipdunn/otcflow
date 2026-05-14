import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DealEventSchema, type Deal, type DealEvent } from '@otcflow/shared';
import { getDealsWebSocketUrl } from '../api/requestJson.js';
import { dealQueryKeys } from './queryKeys.js';

/**
 * Merge a deal into the cached list.
 *
 * **Stale / out-of-order protection (what this does):** if the same `id` already exists and
 * `incoming.version <= existing.version`, we keep the cache unchanged. That drops older snapshots
 * that arrive late (reordering on the wire), duplicate echoes after your own mutation + refetch,
 * and any event whose `version` did not advance.
 *
 * **Production challenges this does NOT solve (see desk / scaling notes):**
 * - **Bad `version` semantics** — if the server ever skips bumps or reuses numbers, we can accept
 *   garbage or reject good rows; the client trusts `version` as a per-deal logical clock.
 * - **One aggregate `Deal`** — one version cannot represent conflicting updates on different
 *   dimensions (e.g. status vs economics) unless the server always encodes them in one row.
 * - **Multiple publishers / split brain** — two sources of truth broadcasting the same `id`
 *   without a single ordering authority (bus, DB log, partition key) can still fight the cache.
 * - **Reconnect gap** — while disconnected we only apply pushed events we receive; missed events
 *   are not replayed here (a full snapshot refetch on reconnect or `lastEventId` would be next).
 * - **Cross-entity causality** — ordering across different ids is not validated; only per-id
 *   monotonic `version` is enforced.
 */
function mergeDealByVersion(current: Deal[] | undefined, incoming: Deal): Deal[] {
  const list = current ?? [];
  const index = list.findIndex((d) => d.id === incoming.id);
  if (index === -1) {
    return [...list, incoming];
  }
  const existing = list[index];
  if (incoming.version <= existing.version) {
    return list;
  }
  const next = [...list];
  next[index] = incoming;
  return next;
}

function applyDealEvent(current: Deal[] | undefined, event: DealEvent): Deal[] {
  return mergeDealByVersion(current, event.deal);
}

/**
 * Subscribes to the API deal-events socket for the app lifetime. Updates TanStack Query `['deals']` cache
 * when valid events arrive. Reconnects with exponential backoff after disconnect.
 */
export function useDealEventsWebSocket(): void {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      clearReconnectTimer();
      if (!mountedRef.current) return;
      const attempt = attemptRef.current;
      const delayMs = Math.min(30_000, 1000 * 2 ** attempt);
      reconnectTimerRef.current = setTimeout(() => {
        attemptRef.current = attempt + 1;
        connect();
      }, delayMs);
    };

    const connect = () => {
      clearReconnectTimer();
      const ws = new WebSocket(getDealsWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const raw: unknown = JSON.parse(event.data as string);
          const parsed = DealEventSchema.parse(raw);
          queryClient.setQueryData<Deal[]>(dealQueryKeys.all, (old) => applyDealEvent(old, parsed));
        } catch {
          // Malformed or unexpected payload — ignore
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (mountedRef.current) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      clearReconnectTimer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [queryClient]);
}
