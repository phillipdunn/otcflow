import { PubSub } from 'graphql-subscriptions';

/** Topic for deal domain events forwarded to GraphQL subscriptions. */
export const GRAPHQL_DEAL_UPDATED_TOPIC = 'DEAL_UPDATED';

/**
 * In-memory pub/sub for GraphQL subscriptions.
 * A managed service (AppSync, Apollo Router, etc.) would replace this with broker-backed fan-out.
 */
export const graphQLPubSub = new PubSub();
