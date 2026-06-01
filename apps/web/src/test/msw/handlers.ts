import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from './constants.js';

/** Default handlers — tests override with `server.use()` for specific scenarios. */
export const handlers = [
  http.get(`${API_BASE_URL}/deals`, () => HttpResponse.json([])),
  http.get(`${API_BASE_URL}/deals/:dealId/events`, () => HttpResponse.json([])),
];
