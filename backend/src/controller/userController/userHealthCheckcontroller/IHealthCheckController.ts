// src/controllers/healthCheckController/IHealthCheckController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';

export interface IHealthCheckController {
  getEndpointHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
  getEndpointStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
  triggerManualCheck(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}