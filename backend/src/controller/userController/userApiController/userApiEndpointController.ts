
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware'; 
import { IApiEndpointController } from './IUserApiEndpointController'; 
import { IApiEndpointService } from '../../../services/userService/userApiService/IApiEndpointService'; 
import { AppError } from '../../../utils/errorUtil/appError'; 

export class ApiEndpointController implements IApiEndpointController {
  constructor(
    private endpointService: IApiEndpointService
  ) {}

  createEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { 
        name, url, method, headers, body, 
        expectedStatus, interval, timeout, thresholds 
      } = req.body;

      const endpoint = await this.endpointService.createEndpoint(req.user.userId, {
        name,
        url,
        method,
        headers,
        body,
        expectedStatus,
        interval,
        timeout,
        thresholds
      });

      res.status(201).json({
        success: true,
        message: 'API endpoint created successfully',
        data: endpoint
      });
    } catch (error) {
      next(error);
    }
  };

  getEndpointById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params;
      const endpoint = await this.endpointService.getEndpointById(endpointId, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Endpoint retrieved successfully',
        data: endpoint
      });
    } catch (error) {
      next(error);
    }
  };

  updateEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params; 
      const updateData = req.body;

      const endpoint = await this.endpointService.updateEndpoint(endpointId, req.user.userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Endpoint updated successfully',
        data: endpoint
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params;
      await this.endpointService.deleteEndpoint(endpointId, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Endpoint deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  toggleEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { endpointId } = req.params;
      const endpoint = await this.endpointService.toggleEndpoint(endpointId, req.user.userId);

      res.status(200).json({
        success: true,
        message: `Endpoint ${endpoint.isActive ? 'activated' : 'deactivated'} successfully`,
        data: endpoint
      });
    } catch (error) {
      next(error);
    }
  };
}