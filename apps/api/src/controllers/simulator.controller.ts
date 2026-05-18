import type { Request, Response, NextFunction } from 'express';
import { SimulatorResetBodySchema, SimulatorStartBodySchema } from '@otcflow/shared';
import * as simulatorService from '../services/simulator.service.js';

export function getStatus(_req: Request, res: Response, next: NextFunction): void {
  try {
    res.status(200).json(simulatorService.getSimulatorStatus());
  } catch (err) {
    next(err);
  }
}

export function start(req: Request, res: Response, next: NextFunction): void {
  try {
    const body = SimulatorStartBodySchema.parse(req.body ?? {});
    const status = simulatorService.startSimulator(body);
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

export function stop(_req: Request, res: Response, next: NextFunction): void {
  try {
    const status = simulatorService.stopSimulator();
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

export function reset(req: Request, res: Response, next: NextFunction): void {
  try {
    const body = SimulatorResetBodySchema.parse(req.body ?? {});
    const status = simulatorService.resetSimulatorData(body.dealCount);
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}
