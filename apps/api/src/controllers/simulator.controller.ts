import type { Request, Response, NextFunction } from 'express';
import { SimulatorResetBodySchema, SimulatorStartBodySchema } from '@otcflow/shared';
import * as simulatorService from '../services/simulator.service.js';

export async function getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await simulatorService.getSimulatorStatus();
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

export async function start(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = SimulatorStartBodySchema.parse(req.body ?? {});
    const status = await simulatorService.startSimulator(body);
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

export async function stop(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await simulatorService.stopSimulator();
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

export async function reset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = SimulatorResetBodySchema.parse(req.body ?? {});
    const status = await simulatorService.resetSimulatorData(body.dealCount);
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}
