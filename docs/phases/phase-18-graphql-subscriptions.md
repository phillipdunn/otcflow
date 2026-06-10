# Phase 18 — GraphQL subscription integration tests (local notes)

**How phase docs are structured:** **Scope** → **Walkthrough (slow)** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

---

## Scope (what Phase 18 was)

- **End-to-end proof** of **`dealUpdated`** subscription path using **`graphql-ws`** client against the real server.
- Tests: **`createDeal`** → `DEAL_CREATED` on subscription; **`updateDealStatus`** → `DEAL_STATUS_CHANGED`.
- Asserts subscription payload: **`type`**, **`deal.id`**, **`deal.version`**, **`deal.status`**; confirms **no `sequenceNumber`** on GraphQL wire shape.
- Asserts **audit** still written with **acting user** via GraphQL `dealEvents` query.
- **`graphqlWsTestClient.ts`** — connect, subscribe, wait for next payload.
- **`integrationHttpServer.wsGraphQLUrl`** — shared test server exposes `/graphql` upgrade path.
- **Not added:** web blotter on GraphQL subscriptions; multi-subscriber load tests; broker-backed pubsub.

**Builds on:** [phase-13-graphql.md](phase-13-graphql.md), [phase-17-automated-testing.md](phase-17-automated-testing.md).

---

## What problem this solves

| Before | After |
| ------ | ----- |
| GraphQL HTTP tested; subs only unit-wired | Live `graphql-ws` client receives post-mutation events |
| Unclear if pubsub bridge works in production wiring | Same `index.ts` pattern exercised in integration setup |
| Two notification channels, one untested | Both `/ws/deals` and `dealUpdated` proven |

---

## Walkthrough (slow)

### 1. Test flow (create)

1. `createGraphQLWsTestClient(wsGraphQLUrl)` — `lazy: false`, `connectionParams['x-user-id']`.
2. `waitForGraphQLWsConnected`.
3. `waitForNextDealUpdated` (subscribe before mutate).
4. HTTP `POST /graphql` — `createDeal` mutation.
5. Await subscription payload; query `dealEvents` for audit.

### 2. Test flow (status)

1. Create deal via mutation (no subscription yet).
2. Subscribe; `updateDealStatus` mutation.
3. Assert `DEAL_STATUS_CHANGED`, version 2, audit actor.

### 3. Event path (unchanged product code)

```text
mutation → deal.service → dealEventBus.publish
  → wireDealEventBusToGraphQL → graphQLPubSub
  → dealUpdated resolver → graphql-ws client
```

Parallel: same bus event → `wireDealEventBusToWebSocket` → `/ws/deals`.

---

## Diagram

```text
graphql-ws client ──subscribe──► ws://host/graphql
                                      ▲
HTTP POST /graphql mutation ──► dealEventBus ──► graphQLPubSub
```

---

## Key files

- `apps/api/src/graphql/graphqlSubscriptions.integration.test.ts`
- `apps/api/src/test/graphqlWsTestClient.ts`
- `apps/api/src/test/integrationHttpServer.ts` (`wsGraphQLUrl`)
- `apps/api/src/graphql/wireDealEventBusToGraphQL.ts`, `attachGraphQLSubscriptions.ts`

---

## Checklist

- [ ] Integration test file passes with Postgres
- [ ] Subscription receives event **after** subscribe, **before** timeout
- [ ] Audit query confirms acting user on mutation

---

## Later

- Browser GraphQL subscription client (if blotter migrates off REST WS)
- Subscription auth / RBAC when real identity ships
- External pubsub (Redis, SNS) behind `dealUpdated`

---

## Review one-liner

**Phase 18** proves **GraphQL `dealUpdated` subscriptions end-to-end** — `graphql-ws` client, mutation, event bus, pubsub, and audit — without changing runtime behaviour.
