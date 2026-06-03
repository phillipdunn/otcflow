import type { DealEventBus } from '../events/eventBus.types.js';
import { GRAPHQL_DEAL_UPDATED_TOPIC, graphQLPubSub } from './graphQLPubSub.js';

/**
 * Bridge internal domain events → GraphQL subscription pub/sub.
 * Same bus event that feeds `/ws/deals` also feeds `dealUpdated` subscribers.
 */
export function wireDealEventBusToGraphQL(bus: DealEventBus): () => void {
  return bus.subscribe((event) => {
    void graphQLPubSub.publish(GRAPHQL_DEAL_UPDATED_TOPIC, { dealUpdated: event });
  });
}
