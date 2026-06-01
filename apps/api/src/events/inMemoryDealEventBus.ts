import { DomainDealEventSchema, type DomainDealEvent } from '@otcflow/shared';
import type { DealEventBus, DomainDealEventHandler } from './eventBus.types.js';

/**
 * In-process event bus — synchronous dispatch to local subscribers.
 *
 * Replace this module with a broker-backed adapter that:
 * 1. Serializes `DomainDealEvent` to the wire format your broker expects.
 * 2. Publishes to a topic (e.g. `deals.events`).
 * 3. Runs consumer workers that call the same `DomainDealEventHandler` shape.
 *
 * The rest of the application (deal service, simulator, WebSocket bridge) stays unchanged.
 */
export class InMemoryDealEventBus implements DealEventBus {
  private readonly handlers = new Set<DomainDealEventHandler>();

  publish(event: DomainDealEvent): void {
    const validated = DomainDealEventSchema.parse(event);
    for (const handler of this.handlers) {
      handler(validated);
    }
  }

  subscribe(handler: DomainDealEventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /** Test helper — remove all subscribers between cases. */
  clearSubscribers(): void {
    this.handlers.clear();
  }

  subscriberCount(): number {
    return this.handlers.size;
  }
}
