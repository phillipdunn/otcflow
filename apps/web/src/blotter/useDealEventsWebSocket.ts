import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DealEventSchema, type Deal, type DealEvent } from '@otcflow/shared';
import { fetchSimulatorStatus } from '../api/simulatorClient.js';
import { getDealsWebSocketUrl } from '../api/requestJson.js';
import { dealQueryKeys, simulatorQueryKeys } from './queryKeys.js';

/**
 * Merge a deal into the cached list by per-deal `version`.
 * Drops stale snapshots for the same id (`incoming.version <= existing.version`).
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
 * Subscribes to deal-events WebSocket for the app lifetime.
 * Ignores out-of-order stream events via global `sequenceNumber`, then merges by `deal.version`.
 * Refetches the deals snapshot after reconnect (gap fill).
 */
export function useDealEventsWebSocket(): void {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const lastSequenceRef = useRef(0);
  const streamEpochRef = useRef(0);

  useEffect(() => {
    void queryClient
      .fetchQuery({ queryKey: simulatorQueryKeys.status, queryFn: fetchSimulatorStatus })
      .then((status) => {
        streamEpochRef.current = status.streamEpoch;
        lastSequenceRef.current = status.lastSequenceNumber;
      })
      .catch(() => undefined);

    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.query.queryKey[0] !== 'simulator') return;
      const status = event.query.state.data as { streamEpoch?: number; lastSequenceNumber?: number } | undefined;
      if (!status || status.streamEpoch === undefined) return;
      if (status.streamEpoch !== streamEpochRef.current) {
        streamEpochRef.current = status.streamEpoch;
        lastSequenceRef.current = status.lastSequenceNumber ?? 0;
      }
    });

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

    const detachSocket = (ws: WebSocket) => {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
    };

    const connect = () => {
      clearReconnectTimer();

      const previous = wsRef.current;
      if (previous) {
        detachSocket(previous);
        previous.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(getDealsWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws) return;
        const wasReconnect = attemptRef.current > 0;
        attemptRef.current = 0;
        if (wasReconnect) {
          lastSequenceRef.current = 0;
          void queryClient.invalidateQueries({ queryKey: dealQueryKeys.all });
        }
      };

      ws.onmessage = (event) => {
        if (wsRef.current !== ws) return;
        try {
          const raw: unknown = JSON.parse(event.data as string);
          const parsed = DealEventSchema.parse(raw);

          if (parsed.sequenceNumber <= lastSequenceRef.current) {
            return;
          }
          lastSequenceRef.current = parsed.sequenceNumber;

          queryClient.setQueryData<Deal[]>(dealQueryKeys.all, (old) => applyDealEvent(old, parsed));
          void queryClient.invalidateQueries({ queryKey: dealQueryKeys.auditEvents(parsed.deal.id) });
        } catch {
          // Malformed or unexpected payload — ignore
        }
      };

      ws.onclose = () => {
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        if (mountedRef.current) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        if (wsRef.current !== ws) return;
        ws.close();
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      unsub();
      clearReconnectTimer();
      const ws = wsRef.current;
      if (ws) {
        detachSocket(ws);
        ws.close();
        wsRef.current = null;
      }
    };
  }, [queryClient]);
}
