import type { Request, Response, NextFunction } from 'express';
import * as dealService from '../services/deal.service.js';
import { CreateDealBodySchema, UpdateDealStatusBodySchema } from '../validation/deal.validation.js';

export function listDeals(_req: Request, res: Response, next: NextFunction): void {
  try {
    res.status(200).json(dealService.listDeals());
  } catch (err) {
    next(err);
  }
}

export function getDealById(req: Request, res: Response, next: NextFunction): void {
  try {
    const deal = dealService.getDealById(req.params.id ?? '');
    res.status(200).json(deal);
  } catch (err) {
    next(err);
  }
}

export function createDeal(req: Request, res: Response, next: NextFunction): void {
  try {
    const body = CreateDealBodySchema.parse(req.body);
    const deal = dealService.createDeal(body);
    res.status(201).json(deal);
  } catch (err) {
    next(err);
  }
}

export function patchDealStatus(req: Request, res: Response, next: NextFunction): void {
  try {
    const body = UpdateDealStatusBodySchema.parse(req.body);
    const deal = dealService.updateDealStatus(req.params.id ?? '', body.status);
    res.status(200).json(deal);
  } catch (err) {
    next(err);
  }
}
