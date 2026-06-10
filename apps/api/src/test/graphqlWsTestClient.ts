import { createClient, type Client } from 'graphql-ws';
import WebSocket from 'ws';

const DEAL_UPDATED_SUBSCRIPTION = /* GraphQL */ `
  subscription OnDealUpdated {
    dealUpdated {
      type
      deal {
        id
        version
        status
      }
    }
  }
`;

export type DealUpdatedPayload = {
  type: string;
  deal: {
    id: string;
    version: number;
    status: string;
  };
};

/** graphql-ws client for subscription integration tests (Node uses the `ws` package). */
export function createGraphQLWsTestClient(url: string, userId?: string): Client {
  return createClient({
    url,
    webSocketImpl: WebSocket,
    lazy: false,
    connectionParams: userId ? { 'x-user-id': userId } : {},
  });
}

/** Resolves when the graphql-ws connection handshake completes. */
export function waitForGraphQLWsConnected(client: Client, timeoutMs = 5_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for GraphQL WebSocket connection')),
      timeoutMs
    );
    const dispose = client.on('connected', () => {
      clearTimeout(timer);
      dispose();
      resolve();
    });
  });
}

/**
 * Subscribe to `dealUpdated` and resolve on the next payload.
 * Call before triggering a mutation so the subscription is active.
 */
export function waitForNextDealUpdated(
  client: Client,
  timeoutMs = 5_000
): Promise<DealUpdatedPayload> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timed out waiting for dealUpdated subscription payload'));
    }, timeoutMs);

    const unsubscribe = client.subscribe(
      { query: DEAL_UPDATED_SUBSCRIPTION },
      {
        next: (result) => {
          if (result.errors?.length) {
            clearTimeout(timer);
            unsubscribe();
            reject(result.errors);
            return;
          }
          const payload = result.data?.dealUpdated as DealUpdatedPayload | undefined;
          if (!payload) return;
          clearTimeout(timer);
          unsubscribe();
          resolve(payload);
        },
        error: (err) => {
          clearTimeout(timer);
          reject(err);
        },
        complete: () => {
          clearTimeout(timer);
          reject(new Error('Subscription completed before receiving dealUpdated'));
        },
      }
    );
  });
}
