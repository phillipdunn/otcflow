import { Router } from 'express';
import * as simulatorController from '../controllers/simulator.controller.js';

export const simulatorRouter = Router();

simulatorRouter.get('/simulator/status', simulatorController.getStatus);
simulatorRouter.post('/simulator/start', simulatorController.start);
simulatorRouter.post('/simulator/stop', simulatorController.stop);
simulatorRouter.post('/simulator/reset', simulatorController.reset);
