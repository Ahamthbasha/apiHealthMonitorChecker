// src/controllers/healthCheckController/healthCheckController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { IHealthCheckController } from './IHealthCheckController';
import { IHealthCheckService } from '../../../services/userService/userHealthCheckService/IHealthCheckService'; 
import { AppError } from '../../../utils/errorUtil/appError';

export class HealthCheckController implements IHealthCheckController {
  constructor(
    private healthCheckService: IHealthCheckService
  ) {}

  getEndpointHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      // Verify endpoint belongs to user (service will handle this)
      const history = await this.healthCheckService.getEndpointHistory(endpointId, limit);

      res.status(200).json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      next(error);
    }
  };

  getEndpointStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

      const stats = await this.healthCheckService.getEndpointStats(endpointId, hours);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  triggerManualCheck = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params;

      // Manual check
      const result = await this.healthCheckService.checkEndpoint(endpointId);

      res.status(200).json({
        success: true,
        message: 'Manual check completed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}