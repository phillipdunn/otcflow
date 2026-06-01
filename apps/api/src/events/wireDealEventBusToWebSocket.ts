import type { DealEventBus } from './eventBus.types.js';
import { broadcastDealEventToClients } from '../ws/dealsWs.js';

/**
 * Bridge: domain events on the internal bus → WebSocket clients.
 *
 * In a broker-backed deployment this would be a dedicated consumer service
 * (or ECS task) that subscribes to the `deals.events` topic and pushes
 * to connected browsers — decoupled from the API write path.
 */
export function wireDealEventBusToWebSocket(bus: DealEventBus): () => void {
  return bus.subscribe((event) => {
    broadcastDealEventToClients(event);
  });
}
