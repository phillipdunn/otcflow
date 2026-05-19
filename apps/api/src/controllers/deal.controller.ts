import type { Request, Response, NextFunction } from 'express';
import * as auditService from '../services/audit.service.js';
import * as dealService from '../services/deal.service.js';
import { CreateDealBodySchema, UpdateDealStatusBodySchema } from '../validation/deal.validation.js';

export async function listDeals(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deals = await dealService.listDeals();
    res.status(200).json(deals);
  } catch (err) {
    next(err);
  }
}

export async function getDealById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deal = await dealService.getDealById(req.params.id ?? '');
    res.status(200).json(deal);
  } catch (err) {
    next(err);
  }
}

export async function listDealAuditEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await auditService.listDealAuditEvents(req.params.id ?? '');
    res.status(200).json(events);
  } catch (err) {
    next(err);
  }
}

export async function createDeal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = CreateDealBodySchema.parse(req.body);
    const deal = await dealService.createDeal(body, req.currentUser);
    res.status(201).json(deal);
  } catch (err) {
    next(err);
  }
}

export async function patchDealStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = UpdateDealStatusBodySchema.parse(req.body);
    const deal = await dealService.updateDealStatus(req.params.id ?? '', body.status, req.currentUser);
    res.status(200).json(deal);
  } catch (err) {
    next(err);
  }
}
