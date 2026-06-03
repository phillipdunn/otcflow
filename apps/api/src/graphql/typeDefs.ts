export const typeDefs = /* GraphQL */ `
  enum UserRole {
    BROKER
    TRADER
    SUPERVISOR
    OPERATIONS
  }

  enum ProductType {
    BOND
    CDS
    CDX
    EQUITY_OPTION
    EQUITY_SWAP
    FX_NDF
    FX_OPTION
    FX_SWAP
    IRS
    OIS
  }

  enum DealStatus {
    NEW
    PENDING
    MATCHED
    CANCELLED
    BOOKED
  }

  enum Currency {
    GBP
    USD
    EUR
  }

  enum AuditEventType {
    DEAL_CREATED
    DEAL_STATUS_CHANGED
    DEAL_AMENDED
    DEAL_PRICE_CHANGED
  }

  enum DomainDealEventType {
    DEAL_CREATED
    DEAL_STATUS_CHANGED
    DEAL_PRICE_CHANGED
    DEAL_AMENDED
  }

  type User {
    id: ID!
    name: String!
    role: UserRole!
  }

  type Deal {
    id: ID!
    product: ProductType!
    counterparty: String!
    notional: Float!
    currency: Currency!
    price: Float!
    status: DealStatus!
    trader: String!
    broker: String!
    createdAt: String!
    updatedAt: String!
    version: Int!
  }

  type AuditEvent {
    id: ID!
    dealId: ID!
    type: AuditEventType!
    timestamp: String!
    user: User!
    summary: String!
    previousValue: String
    newValue: String
    version: Int!
  }

  type DealDomainEvent {
    type: DomainDealEventType!
    deal: Deal!
  }

  input CreateDealInput {
    product: ProductType!
    counterparty: String!
    notional: Float!
    currency: Currency!
    price: Float!
    status: DealStatus
    trader: String!
    broker: String!
  }

  type Query {
    deals: [Deal!]!
    deal(id: ID!): Deal
    dealEvents(dealId: ID!): [AuditEvent!]!
  }

  type Mutation {
    createDeal(input: CreateDealInput!): Deal!
    updateDealStatus(id: ID!, status: DealStatus!): Deal!
  }

  type Subscription {
    dealUpdated: DealDomainEvent!
  }
`;
