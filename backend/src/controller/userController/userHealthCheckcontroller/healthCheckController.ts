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

  getAllHealthChecks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const status = req.query.status as string || 'all'

      if (page < 1 || limit < 1 || limit > 100) {
        throw new AppError('Invalid pagination parameters. Page must be >= 1, limit between 1 and 100', 400);
      }

      if (status !== 'all' && !['success', 'failure', 'timeout'].includes(status)) {
      throw new AppError('Invalid status filter. Must be all, success, failure, or timeout', 400);
    }

      const result = await this.healthCheckService.getAllHealthChecks(endpointId, page, limit,status);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: result.limit
        },
        message: 'Health checks retrieved successfully'
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

  getRecentHealthChecks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const recentChecks = await this.healthCheckService.getRecentHealthChecks(
        endpointId,
        limit
      );

      res.status(200).json({
        success: true,
        data: recentChecks,
        count: recentChecks.length,
        message: 'Recent health checks retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}