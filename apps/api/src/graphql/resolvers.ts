import type { IResolvers } from '@graphql-tools/utils';
import type { DealStatus, ProductType, Currency } from '@otcflow/shared';
import * as auditService from '../services/audit.service.js';
import * as dealService from '../services/deal.service.js';
import { CreateDealBodySchema } from '../validation/deal.validation.js';
import type { GraphQLContext } from './context.js';
import { GRAPHQL_DEAL_UPDATED_TOPIC, graphQLPubSub } from './graphQLPubSub.js';
import { toGraphQLError } from './toGraphQLError.js';

interface CreateDealInputGql {
  product: ProductType;
  counterparty: string;
  notional: number;
  currency: Currency;
  price: number;
  status?: DealStatus;
  trader: string;
  broker: string;
}

export const resolvers: IResolvers<unknown, GraphQLContext> = {
  Query: {
    deals: async () => dealService.listDeals(),
    deal: async (_parent, args: { id: string }) => {
      try {
        return await dealService.getDealById(args.id);
      } catch (err) {
        toGraphQLError(err);
      }
    },
    dealEvents: async (_parent, args: { dealId: string }) => {
      try {
        return await auditService.listDealAuditEvents(args.dealId);
      } catch (err) {
        toGraphQLError(err);
      }
    },
  },
  Mutation: {
    createDeal: async (_parent, args: { input: CreateDealInputGql }, ctx) => {
      try {
        const body = CreateDealBodySchema.parse(args.input);
        return await dealService.createDeal(body, ctx.currentUser);
      } catch (err) {
        toGraphQLError(err);
      }
    },
    updateDealStatus: async (
      _parent,
      args: { id: string; status: DealStatus },
      ctx
    ) => {
      try {
        return await dealService.updateDealStatus(args.id, args.status, ctx.currentUser);
      } catch (err) {
        toGraphQLError(err);
      }
    },
  },
  Subscription: {
    dealUpdated: {
      subscribe: () => graphQLPubSub.asyncIterableIterator([GRAPHQL_DEAL_UPDATED_TOPIC]),
    },
  },
};
