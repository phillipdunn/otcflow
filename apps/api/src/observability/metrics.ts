import type { SimulatorStatus } from '@otcflow/shared';
import { getActiveDealWebSocketClients } from '../ws/dealsWs.js';
import { getActiveGraphQLSubscriptionClients } from '../graphql/graphqlWsMetrics.js';
import { getSimulatorStatus } from '../services/simulator.service.js';

const startedAt = Date.now();

let totalRequests = 0;
let errorCount = 0;
const requestsByRoute = new Map<string, number>();

export function recordRequest(routeKey: string): void {
  totalRequests += 1;
  requestsByRoute.set(routeKey, (requestsByRoute.get(routeKey) ?? 0) + 1);
}

export function recordError(): void {
  errorCount += 1;
}

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}

export function resetMetricsForTests(): void {
  totalRequests = 0;
  errorCount = 0;
  requestsByRoute.clear();
}

export interface MetricsSnapshot {
  uptimeSeconds: number;
  totalRequests: number;
  requestsByRoute: Record<string, number>;
  errorCount: number;
  activeWebSocketClients: number;
  activeDealWebSocketClients: number;
  activeGraphQLSubscriptionClients: number;
  simulator: SimulatorStatus;
}

export async function collectMetrics(): Promise<MetricsSnapshot> {
  const simulator = await getSimulatorStatus();
  const dealWs = getActiveDealWebSocketClients();
  const gqlWs = getActiveGraphQLSubscriptionClients();

  return {
    uptimeSeconds: getUptimeSeconds(),
    totalRequests,
    requestsByRoute: Object.fromEntries(requestsByRoute.entries()),
    errorCount,
    activeWebSocketClients: dealWs + gqlWs,
    activeDealWebSocketClients: dealWs,
    activeGraphQLSubscriptionClients: gqlWs,
    simulator,
  };
}
