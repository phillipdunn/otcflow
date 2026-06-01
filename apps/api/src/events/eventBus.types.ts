import type { DomainDealEvent } from '@otcflow/shared';

/** Handler invoked when a domain event is published. */
export type DomainDealEventHandler = (event: DomainDealEvent) => void;

/**
 * Internal publish/subscribe port for deal domain events.
 *
 * Production implementations could swap the in-memory bus for:
 * - AMQP / RabbitMQ (topic exchanges, durable queues)
 * - Solace PubSub+ (enterprise messaging)
 * - Apache Kafka (log-based streaming, multiple consumer groups)
 * - AWS SNS + SQS (fan-out + worker queues)
 * - AWS EventBridge (event routing and rules)
 *
 * Services would publish to the broker; WebSocket, analytics, and audit
 * consumers would subscribe on separate channels — same pattern as here.
 */
export interface DealEventBus {
  publish(event: DomainDealEvent): void;
  /** Returns an unsubscribe function. */
  subscribe(handler: DomainDealEventHandler): () => void;
}
