import { http, HttpResponse } from 'msw';
import type { AuditEvent, Deal } from '@otcflow/shared';
import { API_BASE_URL } from './constants.js';

export function auditEventsForDeal(dealId: string, events: AuditEvent[]) {
  return http.get(`${API_BASE_URL}/deals/${encodeURIComponent(dealId)}/events`, () =>
    HttpResponse.json(events)
  );
}

export function postDealCreates(created: Deal, onRequest?: (request: Request) => void) {
  return http.post(`${API_BASE_URL}/deals`, async ({ request }) => {
    onRequest?.(request);
    return HttpResponse.json(created, { status: 201 });
  });
}
