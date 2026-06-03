import { expect, test, vi } from 'vitest';
import { InMemoryDealEventBus } from '../events/inMemoryDealEventBus.js';
import { wireDealEventBusToGraphQL } from './wireDealEventBusToGraphQL.js';
import { GRAPHQL_DEAL_UPDATED_TOPIC, graphQLPubSub } from './graphQLPubSub.js';
import { makeDeal } from '../test/fixtures.js';

test('wireDealEventBusToGraphQL publishes domain events to GraphQL pubsub', async () => {
  const bus = new InMemoryDealEventBus();
  const publishSpy = vi.spyOn(graphQLPubSub, 'publish');
  const unsubscribe = wireDealEventBusToGraphQL(bus);
  const deal = makeDeal({ id: 'gql-sub-1' });

  bus.publish({ type: 'DEAL_CREATED', deal });

  expect(publishSpy).toHaveBeenCalledWith(GRAPHQL_DEAL_UPDATED_TOPIC, {
    dealUpdated: { type: 'DEAL_CREATED', deal },
  });

  publishSpy.mockRestore();
  unsubscribe();
});
