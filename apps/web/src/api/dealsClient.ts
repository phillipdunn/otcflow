import {
  AuditEventsArraySchema,
  DealSchema,
  DealsArraySchema,
  type AuditEvent,
  type Currency,
  type Deal,
  type DealStatus,
  type ProductType,
} from '@otcflow/shared';
import { requestJson } from './requestJson.js';

export { ApiRequestError, getApiBaseUrl } from './requestJson.js';

export async function fetchDeals(): Promise<Deal[]> {
  const json = await requestJson('/deals', { method: 'GET' });
  return DealsArraySchema.parse(json);
}

export interface CreateDealInput {
  product: ProductType;
  counterparty: string;
  notional: number;
  currency: Currency;
  price: number;
  trader: string;
  broker: string;
  status?: DealStatus;
}

export async function postDeal(body: CreateDealInput): Promise<Deal> {
  const json = await requestJson('/deals', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return DealSchema.parse(json);
}

export async function fetchDealAuditEvents(dealId: string): Promise<AuditEvent[]> {
  const json = await requestJson(`/deals/${encodeURIComponent(dealId)}/events`, { method: 'GET' });
  return AuditEventsArraySchema.parse(json);
}

export async function patchDealStatus(id: string, status: DealStatus): Promise<Deal> {
  const json = await requestJson(`/deals/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return DealSchema.parse(json);
}
