import { Router } from 'express';
import * as dealController from '../controllers/deal.controller.js';

export const dealsRouter = Router();

dealsRouter.get('/deals', dealController.listDeals);
dealsRouter.get('/deals/:id/events', dealController.listDealAuditEvents);
dealsRouter.get('/deals/:id', dealController.getDealById);
dealsRouter.post('/deals', dealController.createDeal);
dealsRouter.patch('/deals/:id/status', dealController.patchDealStatus);
