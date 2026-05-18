import { SimulatorStatusSchema, type SimulatorStatus } from '@otcflow/shared';
import { requestJson } from './requestJson.js';

export async function fetchSimulatorStatus(): Promise<SimulatorStatus> {
  const json = await requestJson('/simulator/status', { method: 'GET' });
  return SimulatorStatusSchema.parse(json);
}

export async function startSimulator(intervalMs?: number): Promise<SimulatorStatus> {
  const json = await requestJson('/simulator/start', {
    method: 'POST',
    body: JSON.stringify(intervalMs !== undefined ? { intervalMs } : {}),
  });
  return SimulatorStatusSchema.parse(json);
}

export async function stopSimulator(): Promise<SimulatorStatus> {
  const json = await requestJson('/simulator/stop', { method: 'POST', body: '{}' });
  return SimulatorStatusSchema.parse(json);
}

export async function resetSimulatorData(dealCount?: number): Promise<SimulatorStatus> {
  const json = await requestJson('/simulator/reset', {
    method: 'POST',
    body: JSON.stringify(dealCount !== undefined ? { dealCount } : {}),
  });
  return SimulatorStatusSchema.parse(json);
}
